import { expect } from "chai";
import { MessageEmbed } from "discord.js";
import { createSandbox, SinonStub } from "sinon";
import cmd from "@Commands/bot/support";
import { buildMessageInt } from "../../../testSetup";

describe("command: report", () => {
  let sandbox;
  const testPrefix = "☂";
  const botColor = "7B25AA";
  const baseCommand = `${testPrefix}support`;

  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  [
    { name: "color", value: parseInt(botColor, 16) },
    { name: "title", value: "Do you need some help?" },
    {
      name: "description",
      value:
        "I am sorry if I couldn't explain things well enough. You can join my [support server](https://discord.gg/PHqDbkg) or check my [Documentation Page](https://www.nhcarrigan.com/BeccaBot-documentation/) for some additional assistance.",
    },
  ].forEach(({ name, value }) => {
    it(`should set ${name} appropriately`, async () => {
      const message = buildMessageInt(baseCommand, "", "", botColor);
      const send: SinonStub = sandbox.stub();
      message.channel.send = send;

      await cmd.run(message);
      const embed: MessageEmbed = send.firstCall.firstArg;
      expect(embed[name]).to.equal(value);
    });
  });

  context("when command followed by extra text", () => {
    const inviteWithExtra = `${baseCommand} hello world`;
    it("should call send", async () => {
      const message = buildMessageInt(inviteWithExtra, "", "", botColor);
      const send: SinonStub = sandbox.stub();
      message.channel.send = send;

      await cmd.run(message);

      expect(send).to.be.called;
    });
  });
  it("should call send", async () => {
    const message = buildMessageInt(baseCommand, "", "", botColor);
    const send: SinonStub = sandbox.stub();
    message.channel.send = send;

    await cmd.run(message);

    expect(send).to.be.called;
  });
});
