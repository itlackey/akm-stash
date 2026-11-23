# commands/

Prompt templates with `$ARGUMENTS` placeholders, intended to be executed as
slash commands (Claude Code) or `akm run commands/<name> --arguments "..."`
invocations. Each command is one prompt — short, parameterized, single-task.
The single argument string replaces `$ARGUMENTS`.

For multi-step automation see [`tasks/`](../tasks). For interactive,
progressive-disclosure guides see [`skills/`](../skills).

Browse the full set with:

```bash
akm search --type command
```
