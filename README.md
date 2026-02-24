# NanoClaw (Slack Fork)

A personal fork of [NanoClaw](https://github.com/qwibitai/nanoclaw) customized for Slack with per-thread session persistence.

See the [upstream README](https://github.com/qwibitai/nanoclaw#readme) for philosophy, architecture, and general usage.

## What's Different

**Slack instead of WhatsApp.** Uses Slack Socket Mode for all messaging. No WhatsApp dependency.

**Thread-based conversations.** Each Slack thread maintains its own Claude session. Reply in a thread and the agent remembers the conversation. New top-level messages start fresh sessions.

**Ack messages.** The bot sends a thinking indicator when it receives a message, automatically replaced by the real response.

**IPC thread awareness.** When the agent uses `send_message` mid-task, messages go to the correct thread instead of top-level.

## Setup

```bash
git clone <this-repo>
cd nanoclaw
claude
```

Then run `/setup`.

## Updating from Upstream

```bash
claude
```

Then run `/update` to pull upstream NanoClaw changes and merge with these customizations.

## Requirements

- Linux or macOS
- Node.js 20+
- [Claude Code](https://claude.ai/download)
- Docker (or [Apple Container](https://github.com/apple/container) on macOS)
- Slack workspace with a bot app (Socket Mode + Bot Token)

## License

MIT
