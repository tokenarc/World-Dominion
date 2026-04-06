/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as envCheck from "../envCheck.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as market from "../market.js";
import type * as nations from "../nations.js";
import type * as players from "../players.js";
import type * as telegram from "../telegram.js";
import type * as wallet from "../wallet.js";
import type * as wars from "../wars.js";
import type * as webhookTest from "../webhookTest.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  envCheck: typeof envCheck;
  events: typeof events;
  http: typeof http;
  market: typeof market;
  nations: typeof nations;
  players: typeof players;
  telegram: typeof telegram;
  wallet: typeof wallet;
  wars: typeof wars;
  webhookTest: typeof webhookTest;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
