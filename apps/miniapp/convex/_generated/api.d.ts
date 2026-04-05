export const api = {
  auth: {
    getSessionUser: () => null,
    telegramVerify: () => Promise.resolve({success: false}),
    logout: () => Promise.resolve({success: true}),
  },
  events: { getRecent: () => null },
  wars: { getActive: () => null, getForNation: () => null, declareWar: () => Promise.resolve({success: false}) },
  nations: { list: () => null, getAll: () => null, get: () => null },
  market: { getStocks: () => null, getListings: () => null, buyListing: () => Promise.resolve({success: false}) },
  players: { getByUser: () => null },
  wallet: { getTransactions: () => null, getBalance: () => null, verifyDeposit: () => Promise.resolve({success: false}), initiateWithdrawal: () => Promise.resolve({success: false}) },
};
