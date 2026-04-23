---
mode: ask
description: Write a PR description using the project PR template based on current branch changes
tools: [execute, github_repo]
---

You are writing a GitHub pull request description for this repository.

## Step 1 — Gather context

### 1a. Identify the branch and issue

Run `git branch --show-current` to get the current branch name.

Check the branch name for an issue number (e.g., `feat/9-branding-theme-onboarding` → issue `#9`). Common patterns: `feat/123-...`, `fix/45-...`, `issue-7-...`, or any leading number after the first `/` or `-`.

### 1b. Fetch issue context (if issue number found)

If an issue number is detected, use the GitHub MCP tools to fetch the issue details (title, description, labels, acceptance criteria). Use this context to write a more accurate Summary and verify the Changes align with the issue scope.

### 1c. Gather the diff

Run the following commands to understand the changes:

```bash
git log origin/master..HEAD --oneline
git diff origin/master..HEAD --stat
git diff origin/master..HEAD
```

## Step 2 — Produce the PR description

Using the diff and commit log above, produce a completed PR description using **exactly** the template structure below.

> **Output format**: Always wrap the entire PR description in a single ` ```markdown ` code block so the developer can copy-paste it directly into GitHub. Do not output anything outside the code block.

---

```markdown
## Summary

<!-- One or two sentences describing what this PR does and why. -->

## Closes

<!-- If the branch references a GitHub issue number, add "Closes #N" here. Otherwise remove this section. -->

## Type of change

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — code change that isn't a fix or feature
- [ ] `chore` — build, tooling, dependencies
- [ ] `docs` — documentation only

## Changes

<!-- List the key changes made -->

-
-

## Screenshots / Demo

<!-- For UI changes, note whether screenshots are needed. If no UI changes, write "No UI changes." -->

## Checklist

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` passes with no errors
- [ ] Tested on mobile (or verified responsive layout)
- [ ] No hardcoded secrets or `.env` values committed
- [ ] Server actions call `requireAuth()` if they mutate data
- [ ] `revalidatePath()` called after mutations
```

---

## Rules

- Check the **type of change** checkboxes that apply based on the commit types (`feat`, `fix`, `chore`, `refactor`, `docs`).
- If an issue number is detected from the branch name, include `Closes #N` in the **Closes** section. If no issue is found, omit the Closes section entirely.
- The **Summary** should be a plain-English explanation of the intent — not just a list of files changed.
- The **Changes** list should cover what changed and why, not just filenames.
- If the diff touches only non-UI files (actions, config, types), mark Screenshots as "No UI changes."
- Replace all `<!-- comment -->` placeholders with real content.
- The entire output must be a single ` ```markdown ` code block. No text before or after it.
