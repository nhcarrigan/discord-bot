import "module-alias/register";
import { Client, WebhookClient } from "discord.js";
import connectDatabase from "@Database";
import BeccaInt from "@Interfaces/BeccaInt";
import extendsClientToBeccaInt from "@Utils/extendsClientToBeccaInt";
import { getCommands, getListeners } from "@Utils/readDirectory";
import { version } from "../package.json";

// Events
import onReady from "@Events/onReady";
import onGuildCreate from "@Events/onGuildCreate";
import onGuildDelete from "@Events/onGuildDelete";
import onGuildMemberAdd from "@Events/onGuildMemberAdd";
import onMessage from "@Events/onMessage";
import onMessageDelete from "@Events/onMessageDelete";
import onMessageUpdate from "@Events/onMessageUpdate";
import onGuildMemberRemove from "@Events/onGuildMemberRemove";

export async function botConnect(): Promise<void> {
  // Get the node_env from the environment.
  const node_env = process.env.NODE_ENV || "development";

  // Check if the node_env is not production and load the .env file.
  if (node_env !== "production") {
    // Import `dotenv` package.
    const dotenv = await import("dotenv");

    // Load `.env` configuration.
    dotenv.config();
  }

  // Debug channel hook (Send messages here when is debugging).
  let debugChannelHook: WebhookClient | null = null;

  // Check if `WH_ID` and `WH_TOKEN` are configured in the environment.
  if (process.env.WH_ID && process.env.WH_TOKEN) {
    debugChannelHook = new WebhookClient(
      process.env.WH_ID,
      process.env.WH_TOKEN
    );
  }

  // Create a new Discord bot object.
  const Becca: BeccaInt = extendsClientToBeccaInt(
    new Client({
      partials: ["USER"],
      shards: "auto",
    })
  );

  // Add the debug hook
  if (debugChannelHook) {
    Becca.debugHook = debugChannelHook;
  }

  // Add Becca's version to the client.
  Becca.version = version;

  // Add Becca's Emotes
  Becca.yes = process.env.BECCA_YES || "✅";
  Becca.no = process.env.BECCA_NO || "❌";
  Becca.think = process.env.BECCA_THINK || "🤔";
  Becca.love = process.env.BECCA_LOVE || "💜";

  // Load the commands.
  Becca.commands = await getCommands();

  // Load the listeners.
  Becca.customListeners = await getListeners();

  // Shard logging
  Becca.on("shardReady", (shard) => {
    if (Becca.debugHook) {
      Becca.debugHook.send(`Shard ${shard} is ready!`);
    }
    console.log(`Shard ${shard} is ready!`);
  });

  Becca.on("shardError", (err, shard) => {
    if (Becca.debugHook) {
      Becca.debugHook.send(`Shard ${shard} has crashed. Please see the longs.`);
    }
    console.error(err);
  });

  // When Becca connects...
  Becca.on(
    "ready",
    async () => await onReady(Becca, debugChannelHook, node_env)
  );

  // On guild create event.
  Becca.on(
    "guildCreate",
    async (guild) => await onGuildCreate(guild, debugChannelHook, Becca)
  );

  // On guild delete event.
  Becca.on(
    "guildDelete",
    async (guild) => await onGuildDelete(guild, debugChannelHook, Becca)
  );

  // When a member joins to a server.
  Becca.on(
    "guildMemberAdd",
    async (member) => await onGuildMemberAdd(member, Becca)
  );

  // When a member left a server.
  Becca.on(
    "guildMemberRemove",
    async (member) => await onGuildMemberRemove(member, Becca)
  );

  // When an user sends a message to a channel.
  Becca.on("message", async (message) => await onMessage(message, Becca));

  // When an user deletes a message from a channel.
  Becca.on(
    "messageDelete",
    async (message) => await onMessageDelete(message, Becca)
  );

  // When an user edits a message.
  Becca.on(
    "messageUpdate",
    async (oldMessage, newMessage) =>
      await onMessageUpdate(oldMessage, newMessage, Becca)
  );

  // Connect Becca
  await Becca.login(process.env.DISCORD_TOKEN);

  //set custom status
  await Becca.user?.setActivity("for people who need my help~!", {
    type: "WATCHING",
  });

  // Connect to the MongoDB database.
  await connectDatabase(debugChannelHook, Becca, node_env);
}
