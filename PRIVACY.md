# Privacy

zab is a Claude Code plugin made of Markdown documents and one local script. This page states what it does with data.

## What zab collects

Nothing. zab has no server, no account, no telemetry and no analytics. The script it ships, `scripts/zab.mjs`, contains no network code: it reads and writes local files only, and it does not read environment variables or credentials.

## What zab writes, and where

Everything zab and its agents write stays on your machine, inside the project folder where you ran `/zab:setup`:

- `log/` — the Task ledger, the run log, the decision log, and one folder per Task with its criteria, build notes and verdicts. The decision log quotes your instructions verbatim, because the method records who decided what.
- `output/` — the results the builder produces.
- `pipeline/` — job definitions you create in that project.
- `log/직접수정.jsonl` — one line each time the main session edits a builder-owned file during a Task: a timestamp, the file path, the tool used and the Task step.

zab writes nothing outside that folder. To remove the data, delete the files.

## What zab shares

Nothing. zab sends no data to its authors or to any third party.

zab runs inside Claude Code. When an agent reads one of the files above, its contents become part of your Claude Code session like any other file you open there. How Claude Code and its model provider handle session content is governed by their terms and privacy policy, not by this plugin; zab adds no data flow of its own.

## Children

zab is a developer tool and is not directed at people under 18.

## Changes and contact

Changes to this page are made in this repository and are visible in its history. Questions: open an issue at https://github.com/seo077/zab/issues.
