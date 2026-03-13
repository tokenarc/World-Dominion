import * as gameConfig from '../../../../data/game_config.json';

export const WRB_TO_USD = gameConfig.war_bond_to_usd;
export const USD_TO_WRB = gameConfig.usd_to_war_bond;
export const WITHDRAWAL_RATE = gameConfig.withdrawal_rate;
export const MARKETPLACE_TAX = gameConfig.marketplace_tax_pct;
export const BATTLE_ROUND_HOURS = gameConfig.battle_round_hours;
export const ELECTION_CYCLE_DAYS = gameConfig.election_cycle_days;
export const NPC_DECISION_INTERVAL_HOURS = gameConfig.npc_decision_interval_hours;
export const NEWS_FETCH_INTERVAL_MINUTES = gameConfig.news_fetch_interval_minutes;
export const GDP_SYNC_INTERVAL_HOURS = gameConfig.gdp_sync_interval_hours;
export const ANNEXATION_COST_WRB = gameConfig.annexation_cost_wrb;
export const PUPPET_STATE_COST_WRB = gameConfig.puppet_state_cost_wrb;
export const NATION_FOUNDING_COST_WRB = gameConfig.nation_founding_cost_wrb;
export const SEASON_PASS_COST_WRB = gameConfig.season_pass_cost_wrb;
export const MIN_WITHDRAWAL_WRB = gameConfig.min_withdrawal_wrb;

// Re-export the whole config if needed
export const GAME_CONFIG = gameConfig;
