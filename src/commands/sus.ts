import { MessageEmbed } from "discord.js";
import { CommandInt } from "../interfaces/CommandInt";

export const sus: CommandInt = {
  prefix: "sus",
  description: "Returns a color is sus",
  parameters: "*none*",
  command: async (message) => {
    const array = [
      "red",
      "blue",
      "green",
      "pink",
      "orange",
      "yellow",
      "black",
      "white",
      "purple",
      "brown",
      "cyan",
      "lime",
    ];
    let i = Math.floor(Math.random() * array.length);
    const color = array[i];
    const embed = new MessageEmbed();
    embed.setTitle(`Emergency Meeting!`);
    embed.setDescription(`${color} is sus`);

    message.channel.send(embed);
  },
};
