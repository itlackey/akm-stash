---
schedule: "*/15 * * * *"
prompt: inline
description: Use when the stash should check every 15 minutes for pending proposals and send one OS notification when review is needed.
tags: [scheduled, proposals, notification]
enabled: true
---

# Task: Proposal review notification

Check whether this stash has pending proposals that need review.

1. Run `akm proposals --status pending --format json`.
2. If the result has `totalCount: 0`, exit quietly with a one-line summary and
   do not send a notification.
3. If one or more proposals are pending, send a local OS notification using the
   first available method in this order:
   - `apprise -c ~/.openpalm/vault/user/apprise.conf -t "AKM proposals pending" -b "<count> proposal(s) need review in $(pwd). Run: akm proposals"`
   - `notify-send "AKM proposals pending" "<count> proposal(s) need review in $(pwd). Run: akm proposals"`
   - `osascript -e 'display notification "<count> proposal(s) need review in $(pwd). Run: akm proposals" with title "AKM proposals pending"'`
4. If none of those notification commands exist, report that proposals are
   pending and that no supported notifier was available.
5. Do not accept or reject proposals automatically.

Finish with a concise summary that states the pending proposal count and which
notification method was used, if any.
