import { Telegraf } from 'telegraf';
import express from 'express';
import * as dotenv from 'dotenv';
import { seedNations } from './services/firebaseService';
import * as cron from 'node-cron';
import { runNPCCycle, seedAllNPCRoles } from './services/npcService';
import { startCommand } from './commands/start';
import { statusCommand } from './commands/status';
import { myRoleCommand } from './commands/myrole';
import { applyCommand } from './commands/apply';
import { nationCommand } from './commands/nation';
import { eventsCommand } from './commands/events';
import { leaderboardCommand } from './commands/leaderboard';
import { helpCommand } from './commands/help';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN || '');
const app = express();
const port = process.env.PORT || 8080;

// Register Commands
bot.start(startCommand);
bot.command('status', statusCommand);
bot.command('myrole', myRoleCommand);
bot.command('apply', applyCommand);
bot.command('nation', nationCommand);
bot.command('events', eventsCommand);
bot.command('leaderboard', leaderboardCommand);
bot.command('help', helpCommand);

// Handle Callback Queries (from inline buttons)
bot.action('apply_role', applyCommand);
bot.action('world_status', statusCommand);
bot.action('help', helpCommand);

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
