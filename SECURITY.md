# Security

## Reporting a vulnerability

Please report security problems privately, not in a public issue.

Use GitHub's private reporting form: open the repository's **Security** tab and choose **Report a vulnerability** (https://github.com/seo077/zab/security/advisories/new). The report is visible only to the maintainers.

If you cannot use that form, open an issue that says only that you have a security report, without details, and a maintainer will arrange a private channel.

Reports are acknowledged as soon as a maintainer reads them. A fix is released as a new version of the plugin, and the advisory is published once the fix is out.

## What is in scope

zab ships one executable file, `scripts/zab.mjs`, three command hooks that run it, and Markdown documents. The parts most worth checking:

- **The read hook** (`allow-read`). It answers Claude Code's permission check with "allow" for `Read`, `Grep` and `Glob` when the target path, after normalisation, is inside the plugin's own `pipeline/` or `templates/project/` folder. A way to make it allow a path outside those two folders is a vulnerability.
- **The ownership hook** (`own`). It refuses some writes inside a zab project. It is a guard against slips, not a security boundary: it does not see shell commands and it fails open by design. A way to make it block a session, or write somewhere other than `log/직접수정.jsonl` in the project, is a vulnerability.
- **`setup`**. It copies a template into the current folder and never overwrites. A way to make it overwrite or write outside the current folder is a vulnerability.

The script makes no network requests, starts no other programs, and reads no environment variables or credentials. A full list of what runs, and when, is in the README under "What it runs on your machine".

## Supported versions

The latest released version.
