export const api = {
  auth: {
    getSessionUser: () => null,
    telegramVerify: () => Promise.resolve({success: false}),
    logout: () => Promise.resolve({success: true}),
  },
  events: {
    getRecent: () => null,
  },
  wars: {
    getActive: () => null,
    getByNation: () => null,
    getForNation: () => null,
    create: () => Promise.resolve({success: false}),
    declareWar: () => Promise.resolve({success: false}),
    offerPeace: () => Promise.resolve({success: false}),
  },
  nations: {
    list: () => null,
    getAll: () => null,
    get: () => null,
    listActive: () => null,
    update: () => Promise.resolve({success: false}),
  },
  market: {
    getStocks: () => null,
    getListings: () => null,
    getPlayerListings: () => null,
    createListing: () => Promise.resolve({success: false}),
    buyListing: () => Promise.resolve({success: false}),
  },
  players: {
    getByUser: () => null,
    applyRole: () => Promise.resolve({success: false}),
    update: () => Promise.resolve({success: false}),
  },
  wallet: {
    getTransactions: () => null,
    getBalance: () => null,
    verifyDeposit: () => Promise.resolve({success: false}),
    initiateWithdrawal: () => Promise.resolve({success: false}),
  },
};

export const actions = {};
export const httpEndpoints = {};
