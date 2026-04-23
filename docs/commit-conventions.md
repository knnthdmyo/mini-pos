# Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

## Types

| Type       | When to use                                |
| ---------- | ------------------------------------------ |
| `feat`     | New feature or user-visible functionality  |
| `fix`      | Bug fix                                    |
| `chore`    | Build process, tooling, dependency updates |
| `docs`     | Documentation only changes                 |
| `style`    | Formatting, whitespace — no logic change   |
| `refactor` | Code restructure without feature/fix       |
| `perf`     | Performance improvements                   |
| `test`     | Adding or updating tests                   |
| `revert`   | Reverting a previous commit                |

## Scopes

| Scope       | Area                              |
| ----------- | --------------------------------- |
| `pos`       | POS screen and cart               |
| `queue`     | Order queue                       |
| `inventory` | Inventory management              |
| `batch`     | Batch preparation                 |
| `reports`   | Reports page                      |
| `auth`      | Authentication                    |
| `actions`   | Server actions (`lib/actions/`)   |
| `db`        | Database migrations and functions |
| `ui`        | Shared UI components              |
| `layout`    | Dashboard layout and navigation   |
| `scripts`   | Dev/debug scripts                 |

## Examples

```
feat(pos): add +/- quantity buttons to cart
fix(queue): restore stock on order cancel
chore: upgrade Next.js to 14.3
docs: update README with SpecKit workflow
refactor(actions): extract order validation helper
```

## Rules

- Use the **imperative mood**: "add" not "added" or "adds"
- Keep the subject line under **72 characters**
- Do not end the subject with a period
- Reference issues in the footer: `Closes #12`
