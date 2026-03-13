import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { groq } from '../lib/groq';
import { db, rtdb } from '../lib/firebase-admin';
import { saveWorldEvent, getAllNations, Nation, WorldEvent } from './firebaseService';
import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';

dotenv.config();

const newsSourcesPath = path.join(__dirname, '../../../../data/news/news_sources.json');
const newsSources = JSON.parse(fs.readFileSync(newsSourcesPath, 'utf8'));

const bot = new Telegraf(process.env.BOT_TOKEN || '');

interface GDELTArticle {
  url: string;
  title: string;
  domain: string;
  sentiment: number;
}

interface GameEvent {
  type: 'military' | 'economic' | 'political' | 'diplomatic' | 'nuclear' | 'disaster' | 'religious' | 'pandemic' | 'space' | 'security';
  title: string;
  description: string;
  affectedNations: string[];
  effects: {
    stability_change?: number;
    gdp_modifier?: number;
    military_change?: number;
    resistance_change?: number;
    global_oil_change?: number;
  };
  duration_hours?: number;
}

/**
 * Fetches news articles from GDELT based on a query type.
 * @param queryType The type of query to use (e.g., 'military', 'economic').
 * @returns An array of GDELTArticle objects.
 */
export const fetchGDELTNews = async (queryType: 'military' | 'economic' | 'election' | 'nuclear' | 'disaster' | 'diplomacy' | 'terrorism' | 'pandemic' | 'space' | 'oil_energy'): Promise<GDELTArticle[]> => {
  const config = newsSources.gdelt_config;
  const queryConfig = config.scheduled_queries.find((q: any) => q.id.includes(queryType));

  if (!queryConfig) {
    console.warn(`No GDELT query configuration found for type: ${queryType}`);
    return [];
  }

  const queryUrl = `${config.base_url}?query=${encodeURIComponent(queryConfig.query)}&format=${config.format}&maxrecords=${config.maxrecords}&timespan=12h`;

  try {
    const response = await axios.get(queryUrl, { timeout: 8000 });
    if (response.data && response.data.articles) {
      return response.data.articles.map((article: any) => ({
        url: article.url,
        title: article.title,
        domain: article.domain,
        sentiment: article.sentiment,
      }));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching GDELT news for ${queryType}:`, error);
    return [];
  }
};

/**
 * Classifies an article title into a game event type based on keywords.
 * @param articleTitle The title of the article to classify.
 * @returns The classified event type or 'unknown'.
 */
export const classifyEvent = (articleTitle: string): string => {
  const classificationRules = newsSources.event_classification;
  const lowerCaseTitle = articleTitle.toLowerCase();

  for (const eventType in classificationRules) {
    const keywords = classificationRules[eventType];
    for (const keyword of keywords) {
      if (lowerCaseTitle.includes(keyword.toLowerCase())) {
        return eventType;
      }
    }
  }
  return 'unknown';
};

/**
 * Converts a GDELT article into a structured game event using Groq.
 * @param article The GDELT article to convert.
 * @returns A GameEvent object.
 */
export const convertToGameEvent = async (article: GDELTArticle): Promise<GameEvent | null> => {
  const promptTemplate = newsSources.groq_conversion_prompt;
  const prompt = promptTemplate.replace('{title}', article.title);

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (content) {
      const gameEvent: GameEvent = JSON.parse(content);
      return gameEvent;
    }
    return null;
  } catch (error) {
    console.error(`Error converting article to game event with Groq for article: ${article.title}`, error);
    return null;
  }
};

/**
 * Applies the effects of a game event to affected nations.
 * @param event The game event to apply effects from.
 */
const applyEventEffects = async (event: GameEvent) => {
  if (!event.affectedNations || event.affectedNations.length === 0) return;

  for (const nationId of event.affectedNations) {
    const nationRef = db.collection('nations').doc(nationId.toUpperCase());
    const nationDoc = await nationRef.get();

    if (nationDoc.exists) {
      const currentNationData = nationDoc.data() as Nation;
      const updateData: Partial<Nation> = {};

      if (event.effects.stability_change !== undefined) {
        updateData.stability = Math.max(0, Math.min(100, (currentNationData.stability || 0) + event.effects.stability_change));
      }
      if (event.effects.gdp_modifier !== undefined) {
        updateData.baseGDP = (currentNationData.baseGDP || 0) * event.effects.gdp_modifier;
      }
      if (event.effects.military_change !== undefined) {
        updateData.militaryStrength = Math.max(0, Math.min(100, (currentNationData.militaryStrength || 0) + event.effects.military_change));
      }

      await nationRef.update(updateData);
      
      // Also update RTDB for live updates
      await rtdb.ref(`nations/${nationId.toUpperCase()}`).update(updateData);
      
      console.log(`Applied effects of event '${event.title}' to nation ${nationId}`);
    }
  }
};

/**
 * Notifies relevant nation players about a new game event.
 * @param event The game event to notify players about.
 */
const notifyRelevantNationPlayers = async (event: GameEvent) => {
  if (!event.affectedNations || event.affectedNations.length === 0) return;

  for (const nationId of event.affectedNations) {
    const playersSnapshot = await db.collection('players')
      .where('nationId', '==', nationId.toUpperCase())
      .get();

    for (const playerDoc of playersSnapshot.docs) {
      const player = playerDoc.data();
      if (player.telegramId && !player.isNPC) {
        try {
          await bot.telegram.sendMessage(player.telegramId, `🚨 *NEW GAME EVENT AFFECTING YOUR NATION!* 🚨\n\n*${event.title}*\n${event.description}`, { parse_mode: 'Markdown' });
          console.log(`Notified player ${player.telegramId} of event ${event.title}`);
        } catch (error) {
          console.error(`Error notifying player ${player.telegramId}:`, error);
        }
      }
    }
  }
};

/**
 * Runs the main news loop to fetch, classify, convert, and apply game events.
 */
export const runNewsLoop = async () => {
  console.log('Running news loop...');
  const queryTypesToFetch = ['military', 'economic', 'election']; // Fetch from 3 different query types
  const processedArticles: GDELTArticle[] = [];

  for (const queryType of queryTypesToFetch) {
    const articles = await fetchGDELTNews(queryType as any);
    // Take up to 2 articles per query type to ensure variety
    for (const article of articles.slice(0, 2)) {
      processedArticles.push(article);
    }
  }

  for (const article of processedArticles) {
    const gameEvent = await convertToGameEvent(article);
    if (gameEvent) {
      // Add timestamp to the event before saving
      const eventToSave = { 
        ...gameEvent, 
        timestamp: Date.now(),
        type: gameEvent.type as any // Cast to match WorldEvent type if necessary
      };
      await saveWorldEvent(eventToSave);
      await applyEventEffects(gameEvent);
      await notifyRelevantNationPlayers(gameEvent);
      console.log(`Processed game event: ${gameEvent.title}`);
    }
  }
  console.log('News loop finished.');
};

/**
 * Checks for and generates historical events based on today's date.
 */
export const generateHistoricalEvent = async () => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // Month is 0-indexed
  const currentDay = today.getDate();

  const historicalEvents = newsSources.historical_events_calendar;

  for (const eventConfig of historicalEvents) {
    if (eventConfig.month === currentMonth && eventConfig.day === currentDay) {
      const historicalGameEvent: GameEvent = {
        type: eventConfig.event_type,
        title: eventConfig.title,
        description: eventConfig.description,
        affectedNations: [], 
        effects: eventConfig.effects,
      };
      // Add timestamp to the event before saving
      const eventToSave = { 
        ...historicalGameEvent, 
        timestamp: Date.now(),
        type: historicalGameEvent.type as any
      };
      await saveWorldEvent(eventToSave);
      await applyEventEffects(historicalGameEvent);
      console.log(`Generated historical event: ${historicalGameEvent.title}`);
    }
  }
};

/**
 * Collects recent events, generates a World Dominion Gazette, and publishes it to Telegram channels.
 */
export const publishWorldGazette = async () => {
  console.log('Generating and publishing World Dominion Gazette...');
  const recentEvents = await db.collection('events')
    .orderBy('timestamp', 'desc')
    .limit(5)
    .get();

  const eventsData = recentEvents.docs.map(doc => doc.data() as WorldEvent);
  const eventsJSON = JSON.stringify(eventsData);

  const gazettePromptTemplate = newsSources.gazette_template.prompt;
  const gazettePrompt = gazettePromptTemplate.replace('{events_json}', eventsJSON);

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: gazettePrompt }],
      model: 'llama3-70b-8192',
    });

    const gazetteContent = completion.choices[0].message.content;

    if (gazetteContent) {
      // Post to main game channel
      const mainChannelId = process.env.MAIN_CHANNEL_ID;
      if (mainChannelId) {
        await bot.telegram.sendMessage(mainChannelId, gazetteContent, { parse_mode: 'Markdown' });
        console.log('Published World Dominion Gazette to main channel.');
      }

      // Post localized edition to each nation channel
      const allNations = await getAllNations();
      for (const nation of allNations) {
        if (nation.telegramChannelId) {
          try {
            await bot.telegram.sendMessage(nation.telegramChannelId, `*${nation.name} Edition*\n\n${gazetteContent}`, { parse_mode: 'Markdown' });
            console.log(`Published localized gazette to channel for ${nation.name}`);
          } catch (error) {
            console.error(`Error publishing gazette to nation ${nation.id}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating or publishing World Dominion Gazette:', error);
  }
};
