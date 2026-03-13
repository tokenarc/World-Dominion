export const BETA_CONFIG = {
  enabled: true,
  maxPlayers: 500,
  inviteCodes: ['OBSIDIAN', 'ARCBETA', 'WDBETA'],
  referralRewardCp: 500,
  featuresEnabled: {
    war: true,
    elections: true,
    spyOps: true,
    marketplaceBasic: true,
    marketplaceBlack: false,
    nuclear: false,
    spaceRace: false,
    cryptoPayments: true,
    nationChannels: true
  },
  phase: 'closed_beta' as const,
  startDate: null as Date | null,
  announcement: {
    channel: process.env.MAIN_CHANNEL_ID || '',
    message: `🌍 *WORLD DOMINION — CLOSED BETA*\n\nInvite code: OBSIDIAN\n\n195 nations. Real armies. AI picks your role.\n\nt.me/WorldDominionGameBot`
  }
}

export function isBetaAllowed(inviteCode?: string): boolean {
  if (!BETA_CONFIG.enabled) return true
  if (!inviteCode) return false
  return BETA_CONFIG.inviteCodes.includes(inviteCode.toUpperCase())
}

export function isFeatureEnabled(feature: keyof typeof BETA_CONFIG.featuresEnabled): boolean {
  return BETA_CONFIG.featuresEnabled[feature] ?? false
}
