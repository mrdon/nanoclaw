import { App, LogLevel } from '@slack/bolt';

import { logger } from '../logger.js';
import { Channel, OnInboundMessage, OnChatMetadata, RegisteredGroup } from '../types.js';

export interface SlackChannelOpts {
  onMessage: OnInboundMessage;
  onChatMetadata: OnChatMetadata;
  registeredGroups: () => Record<string, RegisteredGroup>;
  botToken: string;
  appToken: string;
}

/** Extract and validate Block Kit JSON from `<blocks>[...]</blocks>` tags. */
function parseBlocks(text: string): { blocks: unknown[]; fallbackText: string } | null {
  const match = text.match(/<blocks>([\s\S]*?)<\/blocks>/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Every block must have a `type` field
    if (!parsed.every((b: unknown) => typeof b === 'object' && b !== null && 'type' in b)) return null;

    // Build fallback text from content outside <blocks> tags
    const fallbackText = text.replace(/<blocks>[\s\S]*?<\/blocks>/, '').trim() || 'Message from Andy';
    return { blocks: parsed, fallbackText };
  } catch {
    return null;
  }
}

export class SlackChannel implements Channel {
  name = 'slack';

  private app: App;
  private connected = false;
  private opts: SlackChannelOpts;
  private botUserId: string | undefined;

  constructor(opts: SlackChannelOpts) {
    this.opts = opts;
    this.app = new App({
      token: opts.botToken,
      appToken: opts.appToken,
      socketMode: true,
      logLevel: LogLevel.WARN,
    });
  }

  async connect(): Promise<void> {
    // Get bot's own user ID so we can filter self-messages
    try {
      const authResult = await this.app.client.auth.test({ token: this.opts.botToken });
      this.botUserId = authResult.user_id as string;
      logger.info({ botUserId: this.botUserId }, 'Slack bot identity resolved');
    } catch (err) {
      logger.error({ err }, 'Failed to resolve Slack bot identity');
      throw err;
    }

    // Listen for all messages
    this.app.message(async ({ message }) => {
      // Only handle regular user messages (not bot messages, edits, deletes, etc.)
      if (message.subtype && message.subtype !== 'file_share') return;
      if (!('text' in message) || !message.text) return;
      if (!('user' in message)) return;

      const channelId = message.channel;
      const jid = `slack:${channelId}`;
      const timestamp = new Date(Number(message.ts) * 1000).toISOString();

      // Determine if this is a group channel or DM
      const isGroup = channelId.startsWith('C') || channelId.startsWith('G');

      // Notify about chat metadata for discovery
      this.opts.onChatMetadata(jid, timestamp, undefined, 'slack', isGroup);

      // Only deliver full message for registered groups
      const groups = this.opts.registeredGroups();
      if (groups[jid]) {
        const isFromMe = message.user === this.botUserId;
        const isBotMessage = isFromMe || ('bot_id' in message && !!message.bot_id);

        // Resolve sender display name
        let senderName = message.user;
        try {
          const userInfo = await this.app.client.users.info({
            token: this.opts.botToken,
            user: message.user,
          });
          senderName = userInfo.user?.real_name || userInfo.user?.name || message.user;
        } catch {
          // Fall back to user ID
        }

        // Compute thread to reply in: top-level → create thread under message.ts;
        // thread reply → stay in existing thread via message.thread_ts
        const threadTs = ('thread_ts' in message ? message.thread_ts : message.ts) as string;

        this.opts.onMessage(jid, {
          id: message.ts,
          chat_jid: jid,
          sender: message.user,
          sender_name: senderName,
          content: message.text,
          timestamp,
          is_from_me: isFromMe,
          is_bot_message: isBotMessage,
          thread_ts: threadTs,
        });
      }
    });

    await this.app.start();
    this.connected = true;
    logger.info('Connected to Slack via Socket Mode');
  }

  async sendMessage(jid: string, text: string, threadTs?: string): Promise<void> {
    const channelId = jid.replace('slack:', '');

    // Try Block Kit JSON first
    const blockKit = parseBlocks(text);
    if (blockKit) {
      try {
        await this.app.client.chat.postMessage({
          token: this.opts.botToken,
          channel: channelId,
          text: blockKit.fallbackText,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          blocks: blockKit.blocks as any,
          thread_ts: threadTs,
        });
        logger.info({ jid, blockCount: blockKit.blocks.length }, 'Slack Block Kit message sent');
        return;
      } catch (err) {
        logger.warn({ jid, err }, 'Block Kit rejected by Slack, falling back to markdown');
        // Fall through to markdown fallback
      }
    }

    // Send as mrkdwn block (supports Slack markdown natively)
    const plainText = blockKit ? blockKit.fallbackText : text;
    try {
      await this.app.client.chat.postMessage({
        token: this.opts.botToken,
        channel: channelId,
        text: plainText,
        blocks: [{ type: 'markdown', text: plainText }],
        thread_ts: threadTs,
      });
      logger.info({ jid, length: plainText.length }, 'Slack markdown message sent');
    } catch (err) {
      logger.warn({ jid, err }, 'Markdown block failed, falling back to plain text');
      try {
        await this.app.client.chat.postMessage({
          token: this.opts.botToken,
          channel: channelId,
          text: plainText,
          thread_ts: threadTs,
        });
        logger.info({ jid, length: plainText.length }, 'Slack plain text message sent');
      } catch (err2) {
        logger.error({ jid, err: err2 }, 'Failed to send Slack message');
        throw err2;
      }
    }
  }

  async sendAck(jid: string, threadTs?: string): Promise<string | undefined> {
    const channelId = jid.replace('slack:', '');
    try {
      const result = await this.app.client.chat.postMessage({
        token: this.opts.botToken,
        channel: channelId,
        text: ':thinking_face:',
        thread_ts: threadTs,
      });
      const ts = result.ts;
      logger.debug({ jid, ts }, 'Ack message sent');
      return ts;
    } catch (err) {
      logger.warn({ jid, err }, 'Failed to send ack message');
      return undefined;
    }
  }

  async deleteMessage(jid: string, messageId: string): Promise<void> {
    const channelId = jid.replace('slack:', '');
    try {
      await this.app.client.chat.delete({
        token: this.opts.botToken,
        channel: channelId,
        ts: messageId,
      });
      logger.debug({ jid, ts: messageId }, 'Ack message deleted');
    } catch (err) {
      logger.warn({ jid, ts: messageId, err }, 'Failed to delete ack message');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  ownsJid(jid: string): boolean {
    return jid.startsWith('slack:');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    await this.app.stop();
  }
}
