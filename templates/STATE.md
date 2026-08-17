---
# STATE.md — the resume anchor. If a session dies, this is what brings the next one back.
#
# FRONTMATTER IS A FLAT SUBSET, on purpose: the hook parses it without a YAML
# dependency. Supported forms are `key: scalar`, `key: "quoted"`, `key: [a, b]`,
# and null / true / false / number. Nested maps and block sequences are IGNORED.
#
# `gates_passed` is a MIRROR for humans to read. The hook never trusts it — approval
# lives in a signed record outside the repo. Editing this line does not open a gate;
# it only makes il report a mismatch.
il_version: 1
feature: 001-login
phase: SPEC
size: feature
gates_passed: []
spec_sha256: null
next_action: "Draft SPEC.md — interview round 1"
blocked_on: null
open_assumptions: []
last_verified_commit: null
head_commit: null
updated_at: null
---

# 001-login

## Resume brief
<!-- Rewritten in full on every update. Max 8 lines — it is injected into every session. -->
- Goal:
- Done:
- Now:
- Watch:

## History
<!-- APPEND ONLY, newest last. One line per meaningful event; never rewrite old lines. -->
