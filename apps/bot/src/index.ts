import { Telegraf } from 'telegraf';
import express from 'express';
import * as dotenv from 'dotenv';
import { seedNations } from './services/firebaseService';
import * as cron from 'node-cron';
import { runNPCCycle, seedAllNPCRoles } from './services/npcService';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN || '');
const app = express();
const port = process.env.PORT || 8080;

// Basic command
bot.start((ctx) => ctx.reply('Welcome to World Dominion! Use /play to start your journey.'));

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
