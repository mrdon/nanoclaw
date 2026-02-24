---
name: slack-formatting
description: Format rich Slack messages with Block Kit — buttons, structured layouts, images, and interactive elements. Use when plain markdown isn't enough.
---

# Slack Block Kit Formatting

## When to Use

- **Plain markdown** — default for all messages. Slack renders it natively.
- **Block Kit** — use when you need buttons, structured layouts, images, multi-column content, or interactive elements.

## Output Format

Wrap Block Kit JSON in `<blocks>` tags:

```
<blocks>[{"type": "header", "text": {"type": "plain_text", "text": "Report Ready"}}]</blocks>
```

The system validates and sends the blocks. If Slack rejects them, it falls back to markdown automatically.

## Block Types

### header
```json
{"type": "header", "text": {"type": "plain_text", "text": "Title Here"}}
```

### markdown
Rich text block using Slack's `mrkdwn` syntax.
```json
{"type": "markdown", "text": "**Bold** and *italic* with `code`"}
```

### section (with accessory)
```json
{
  "type": "section",
  "text": {"type": "mrkdwn", "text": "Pick a date:"},
  "accessory": {
    "type": "datepicker",
    "action_id": "date_pick",
    "placeholder": {"type": "plain_text", "text": "Choose"}
  }
}
```

### divider
```json
{"type": "divider"}
```

### image
```json
{
  "type": "image",
  "image_url": "https://example.com/image.png",
  "alt_text": "Description"
}
```

### context
Small text/images in a row (max 10 elements).
```json
{
  "type": "context",
  "elements": [
    {"type": "mrkdwn", "text": ":calendar: Updated Jan 1, 2026"}
  ]
}
```

### actions
Row of interactive elements (max 25).
```json
{
  "type": "actions",
  "elements": [
    {
      "type": "button",
      "text": {"type": "plain_text", "text": "Approve"},
      "style": "primary",
      "action_id": "approve"
    },
    {
      "type": "button",
      "text": {"type": "plain_text", "text": "Reject"},
      "style": "danger",
      "action_id": "reject"
    }
  ]
}
```

### rich_text
For complex formatting (lists, quotes, inline code, links).
```json
{
  "type": "rich_text",
  "elements": [
    {
      "type": "rich_text_section",
      "elements": [
        {"type": "text", "text": "Hello ", "style": {"bold": true}},
        {"type": "link", "url": "https://example.com", "text": "click here"}
      ]
    },
    {
      "type": "rich_text_list",
      "style": "bullet",
      "elements": [
        {"type": "rich_text_section", "elements": [{"type": "text", "text": "Item one"}]},
        {"type": "rich_text_section", "elements": [{"type": "text", "text": "Item two"}]}
      ]
    }
  ]
}
```

## Interactive Elements (use inside `actions` block)

| Type | Key Fields |
|------|------------|
| `button` | `text`, `action_id`, `style` (`primary`/`danger`), optional `url` |
| `static_select` | `placeholder`, `action_id`, `options` (array of `{text, value}`) |
| `overflow` | `action_id`, `options` (array of `{text, value}`) |
| `datepicker` | `action_id`, `placeholder` |

## Common Patterns

### Status update with button
```
<blocks>[
  {"type": "header", "text": {"type": "plain_text", "text": "Deploy Complete"}},
  {"type": "markdown", "text": "Version *2.1.0* deployed to production.\n\n:white_check_mark: All health checks passing"},
  {"type": "divider"},
  {"type": "actions", "elements": [
    {"type": "button", "text": {"type": "plain_text", "text": "View Logs"}, "url": "https://logs.example.com", "action_id": "view_logs"}
  ]}
]</blocks>
```

### List with context
```
<blocks>[
  {"type": "header", "text": {"type": "plain_text", "text": "Open Tasks"}},
  {"type": "markdown", "text": "1. Fix login bug\n2. Update docs\n3. Review PR #42"},
  {"type": "context", "elements": [
    {"type": "mrkdwn", "text": ":clock1: Last updated: just now"}
  ]}
]</blocks>
```

## Constraints

- Max 50 blocks per message
- Max 3000 characters per section text
- Max 12000 characters per markdown block
- `plain_text` fields don't support markdown
- `mrkdwn` fields use Slack's mrkdwn (not standard markdown)
- Button `url` opens a link; without `url`, button triggers an action
