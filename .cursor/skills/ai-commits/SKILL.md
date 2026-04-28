---
name: ai-commits
description: Create a git commit messages using the gitmoji standard with lowercase text. Use this skill whenever the user asks to write, generate, suggest, or create a git commit message, or when they describe changes they've made and need a commit message for them. Also trigger when the user says things like "commit this", "what should my commit say", or "help me commit".
---

# Git Commit Message Creator

Generates commit messages following the gitmoji standard with all message text in lowercase.

## Output Format

```
<emoji> <short description in lowercase>
```

For commits that benefit from more context, use the extended format:

```
<emoji> <short description in lowercase>

<optional body: brief lowercase explanation of *why*, not *what*>
```

- The emoji is always a unicode character (e.g. ✨ not `:sparkles:`)
- All text after the emoji is **lowercase** — no sentence case, no title case, no caps
- The short description is imperative mood ("add feature", not "added feature" or "adds feature")
- Keep the first line under 72 characters including the emoji
- No period at the end of the subject line
- Body is optional — only include it when the *why* isn't obvious from the subject

## Emoji Selection Process

1. Identify the **primary intent** of the change (not every file touched)
2. Pick the single best-fit emoji from `references/gitmoji-list.md`
3. When genuinely ambiguous, prefer the more specific emoji over a catch-all like ✨

Read `references/gitmoji-list.md` for the full gitmoji list with meanings.

## Decision Guide for Common Ambiguities

| Situation | Use |
|-----------|-----|
| New user-facing feature | ✨ |
| Bug fix | 🐛 |
| Tiny / trivial fix | 🩹 |
| Urgent production fix | 🚑️ |
| Style / formatting only, no logic change | 🎨 |
| Refactor with no behavior change | ♻️ |
| Add or update tests | ✅ |
| Update docs or comments | 📝 or 💡 |
| Dependency bump | ⬆️ / ⬇️ |
| Config file change | 🔧 |
| Delete files or dead code | 🔥 |
| Breaking change | 💥 |
| WIP / incomplete | 🚧 |

## Examples

**Feature addition:**
```
✨ add dark mode toggle to settings panel
```

**Bug fix:**
```
🐛 fix null pointer when user has no profile photo
```

**Documentation:**
```
📝 update readme with new environment variable setup
```

**Refactor:**
```
♻️ extract payment logic into dedicated service class
```

**Dependency upgrade:**
```
⬆️ upgrade react to v19.1
```

**With body (when why isn't obvious):**
```
⚡️ cache user permissions on login

permissions were being re-fetched on every route change,
causing noticeable lag in the sidebar
```

**Breaking change:**
```
💥 remove legacy v1 api endpoints

v1 endpoints have been deprecated since march 2024.
clients should migrate to v2 before upgrading.
```

## When the User Provides a Diff or Description

If the user pastes a diff, list of changed files, or describes their changes in plain language:

1. Read through to understand the *primary intent*
2. Do not try to capture every changed file in one message — focus on the dominant theme
3. If the diff touches multiple unrelated concerns, mention that the changes could be split into separate commits, then still generate the best single message for the whole thing
4. Ask for clarification only if the intent is genuinely unclear after reading the diff

## What NOT to Do

- ❌ Don't use shortcode format (`:sparkles:`) — use the unicode emoji directly
- ❌ Don't capitalize the first word of the message text
- ❌ Don't end the subject line with a period
- ❌ Don't use multiple emojis per commit message
- ❌ Don't be vague ("✨ update stuff", "🐛 fix bug") — be specific about what changed
- ❌ Don't write in past tense ("fixed", "added") — use imperative ("fix", "add")
