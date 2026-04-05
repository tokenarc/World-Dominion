import { GenericMutation, GenericQuery } from "convex/server";

declare module "convex/react" {
  function useQuery<Args extends any[], Ret>(
    query: GenericQuery<Args, Ret>,
    args: Args[0] extends Record<string, any> ? Args[0] : Record<string, any>
  ): Ret | null;
  function useMutation<Args extends any[], Ret>(
    mutation: GenericMutation<Args, Ret>
  ): (...args: Args) => Promise<Ret>;
}

export const api = {
  auth: {
    getSessionUser: (() => null) as GenericQuery<[{token: string}], any>,
    telegramVerify: (() => Promise.resolve({success: false})) as GenericMutation<[{initData: string}], any>,
    logout: (() => Promise.resolve({success: true})) as GenericMutation<[{token: string}], any>,
  },
  events: {
    getRecent: (() => null) as GenericQuery<[{limit: number}], any>,
  },
  wars: {
    getActive: (() => null) as GenericQuery<[], any>,
    getByNation: (({nationId}: {nationId: string}) => null) as GenericQuery<[{nationId: string}], any>,
    getForNation: (() => null) as GenericQuery<[any], any>,
    create: (() => Promise.resolve({success: false})) as GenericMutation<[any], any>,
    declareWar: (() => Promise.resolve({success: false})) as GenericMutation<[any], any>,
    offerPeace: (() => Promise.resolve({success: false})) as GenericMutation<[any], any>,
  },
  nations: {
    list: (() => null) as GenericQuery<[], any>,
    getAll: (() => null) as GenericQuery<[], any>,
    get: (({id}: {id: string}) => null) as GenericQuery<[{id: string}], any>,
    listActive: (() => null) as GenericQuery<[], any>,
    update: (() => Promise.resolve({success: false})) as GenericMutation<[any], any>,
  },
  market: {
    getStocks: (() => null) as GenericQuery<[], any>,
    getListings: (() => null) as GenericQuery<[any], any>,
    getPlayerListings: (({playerId}: {playerId: string}) => null as any) as GenericQuery<[{playerId: string}], any>,
    createListing: (() => Promise.resolve({success: false})) as GenericMutation<[any], any>,
    buyListing: (() => Promise.resolve({success: false})) as GenericMutation<[any], any>,
  },
  players: {
    getByUser: (({userId}: {userId: string}) => null as any) as GenericQuery<[{userId: string}], any>,
    applyRole: (() => Promise.resolve({success: false})) as GenericMutation<[any], any>,
    update: (() => Promise.resolve({success: false})) as GenericMutation<[any], any>,
  },
  wallet: {
    getTransactions: (() => null as any) as GenericQuery<[any], any>,
    getBalance: (() => null as any) as GenericQuery<[any], any>,
    verifyDeposit: (() => Promise.resolve({success: false})) as GenericMutation<[any], any>,
    initiateWithdrawal: (() => Promise.resolve({success: false})) as GenericMutation<[any], any>,
  },
};

export const actions = {};
export const httpEndpoints = {};
