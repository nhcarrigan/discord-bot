import { SinonSandbox, createSandbox, SinonStub, clock } from "sinon";
import { mock, reset } from "ts-mockito";
import { expect } from "chai";
import * as discordjs from "discord.js";
import extendsClientToClientInt from "@Utils/extendsClientToClientInt";
import CommandInt from "@Interfaces/CommandInt";
import ListenerInt from "@Interfaces/ListenerInt";
import onMessage from "@Events/onMessage";
import { getListeners } from "@Utils/readDirectory";

describe("onMessage event", () => {
  const testPrefix = "☂";
  const MAGIC_TIMEOUT = 3000;
  let sandbox: SinonSandbox;
  const mockCmd = (name = "mockCmd", run: SinonStub): CommandInt => ({
    names: [name, `mock ${name}`],
    description: "mock",
    run,
  });
  const mockListener = (
    name = "mockListener",
    run: SinonStub
  ): ListenerInt => ({
    name,
    description: "mock",
    run,
  });
  beforeEach(() => {
    sandbox = createSandbox();
    sandbox.useFakeTimers();
  });

  afterEach(() => {
    reset();
    sandbox.restore();
  });

  context("heart & level listeners exist", () => {
    it("should call run on interceptableLevelsListener", async () => {
      const aboutStub = sandbox.stub().resolves();
      const client = mock<discordjs.Client>();
      const msg = mock<discordjs.Message>();
      msg.content = `${testPrefix}about`;
      msg.attachments = new discordjs.Collection();
      msg.channel.startTyping = sandbox.stub();
      msg.channel.stopTyping = sandbox.stub();
      msg.guild.id = "server_id";

      const clientInt = extendsClientToClientInt(client);
      clientInt.prefix = { server_id: testPrefix };
      clientInt.commands = { about: mockCmd("about", aboutStub) };
      clientInt.customListeners = await getListeners();
      Object.keys(clientInt.customListeners).forEach((key) => {
        const stub = sandbox.stub();
        stub.resolves();
        clientInt.customListeners[key] = mockListener(key, stub);
      });

      const msgPromise = onMessage(msg, clientInt);
      await sandbox.clock.tickAsync(MAGIC_TIMEOUT);
      await msgPromise;

      const inUselistener =
        clientInt.customListeners["interceptableLevelsListener"];
      const notUselistener = clientInt.customListeners["levelsListener"];

      expect(inUselistener.run).calledOnce;
      expect(notUselistener.run).not.called;
    });

    it("should call run on heartsListener", async () => {
      const aboutStub = sandbox.stub().resolves();
      const client = mock<discordjs.Client>();
      const msg = mock<discordjs.Message>();
      msg.content = `${testPrefix}about`;
      msg.attachments = new discordjs.Collection();
      msg.channel.startTyping = sandbox.stub();
      msg.channel.stopTyping = sandbox.stub();
      msg.guild.id = "server_id";

      const clientInt = extendsClientToClientInt(client);
      clientInt.prefix = { server_id: testPrefix };
      clientInt.commands = { about: mockCmd("about", aboutStub) };
      clientInt.customListeners = await getListeners();
      Object.keys(clientInt.customListeners).forEach((key) => {
        const stub = sandbox.stub();
        stub.resolves();
        clientInt.customListeners[key] = mockListener(key, stub);
      });

      const msgPromise = onMessage(msg, clientInt);
      await sandbox.clock.tickAsync(MAGIC_TIMEOUT);
      await msgPromise;

      const inUselistener = clientInt.customListeners["heartsListener"];

      expect(inUselistener.run).calledOnce;
    });
  });

  context("is direct message", () => {
    it("should send warning", async () => {
      const aboutStub = sandbox.stub().resolves();
      const client = mock<discordjs.Client>();
      const msg = mock<discordjs.Message>();
      const author = mock<discordjs.User>();
      author.id = "1";
      msg.author = author;
      msg.content = `${testPrefix}about`;
      msg.attachments = new discordjs.Collection();
      msg.channel.startTyping = sandbox.stub();
      msg.channel.stopTyping = sandbox.stub();
      msg.channel.send = sandbox.stub().resolves();
      msg.channel.type = "dm";
      msg.guild.id = "server_id";

      const clientInt = extendsClientToClientInt(client);
      clientInt.prefix = { server_id: testPrefix };
      clientInt.user = mock<discordjs.User>();
      clientInt.user.id = "2";
      clientInt.commands = { about: mockCmd("about", aboutStub) };
      clientInt.customListeners = await getListeners();
      Object.keys(clientInt.customListeners).forEach((key) => {
        const stub = sandbox.stub();
        stub.resolves();
        clientInt.customListeners[key] = mockListener(key, stub);
      });

      const msgPromise = onMessage(msg, clientInt);
      await sandbox.clock.tickAsync(MAGIC_TIMEOUT);
      await msgPromise;

      expect(msg.channel.startTyping).calledOnce;
      expect(msg.channel.stopTyping).calledOnce;
      expect(msg.channel.send).calledOnce;
      expect(aboutStub).not.called;
    });
  });
  context("is not a discord server", () => {
    it("should return without calling command", async () => {
      const aboutStub = sandbox.stub().resolves();
      const client = mock<discordjs.Client>();
      const msg: discordjs.Message & { guild } = mock<discordjs.Message>();
      const author = mock<discordjs.User>();
      author.id = "1";
      msg.author = author;
      msg.content = `${testPrefix}about`;
      msg.attachments = new discordjs.Collection();
      msg.guild = null;

      const clientInt = extendsClientToClientInt(client);
      clientInt.prefix = { server_id: testPrefix };
      clientInt.user = mock<discordjs.User>();
      clientInt.commands = { about: mockCmd("about", aboutStub) };

      await onMessage(msg, clientInt);

      expect(aboutStub).not.called;
    });
  });

  context("command does not start with prefix", () => {
    it("should return without calling command", async () => {
      const aboutStub = sandbox.stub().resolves();
      const client = mock<discordjs.Client>();
      const msg = mock<discordjs.Message>();
      const author = mock<discordjs.User>();
      author.id = "1";
      msg.author = author;
      msg.content = `>about`;
      msg.attachments = new discordjs.Collection();
      msg.channel.startTyping = sandbox.stub();
      msg.channel.stopTyping = sandbox.stub();
      msg.channel.send = sandbox.stub().resolves();
      msg.guild.id = "server_id";

      const clientInt = extendsClientToClientInt(client);
      clientInt.prefix = { server_id: testPrefix };
      clientInt.commands = { about: mockCmd("about", aboutStub) };
      clientInt.customListeners = await getListeners();
      Object.keys(clientInt.customListeners).forEach((key) => {
        const stub = sandbox.stub();
        stub.resolves();
        clientInt.customListeners[key] = mockListener(key, stub);
      });

      await onMessage(msg, clientInt);

      expect(aboutStub).not.called;
    });
  });

  context("command exists", () => {
    context("usageListener exists", () => {
      it("should call run on interceptableUsageListener", async () => {
        const aboutStub = sandbox.stub().resolves();
        const client = mock<discordjs.Client>();
        const msg = mock<discordjs.Message>();
        msg.content = `${testPrefix}about`;
        msg.attachments = new discordjs.Collection();
        msg.channel.startTyping = sandbox.stub();
        msg.channel.stopTyping = sandbox.stub();
        msg.guild.id = "server_id";

        const clientInt = extendsClientToClientInt(client);
        clientInt.prefix = { server_id: testPrefix };
        clientInt.commands = { about: mockCmd("about", aboutStub) };
        clientInt.customListeners = await getListeners();
        Object.keys(clientInt.customListeners).forEach((key) => {
          const stub = sandbox.stub();
          stub.resolves();
          clientInt.customListeners[key] = mockListener(key, stub);
        });

        const msgPromise = onMessage(msg, clientInt);
        await sandbox.clock.tickAsync(MAGIC_TIMEOUT);
        await msgPromise;

        const inUselistener =
          clientInt.customListeners["interceptableUsageListener"];
        const notUselistener = clientInt.customListeners["usageListener"];

        expect(inUselistener.run).calledOnce;
        expect(notUselistener.run).not.called;
      });
    });
    it("should call requested command", async () => {
      const aboutStub = sandbox.stub().resolves();
      const client = mock<discordjs.Client>();
      const msg = mock<discordjs.Message>();
      msg.content = `${testPrefix}about`;
      msg.attachments = new discordjs.Collection();
      msg.channel.startTyping = sandbox.stub();
      msg.channel.stopTyping = sandbox.stub();
      msg.guild.id = "server_id";

      const clientInt = extendsClientToClientInt(client);
      clientInt.prefix = { server_id: testPrefix };
      clientInt.commands = { about: mockCmd("about", aboutStub) };
      clientInt.customListeners = await getListeners();
      Object.keys(clientInt.customListeners).forEach((key) => {
        const stub = sandbox.stub();
        stub.resolves();
        clientInt.customListeners[key] = mockListener(key, stub);
      });

      const msgPromise = onMessage(msg, clientInt);
      await sandbox.clock.tickAsync(MAGIC_TIMEOUT);

      await msgPromise;

      expect(aboutStub).calledOnce;
    });
  });
});
