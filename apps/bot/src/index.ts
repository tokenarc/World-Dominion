import { Telegraf } from 'telegraf';
import express from 'express';
import * as dotenv from 'dotenv';
import { seedNations, getOrCreatePlayer } from './services/firebaseService';
import * as cron from 'node-cron';
import { runNPCCycle, seedAllNPCRoles } from './services/npcService';

// Import Commands Part 1
import { startCommand } from './commands/start';
import { statusCommand } from './commands/status';
import { myRoleCommand } from './commands/myrole';
import { applyCommand } from './commands/apply';
import { nationCommand } from './commands/nation';
import { eventsCommand } from './commands/events';
import { leaderboardCommand } from './commands/leaderboard';
import { helpCommand } from './commands/help';

// Import Commands Part 2
import { warCommand, handleWarAction } from './commands/war';
import { peaceCommand, handlePeaceAction } from './commands/peace';
import { economyCommand } from './commands/economy';
import { militaryCommand } from './commands/military';
import { intelCommand } from './commands/intel';
import { walletCommand } from './commands/wallet';
import { marketCommand } from './commands/market';
import { missionsCommand } from './commands/missions';
import { referralCommand } from './commands/referral';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN || '');
const app = express();
const port = process.env.PORT || 8080;

// Middleware: getOrCreatePlayer on every message
bot.use(async (ctx, next) => {
  if (ctx.from) {
    await getOrCreatePlayer(ctx.from);
  }
  return next();
});

// Register Commands Part 1
bot.start(startCommand);
bot.command('status', statusCommand);
bot.command('myrole', myRoleCommand);
bot.command('apply', applyCommand);
bot.command('nation', nationCommand);
bot.command('events', eventsCommand);
bot.command('leaderboard', leaderboardCommand);
bot.command('help', helpCommand);

// Register Commands Part 2
bot.command('war', warCommand);
bot.command('peace', peaceCommand);
bot.command('economy', economyCommand);
bot.command('military', militaryCommand);
bot.command('intel', intelCommand);
bot.command('wallet', walletCommand);
bot.command('market', marketCommand);
bot.command('missions', missionsCommand);
bot.command('referral', referralCommand);

// Handle Callback Queries (from inline buttons)
bot.action('apply_role', applyCommand);
bot.action('world_status', statusCommand);
bot.action('help', helpCommand);
bot.action(/confirm_war:.+/, handleWarAction);
bot.action('cancel_war', handleWarAction);
bot.action(/send_peace:.+/, handlePeaceAction);
bot.action('cancel_peace', handlePeaceAction);

// Webhook setup for Express
app.use(express.json());
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body, res);
});

// Health check
app.get('/health', (req, res) => {
  res.send('Bot is running');
});

const startServer = async () => {
  try {
    // Seed nations if necessary
    await seedNations();
    // Seed NPC roles if necessary
    await seedAllNPCRoles();
    
    // Schedule NPC decision cycle every 6 hours
    cron.schedule('0 */6 * * *', () => {
      console.log('Running scheduled NPC cycle...');
      runNPCCycle().catch(console.error);
    });

    // Launch bot
    if (process.env.NODE_ENV === 'production') {
      console.log('Bot starting in webhook mode...');
    } else {
      bot.launch();
      console.log('Bot starting in polling mode...');
    }

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
