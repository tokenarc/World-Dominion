export const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || '';

if (!CONVEX_URL && typeof window !== 'undefined') {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Please configure your Convex deployment URL.");
}