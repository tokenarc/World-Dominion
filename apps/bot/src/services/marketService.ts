import { db } from '../lib/firebase-admin';
import { Player, Nation, saveWorldEvent, saveTransaction } from './firebaseService';
import * as fs from 'fs';
import * as path from 'path';

// Load marketplace configuration
const marketplaceConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/economics/marketplaces_config.json'), 'utf8'));

export interface MarketListing {
  id: string;
  sellerId: string;
  itemId: string;
  price: number;
  currency: 'WRB' | 'CP';
  expiresAt: number;
  active: boolean;
}

/**
 * Buy an item from the official marketplace
 */
export const buyItem = async (playerId: string, itemId: string, currency: 'WRB' | 'CP') => {
  const playerRef = db.collection('players').doc(playerId);
  const playerDoc = await playerRef.get();
  if (!playerDoc.exists) throw new Error('Player not found');
  const player = playerDoc.data() as Player;

  // Find item in marketplace config
  let item: any = null;
  let marketplace: any = null;
  for (const mp of marketplaceConfig.marketplaces) {
    item = mp.items?.find((i: any) => i.id === itemId);
    if (item) {
      marketplace = mp;
      break;
    }
  }

  if (!item) throw new Error('Item not found in marketplaces');

  // Validate currency and cost
  const cost = currency === 'WRB' ? item.cost_wrb : item.cost_cp;
  if (cost === null || cost === undefined) throw new Error(`Item cannot be bought with ${currency}`);

  const playerBalance = currency === 'WRB' ? player.stats.warBonds : player.stats.commandPoints;
  if (playerBalance < cost) throw new Error(`Insufficient ${currency} balance`);

  // Apply 3% marketplace tax -> nation treasury
  const taxRate = marketplace.tax_pct / 100 || 0.03;
  const taxAmount = Math.floor(cost * taxRate);
  const netCost = cost; // Player pays full cost, tax is taken from it or added? 
  // Standard logic: Player pays 'cost', tax is deducted from 'cost' and sent to treasury.
  const treasuryAmount = taxAmount;

  // Update player balance
  const newBalance = playerBalance - cost;
  const updateData: any = {};
  if (currency === 'WRB') updateData['stats.warBonds'] = newBalance;
  else updateData['stats.commandPoints'] = newBalance;
  
  await playerRef.update(updateData);

  // Update nation treasury if player belongs to a nation
  if (player.nationId) {
    const nationRef = db.collection('nations').doc(player.nationId.toUpperCase());
    const nationDoc = await nationRef.get();
    if (nationDoc.exists) {
      const nation = nationDoc.data() as Nation;
      await nationRef.update({
        treasury: (nation.treasury || 0) + treasuryAmount
      });
    }
  }

  // Apply item effect (placeholder for effect application logic)
  console.log(`Applying effect: ${item.effect} to player ${playerId}`);

  // Log transaction
  await saveTransaction({
    playerId,
    type: 'BUY_ITEM',
    itemId,
    cost,
    currency,
    taxAmount,
    timestamp: Date.now()
  });

  return { success: true, newBalance, item };
};

/**
 * List an item for P2P sale
 */
export const listP2PItem = async (sellerId: string, itemId: string, price: number, currency: 'WRB' | 'CP') => {
  const listingRef = db.collection('marketListings').doc();
  const expiresAt = Date.now() + (48 * 60 * 60 * 1000); // 48-hour expiry

  const listing: MarketListing = {
    id: listingRef.id,
    sellerId,
    itemId,
    price,
    currency,
    expiresAt,
    active: true
  };

  await listingRef.set(listing);
  return listing;
};

/**
 * Buy an item from a P2P listing
 */
export const buyP2PItem = async (buyerId: string, listingId: string) => {
  const listingRef = db.collection('marketListings').doc(listingId);
  const listingDoc = await listingRef.get();
  
  if (!listingDoc.exists) throw new Error('Listing not found');
  const listing = listingDoc.data() as MarketListing;

  if (!listing.active || listing.expiresAt < Date.now()) {
    throw new Error('Listing is no longer active');
  }

  const buyerRef = db.collection('players').doc(buyerId);
  const sellerRef = db.collection('players').doc(listing.sellerId);
  
  const [buyerDoc, sellerDoc] = await Promise.all([buyerRef.get(), sellerRef.get()]);
  if (!buyerDoc.exists || !sellerDoc.exists) throw new Error('Buyer or seller not found');

  const buyer = buyerDoc.data() as Player;
  const seller = sellerDoc.data() as Player;

  const price = listing.price;
  const buyerBalance = listing.currency === 'WRB' ? buyer.stats.warBonds : buyer.stats.commandPoints;

  if (buyerBalance < price) throw new Error('Insufficient balance');

  // Apply 3% tax
  const taxAmount = Math.floor(price * 0.03);
  const sellerProceeds = price - taxAmount;

  // Transfer funds
  const buyerUpdate: any = {};
  const sellerUpdate: any = {};

  if (listing.currency === 'WRB') {
    buyerUpdate['stats.warBonds'] = buyer.stats.warBonds - price;
    sellerUpdate['stats.warBonds'] = seller.stats.warBonds + sellerProceeds;
  } else {
    buyerUpdate['stats.commandPoints'] = buyer.stats.commandPoints - price;
    sellerUpdate['stats.commandPoints'] = seller.stats.commandPoints + sellerProceeds;
  }

  await Promise.all([
    buyerRef.update(buyerUpdate),
    sellerRef.update(sellerUpdate),
    listingRef.update({ active: false })
  ]);

  // Transfer item (placeholder: add to buyer's inventory)
  console.log(`Transferring item ${listing.itemId} from ${listing.sellerId} to ${buyerId}`);

  // Notify seller (placeholder for notification service)
  console.log(`Notifying seller ${listing.sellerId} that item ${listing.itemId} was sold`);

  return { success: true, buyerNewBalance: buyerUpdate };
};

/**
 * Start a territory auction
 */
export const auctionTerritory = async (territoryId: string) => {
  const auctionRef = db.collection('auctions').doc(territoryId);
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7-day auction

  await auctionRef.set({
    territoryId,
    status: 'active',
    highestBid: 0,
    highestBidder: null,
    expiresAt,
    minBid: 500, // From config
    currency: 'WRB'
  });

  await saveWorldEvent({
    title: 'Territory Auction Started',
    description: `A strategic territory (${territoryId}) is now up for auction!`,
    timestamp: Date.now(),
    type: 'economy',
    affectedNations: []
  });
};

/**
 * Place a bid on a territory auction
 */
export const placeBid = async (playerId: string, territoryId: string, bidAmount: number) => {
  const auctionRef = db.collection('auctions').doc(territoryId);
  const auctionDoc = await auctionRef.get();

  if (!auctionDoc.exists) throw new Error('Auction not found');
  const auction = auctionDoc.data()!;

  if (auction.status !== 'active' || auction.expiresAt < Date.now()) {
    throw new Error('Auction is closed');
  }

  if (bidAmount <= auction.highestBid) {
    throw new Error('Bid must be higher than current highest bid');
  }

  const playerRef = db.collection('players').doc(playerId);
  const playerDoc = await playerRef.get();
  const player = playerDoc.data() as Player;

  if (player.stats.warBonds < bidAmount) {
    throw new Error('Insufficient War Bonds for bid');
  }

  // Refund previous bidder (if any)
  if (auction.highestBidder) {
    const prevBidderRef = db.collection('players').doc(auction.highestBidder);
    await prevBidderRef.update({
      'stats.warBonds': db.FieldValue.increment(auction.highestBid)
    });
  }

  // Deduct bid from new bidder
  await playerRef.update({
    'stats.warBonds': db.FieldValue.increment(-bidAmount)
  });

  // Update auction
  await auctionRef.update({
    highestBid: bidAmount,
    highestBidder: playerId
  });

  return { success: true, highestBid: bidAmount };
};
