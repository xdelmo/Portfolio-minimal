---
title: Shipping a portfolio with AI agents and a CI gate
description: Most changes to this site are written by AI coding agents and merged without a human review. The workflow that makes that safe: issues first, named branches, one ship command and a CI that has the last word.
date: 2026-11-21
---
Most commits on this site are written by AI coding agents. I describe a problem, an agent opens an issue, writes the change, and the pull request merges on its own when CI passes. I do not review every pull request.

That only works because the repository decides what "done" means. An agent can be confident and wrong, so no single step trusts it. The process does the checking.

## Every change starts as an issue

Every problem gets a GitHub issue before anyone investigates it. The branch carries the issue number and a prefix that says what kind of change it is: `fix/599-accent-contrast`, `feat/1-blog`, `docs/542-…`. A script, `scripts/branch-name.mjs`, enforces the format in the `pre-push` hook and again in CI, so a branch named by a worktree tool gets renamed before it leaves the machine.

The hook also refuses direct pushes to `devel` and `master`. Everything goes through a pull request.

## One command to ship

`npm run ship` runs `scripts/ship.sh`: it pushes the branch, opens the pull request into `devel`, waits for the GitHub Actions checks and merges with a merge commit only when they pass. A ruleset on both protected branches requires one job, `CI ok`, which turns green only when every other job passed or was skipped.

The full gate runs in CI, not on the laptop: lint with zero warnings, unit tests, script tests, the static build of both languages and Playwright end to end tests with axe accessibility checks in both themes. Specs changed by the pull request run five more times to catch flaky tests before they land.

A red CI is fixed on the branch. It never gets merged "to fix later".

## Docs travel with the change

An agent forgets everything between sessions. Whatever it learned has to end up in a file the next session reads, so the docs are part of the change. A new command goes in `CLAUDE.md`, a visual rule in the style guide, a spec change in the spec's changelog.

`ship.sh` enforces it: when code changed and no doc did, it stops. Skipping that check takes an explicit flag, which means a decision instead of an oversight.

## Failures become rules

When something breaks in CI and no automatic guard can prevent it, the fix comes with a rule in `CODING_STANDARDS.md`. Agents read that file before writing tests or motion code.

The clearest example is WebKit. Most red CI runs used to be Safari and iPhone failures nobody had seen locally, because WebKit does not run natively on my Mac. Now `npm run e2e:webkit` runs the same tests in CI's Linux Playwright image through a container, and it is part of the local `verify`. Another rule came from a fanless laptop sleeping halfway through the suite: wrap long runs in `caffeinate`.

Each rule is small. Together they mean the same mistake rarely reaches CI twice.

## What stays human

Some decisions are mine. `devel` collects the work, and only I say when it goes live: one large pull request from `devel` to `master`, merged after an explicit yes. Design direction, copy that speaks for me and anything touching privacy stay with me too.

The agents are fast at the parts with a clear right answer. The repository is the reason I can let them work on their own.
