import { db } from '../lib/firebase-admin';

import { Nation, saveWorldEvent } from './firebaseService';
import * as fs from 'fs';
import * as path from 'path';

// Load configurations
const liquiditySystem = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/liquidity_system.json'), 'utf8'));
const ideologies = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/economics/ideologies.json'), 'utf8'));

export interface EconomicModifier {
  type: 'sanction' | 'occupation' | 'industry_health' | 'ideology';
  value: number;
  description: string;
}

/**
 * Fetch GDP data from World Bank and update Firestore
 */
export const syncGDPFromWorldBank = async () => {
  try {
    const url = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&mrv=1&per_page=300';
    const response = await fetch(url);
    
    if (!await response.json() || !await response.json()[1]) {
      console.error('Invalid response from World Bank API');
      return;
    }

    const gdpData = await response.json()[1];
    const batch = db.batch();
    let updatesCount = 0;

    for (const entry of gdpData) {
      const countryCode = entry.countryiso3code;
      const gdpValue = entry.value;

      if (countryCode && gdpValue) {
        const nationRef = db.collection('nations').doc(countryCode);
        const nationDoc = await nationRef.get();

        if (nationDoc.exists) {
          const currentData = nationDoc.data() as Nation;
          const oldGDP = currentData.baseGDP || 0;
          
          // Detect major changes (e.g., > 10% change)
          if (oldGDP > 0 && Math.abs((gdpValue - oldGDP) / oldGDP) > 0.1) {
            await saveWorldEvent({
              title: `Economic Shift in ${currentData.name}`,
              description: `Major GDP fluctuation detected for ${currentData.name}. Global markets are reacting.`,
              timestamp: Date.now(),
              type: 'economy',
              affectedNations: [countryCode]
            });
          }

          batch.update(nationRef, { 
            baseGDP: gdpValue,
            lastGDPSync: Date.now()
          });
          updatesCount++;
        }
      }
    }

    await batch.commit();
    console.log(`Successfully synced GDP for ${updatesCount} nations.`);
  } catch (error) {
    console.error('Error syncing GDP from World Bank:', error);
  }
};

/**
 * Calculate adjusted GDP based on modifiers
 */
export const calculateNationGDP = async (nationId: string): Promise<number> => {
  const nationRef = db.collection('nations').doc(nationId.toUpperCase());
  const doc = await nationRef.get();

  if (!doc.exists) return 0;
  const nation = doc.data() as Nation;

  const baseGDP = nation.baseGDP || 0;
  
  // 1. Ideology Multiplier
  const ideology = ideologies.ideologies.find((i: any) => i.id === nation.ideology);
  const ideologyMultiplier = ideology ? ideology.gdp_multiplier : 1.0;

  // 2. Sanctions Modifier
  // Sanctions are stored in nation.sanctionedBy array
  const sanctionsCount = (nation.sanctionedBy || []).length;
  let sanctionsMultiplier = 1.0;
  if (sanctionsCount > 0) {
    // Basic logic: each sanction reduces GDP by a certain percentage
    // In a real implementation, we'd look up the specific level of each sanction
    sanctionsMultiplier = Math.max(0.1, 1.0 - (sanctionsCount * 0.05));
  }

  // 3. Occupation Modifier
  const occupationMultiplier = nation.isOccupied ? 0.5 : 1.0;

  // 4. Industry Health
  const industryHealth = nation.industryHealth || 100; // 0 to 100
  const industryMultiplier = industryHealth / 100;

  const adjustedGDP = baseGDP * ideologyMultiplier * sanctionsMultiplier * occupationMultiplier * industryMultiplier;
  
  return adjustedGDP;
};

/**
 * Apply diplomatic sanctions to a target nation
 */
export const applySanctions = async (targetNationId: string, senderNationId: string, level: 'light' | 'medium' | 'heavy' | 'total_embargo') => {
  const targetRef = db.collection('nations').doc(targetNationId.toUpperCase());
  const targetDoc = await targetRef.get();

  if (!targetDoc.exists) return;
  const targetData = targetDoc.data() as Nation;

  const sanctionedBy = targetData.sanctionedBy || [];
  if (!sanctionedBy.includes(senderNationId)) {
    sanctionedBy.push(senderNationId);
  }

  // Update target nation
  await targetRef.update({ sanctionedBy });

  // Post diplomatic event
  await saveWorldEvent({
    title: `Sanctions Imposed on ${targetData.name}`,
    description: `${senderNationId} has imposed ${level.replace('_', ' ')} sanctions on ${targetData.name}.`,
    timestamp: Date.now(),
    type: 'politics',
    affectedNations: [targetNationId, senderNationId]
  });

  // Trigger NPC decision (placeholder for npcService)
  console.log(`Triggering NPC decision for ${targetNationId} due to sanctions from ${senderNationId}`);
};

/**
 * Extract resources from controlled territories
 */
export const resourceExtraction = async (nationId: string) => {
  const nationRef = db.collection('nations').doc(nationId.toUpperCase());
  const nationDoc = await nationRef.get();
  if (!nationDoc.exists) return;

  const nation = nationDoc.data() as Nation;
  const territories = nation.controlledTerritories || [];
  let totalExtractedWRB = 0;

  for (const territoryId of territories) {
    // Fetch territory data
    const territoryDoc = await db.collection('territories').doc(territoryId).get();
    if (!territoryDoc.exists) continue;
    const territory = territoryDoc.data()!;

    // Apply extraction efficiency based on days since conquest
    const daysSinceConquest = Math.floor((Date.now() - (territory.conqueredAt || Date.now())) / (1000 * 60 * 60 * 24));
    let efficiency = 1.0;
    if (daysSinceConquest < 7) efficiency = 0.3;
    else if (daysSinceConquest < 30) efficiency = 0.7;

    // Check for sabotage missions (placeholder)
    const sabotageActive = territory.sabotageActive || false;
    if (sabotageActive) efficiency *= 0.2;

    const baseYield = territory.baseYield || 10; // WRB per cycle
    totalExtractedWRB += baseYield * efficiency;
  }

  // Add to nation treasury
  const currentTreasury = nation.treasury || 0;
  await nationRef.update({
    treasury: currentTreasury + totalExtractedWRB
  });

  return totalExtractedWRB;
};
