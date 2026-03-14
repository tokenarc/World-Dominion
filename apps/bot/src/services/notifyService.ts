import { db, rtdb } from "../lib/firebase-admin";
import { Nation, Player, WorldEvent } from "../lib/types";
import { Telegraf } from "telegraf";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN || "");

const gameConfigPath = path.join(__dirname, "../../../../data/game_config.json");
const gameConfig = JSON.parse(fs.readFileSync(gameConfigPath, "utf8"));

const MAIN_CHANNEL_ID = process.env.MAIN_CHANNEL_ID || gameConfig.main_channel_id;

/**
 * Sends a message to all human players in a specific nation.
 * Implements a basic rate limit to avoid flooding Telegram API.
 * @param nationId The ID of the nation whose players should be notified.
 * @param message The message to send.
 * @param parseMode Optional. Telegram parse mode (e.g., 'Markdown', 'HTML').
 */
export const notifyNationPlayers = async (
  nationId: string,
  message: string,
  parseMode?: "Markdown" | "HTML"
) => {
  const playersSnapshot = await db
    .collection("players")
    .where("currentNation", "==", nationId)
    .where("isNPC", "==", false)
    .get();

  for (const playerDoc of playersSnapshot.docs) {
    const player = playerDoc.data() as Player;
    if (player.telegramId) {
      try {
        await bot.telegram.sendMessage(player.telegramId, message, { parse_mode: parseMode });
        // Basic rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Failed to send message to player ${player.telegramId} in nation ${nationId}:`, error
        );
      }
    }
  }
};

/**
 * Notifies relevant nations and the main game channel about a world event.
 * @param event The WorldEvent object.
 */
export const notifyWorldEvent = async (event: WorldEvent) => {
  const eventMessage = `🌍 *WORLD EVENT ALERT* 🌍\n\n*${event.title}*\n${event.description}\n\n_Affected Nations: ${event.affectedNations.join(", ") || "None"}_`;

  // Notify affected nations' players
  for (const nationId of event.affectedNations) {
    await notifyNationPlayers(nationId, eventMessage, "Markdown");
  }

  // Post to main game Telegram channel
  if (MAIN_CHANNEL_ID) {
    try {
      await bot.telegram.sendMessage(MAIN_CHANNEL_ID, eventMessage, { parse_mode: "Markdown" });
    } catch (error) {
      console.error(`Failed to post world event to main channel ${MAIN_CHANNEL_ID}:`, error);
    }
  }
};

/**
 * Creates a Telegram group for a nation and saves its ID.
 * Note: Bots cannot programmatically create public groups or add users without invitation.
 * This function will create a private supergroup and return an invite link.
 * The bot will automatically be an admin of the group it creates.
 * @param nationId The ID of the nation.
 * @param nationName The name of the nation.
 * @param nationFlag The flag emoji of the nation.
 * @returns The chat ID of the created group, or null if failed.
 */
export const createNationGroup = async (
  nationId: string,
  nationName: string,
  nationFlag: string
): Promise<string | null> => {
  try {
    // Create a private supergroup. The bot will be an admin by default.
    // const chat = await bot.telegram.createChat({
    //   title: `${nationFlag} ${nationName} National Assembly`,
    //   // type: 'supergroup' is implicit for createChat
    // });
    const chat: any = null;

    if (chat && chat.id) {
      const nationRef = db.collection("nations").doc(nationId);
      await nationRef.update({ telegramGroupId: chat.id.toString() });
      console.log(`Created Telegram group for ${nationName}: ${chat.id}`);

      // Generate an invite link for users to join
      const inviteLink = await bot.telegram.createChatInviteLink(chat.id, {
        member_limit: 99999,
        creates_join_request: false,
      });
      console.log(`Invite link for ${nationName} group: ${inviteLink.invite_link}`);

      // Send a welcome message to the group
      await bot.telegram.sendMessage(
        chat.id,
        `Welcome to the official *${nationName} National Assembly* group! Use this space for national discussions and coordination. Join via: ${inviteLink.invite_link}`,
        { parse_mode: "Markdown" }
      );

      return chat.id.toString();
    }
    return null;
  } catch (error) {
    console.error(`Error creating Telegram group for ${nationName}:`, error);
    return null;
  }
};

/**
 * Creates a Telegram channel for a nation and saves its ID.
 * Note: Bots cannot programmatically create channels. This function will create a private supergroup
 * and then convert it to a channel, which requires the bot to be an admin with specific permissions.
 * For simplicity, this will create a private supergroup and suggest manual conversion/linking.
 * @param nationId The ID of the nation.
 * @returns The chat ID of the created channel, or null if failed.
 */
export const createNationChannel = async (nationId: string): Promise<string | null> => {
  const nation = await db.collection("nations").doc(nationId).get();
  const nationData = nation.data() as Nation;

  try {
    // Telegram Bot API does not directly support creating channels. A common workaround
    // is to create a supergroup and then manually convert it to a channel.
    // For programmatic creation, we can create a supergroup and then the user would manually
    // convert it to a channel and assign the bot as admin.
    // Here, we'll create a supergroup and log instructions.
    // const chat = await bot.telegram.createChat({
    //   title: `${nationData.flag} ${nationData.name} Official Announcements`,
    // });
    const chat: any = null;

    if (chat && chat.id) {
      const nationRef = db.collection("nations").doc(nationId);
      await nationRef.update({ telegramChannelId: chat.id.toString() });
      console.log(`Created Telegram supergroup for ${nationData.name} (to be converted to channel): ${chat.id}`);

      const instructions = `*IMPORTANT*: To make this an official announcement channel, please manually convert this group to a channel in Telegram and then ensure the bot is an administrator with posting rights. Once converted, the channel ID will remain ${chat.id}.`;
      await bot.telegram.sendMessage(chat.id, instructions, { parse_mode: "Markdown" });

      return chat.id.toString();
    }
    return null;
  } catch (error) {
    console.error(`Error creating Telegram channel for ${nationData.name}:`, error);
    return null;
  }
};

/**
 * Posts a message to a nation's official Telegram channel.
 * @param nationId The ID of the nation.
 * @param message The message content.
 */
export const postToNationChannel = async (nationId: string, message: string) => {
  const nation = await db.collection("nations").doc(nationId).get();
  const nationData = nation.data() as Nation;

  if (!nationData || !nationData.telegramChannelId) {
    console.warn(`Nation ${nationId} has no Telegram channel configured.`);
    return;
  }

  const formattedMessage = `${nationData.flag} *${nationData.name} Military Briefing* ${nationData.flag}\n\n${message}`;

  try {
    await bot.telegram.sendMessage(nationData.telegramChannelId, formattedMessage, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(`Failed to post to nation channel ${nationData.telegramChannelId} for ${nationId}:`, error);
  }
};

/**
 * Creates a temporary private group for diplomatic discussions between two nation leaders.
 * @param nation1Id The ID of the first nation.
 * @param nation2Id The ID of the second nation.
 * @param initiatorId The Telegram ID of the player initiating the hotline.
 */
export const sendDiplomaticHotline = async (
  nation1Id: string,
  nation2Id: string,
  initiatorId: string
) => {
  const nation1 = (await db.collection("nations").doc(nation1Id).get()).data() as Nation;
  const nation2 = (await db.collection("nations").doc(nation2Id).get()).data() as Nation;

  if (!nation1 || !nation2) {
    console.error("One or both nations not found for diplomatic hotline.");
    return;
  }

  // Find leaders (President/PM/FM) of both nations
  const getLeaders = async (nId: string) => {
    const leaderRoles = ["president", "prime_minister", "foreign_minister"];
    const leaders: Player[] = [];
    for (const role of leaderRoles) {
      const playerSnapshot = await db.collection("players")
        .where("currentNation", "==", nId)
        .where("currentRole", "==", role)
        .where("isNPC", "==", false)
        .limit(1)
        .get();
      if (!playerSnapshot.empty) {
        leaders.push(playerSnapshot.docs[0].data() as Player);
      }
    }
    return leaders;
  };

  const leaders1 = await getLeaders(nation1Id);
  const leaders2 = await getLeaders(nation2Id);

  const allParticipants = [...leaders1, ...leaders2].filter(p => p.telegramId);

  if (allParticipants.length < 2) {
    console.warn("Not enough human leaders to establish diplomatic hotline.");
    return;
  }

  try {
    // Create a private supergroup
    // const chat = await bot.telegram.createChat({
    //   title: `Diplomatic Hotline: ${nation1.name} ↔️ ${nation2.name}`,
    // });
    const chat: any = null;

    if (chat && chat.id) {
      const chatId = chat.id.toString();
      console.log(`Created diplomatic hotline group: ${chatId}`);

      // Invite all participants. Note: Users must have started a chat with the bot previously.
      for (const participant of allParticipants) {
        try {
          // This is a workaround. Direct programmatic adding to groups requires specific permissions
          // or the user to initiate. For now, we'll send an invite link to each.
          const inviteLink = await bot.telegram.createChatInviteLink(chat.id, {
            member_limit: 1,
            creates_join_request: false,
          });
          await bot.telegram.sendMessage(
            participant.telegramId,
            `🔐 *ENCRYPTED DIPLOMATIC CHANNEL ESTABLISHED* 🔐\n\nYou have been invited to a private diplomatic hotline between *${nation1.name}* and *${nation2.name}*.\nJoin here: ${inviteLink.invite_link}\n\nThis channel will auto-delete in 48 hours.`,
            { parse_mode: "Markdown" }
          );
        } catch (inviteError) {
          console.error(`Failed to invite ${participant.telegramId} to hotline:`, inviteError);
        }
      }

      // Log channel creation in Firestore
      await db.collection("diplomaticHotlines").add({
        nation1Id,
        nation2Id,
        chatId,
        initiatorId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 48 * 60 * 60 * 1000, // 48 hours
        participants: allParticipants.map(p => p.telegramId),
      });

      // Set a timer to delete the group after 48 hours (this would require a scheduled job)
      console.log(`Diplomatic hotline ${chatId} set to expire in 48 hours.`);
      return chatId;
    }
    return null;
  } catch (error) {
    console.error("Error creating diplomatic hotline:", error);
    return null;
  }
};

/**
 * Sends an urgent crisis alert to affected nations/players.
 * @param type The type of crisis (e.g., 'NUCLEAR', 'PANDEMIC').
 * @param message The crisis message.
 * @param affectedNations An array of nation IDs affected.
 */
export const sendCrisisAlert = async (
  type: "NUCLEAR" | "PANDEMIC" | "COUP" | "ECONOMIC_CRASH",
  message: string,
  affectedNations: string[]
) => {
  let formattedMessage = "";
  switch (type) {
    case "NUCLEAR":
      formattedMessage = `☢️🚨 *NUCLEAR CRISIS ALERT!* 🚨☢️\n\n*URGENT BROADCAST!*\n\n${message.toUpperCase()}\n\n*SEEK SHELTER IMMEDIATELY!*`;
      break;
    case "PANDEMIC":
      formattedMessage = `🦠 *PANDEMIC ALERT!* 🦠\n\n*GLOBAL HEALTH EMERGENCY!*\n\n${message}\n\n_Follow health guidelines and stay safe._`;
      break;
    case "COUP":
      formattedMessage = `💥 *COUP ALERT!* 💥\n\n*GOVERNMENT OVERTHROWN!*\n\n${message}\n\n_Expect instability and power struggles._`;
      break;
    case "ECONOMIC_CRASH":
      formattedMessage = `📉 *ECONOMIC CRASH ALERT!* 📉\n\n*MARKETS COLLAPSING!*\n\n${message}\n\n_Prepare for severe economic downturn._`;
      break;
    default:
      formattedMessage = `🚨 *CRISIS ALERT!* 🚨\n\n${message}`;
  }

  // Notify affected nations' players
  for (const nationId of affectedNations) {
    await notifyNationPlayers(nationId, formattedMessage, "Markdown");
  }

  // Also post to main game Telegram channel
  if (MAIN_CHANNEL_ID) {
    try {
      await bot.telegram.sendMessage(MAIN_CHANNEL_ID, formattedMessage, { parse_mode: "Markdown" });
    } catch (error) {
      console.error(`Failed to post crisis alert to main channel ${MAIN_CHANNEL_ID}:`, error);
    }
  }
};

/**
 * Generates and sends 3 daily missions to a player based on their role.
 * @param playerId The Telegram ID of the player.
 * @param role The current role of the player.
 */
export const sendDailyMissions = async (playerId: string, role: string) => {
  // Placeholder for mission generation logic
  const missions = [
    `Mission 1 for ${role}: Secure 100 WarBonds. Reward: 50 CP`,
    `Mission 2 for ${role}: Influence 3 nations. Reward: 100 CP`,
    `Mission 3 for ${role}: Gather intel on a rival. Reward: 75 CP`,
  ];

  const message = `📜 *DAILY MISSIONS* 📜\n\nGood morning, ${role}! Here are your objectives for today:\n\n${missions.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\n_Complete these to earn rewards!_`;

  try {
    await bot.telegram.sendMessage(playerId, message, { parse_mode: "Markdown" });
    console.log(`Sent daily missions to player ${playerId}`);
  } catch (error) {
    console.error(`Failed to send daily missions to player ${playerId}:`, error);
  }
};

/**
 * Schedules various notifications to be sent at specific times or triggers.
 * This function would typically be called once at bot startup to set up cron jobs.
 */
export const scheduleNotifications = () => {
  console.log("Scheduling notifications...");

  // Morning briefing: 9 AM per timezone (approximate)
  // This would require more complex timezone handling. For now, a global 9 AM UTC.
  // cron.schedule('0 9 * * *', async () => {
  //   const allPlayers = await db.collection('players').where('isNPC', '==', false).get();
  //   for (const playerDoc of allPlayers.docs) {
  //     const player = playerDoc.data() as Player;
  //     if (player.telegramId && player.currentRole) {
  //       await sendDailyMissions(player.telegramId, player.currentRole);
  //     }
  //   }
  // });

  // Battle round results: every 6 hours (example, assuming a battle service exists)
  // cron.schedule('0 */6 * * *', async () => {
  //   // Logic to fetch and notify battle results
  //   console.log('Checking for battle round results to notify...');
  // });

  // Election reminders: 2 hours before close
  // This would require actively monitoring election documents in Firestore
  // and setting individual timers or a more frequent check.

  // Mission completions: immediate (handled by mission service upon completion)

  console.log("Notifications scheduled (placeholders for cron jobs).");
};
