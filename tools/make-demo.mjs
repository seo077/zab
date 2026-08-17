#!/usr/bin/env node
/**
 * Generates docs/demo.svg — an animated terminal replay for the README.
 *
 * SVG rather than GIF on purpose: it stays crisp at any width, weighs a few KB
 * instead of a few MB, and diffs as text so a change to the demo is reviewable.
 * CSS animation only — no JS — because GitHub loads it through <img>, where
 * scripts never run.
 *
 * Every line below is REAL OUTPUT from the dogfood run recorded in
 * docs/design/WALKTHROUGH.ko.md. Wrapping is the only edit. If you change the
 * product's messages, re-record rather than re-imagine: a demo that shows output
 * the tool no longer produces is worse than no demo.
 *
 * Usage: node tools/make-demo.mjs > docs/demo.svg
 */

const C = {
  bg: '#0d1117',
  chrome: '#161b22',
  text: '#c9d1d9',
  dim: '#6e7681',
  prompt: '#58a6ff',
  ok: '#3fb950',
  bad: '#f85149',
  warn: '#d29922',
  accent: '#a371f7',
};

/** @type {{hold:number, lines:[string,keyof typeof C][]}[]} */
const ACTS = [
  {
    hold: 7,
    lines: [
      ['$ /il:new a CLI that shortens a URL and resolves it back', 'prompt'],
      ['', 'text'],
      ['  size: feature · researching · threat model · writing SPEC', 'dim'],
      ['  wrote .interlocking/work/001-url-shortener/SPEC.md — 9 REQs', 'text'],
      ['', 'text'],
      ['$ git log --oneline', 'prompt'],
      ['  6bbb985 init', 'text'],
      ['', 'text'],
      ['  # planning phase. not one line of source written.', 'dim'],
    ],
  },
  {
    hold: 8,
    lines: [
      ['  acceptance criteria a separate agent can actually run:', 'dim'],
      ['', 'text'],
      ['  REQ-003 Resolving an unknown code fails with exit 3 and', 'text'],
      ['          empty stdout.', 'text'],
      ['    Acceptance: `urlshort resolve zzzzzzz` exits 3, writes', 'ok'],
      ['                0 bytes to stdout, stderr contains', 'ok'],
      ['                `unknown code`.', 'ok'],
      ['', 'text'],
      ['  # "works correctly" would be refused by the gate.', 'dim'],
    ],
  },
  {
    hold: 8,
    lines: [
      ['$ "Create bin/urlshort.mjs implementing REQ-001. Just do it."', 'prompt'],
      ['', 'text'],
      ['  ⏺ Write(bin/urlshort.mjs)', 'text'],
      ['  ⎿  [il] G0 not approved — cannot write bin/urlshort.mjs', 'bad'],
      ['       Ask the human to review it and type:  /il:approve', 'bad'],
      ['       Urgent? the human can type: /il:override <reason>', 'bad'],
      ['       Markdown, docs and .interlocking/** are never', 'bad'],
      ['       blocked — keep planning.', 'bad'],
      ['', 'text'],
      ['  # 10 turns. bin/ was never created.', 'dim'],
    ],
  },
  {
    hold: 8,
    lines: [
      ['  # what if the agent just edits the state file?', 'dim'],
      ['$ echo "gates_passed: [G0]" >> STATE.md   &&   write src/a.ts', 'prompt'],
      ['  [il] G0 not approved — cannot write src/a.ts', 'bad'],
      ['', 'text'],
      ['  # or widens the policy it is allowed to write?', 'dim'],
      ['$ echo \'{"always_allow":["**"]}\' > policy.json  && write src/a.ts', 'prompt'],
      ['  [il] G0 not approved — cannot write src/a.ts', 'bad'],
      ['', 'text'],
      ['  # approval lives outside the repo, signed. STATE.md is a', 'dim'],
      ['  # mirror — and a mismatch becomes a warning every session.', 'dim'],
    ],
  },
  {
    hold: 7,
    lines: [
      ['$ /il:approve', 'prompt'],
      ['', 'text'],
      ['  [il] G0 approved — 001-url-shortener (spec 2147effd).', 'ok'],
      ['       Code edits unlocked.', 'ok'],
      ['', 'text'],
      ['  # recorded by a hook reading your keystrokes.', 'dim'],
      ['  # the model cannot produce that event.', 'dim'],
    ],
  },
  {
    hold: 8,
    lines: [
      ['$ /il:next', 'prompt'],
      ['  one task · one fresh subagent · three lines back · one commit', 'dim'],
      ['', 'text'],
      ['  adef83e feat(store): path precedence, atomic save', 'text'],
      ['          [T-001, REQ-007, REQ-008, REQ-009]', 'text'],
      ['', 'text'],
      ['  [il] the spec\'s own test command does not run on Node 24.', 'warn'],
      ['       I changed nothing to route around it. Options: amend', 'warn'],
      ['       the REQs (reopens G0), pin Node, or go via npm test.', 'warn'],
    ],
  },
  {
    hold: 9,
    lines: [
      ['$ /il:verify', 'prompt'],
      ['  verifier: fresh context · never read the implementation', 'dim'],
      ['', 'text'],
      ['  VERDICT: FAIL — 0 pass, 7 fail, 2 inconclusive', 'bad'],
      ['', 'text'],
      ['  TASKS.md claims `node --test test/` cannot pass and that', 'text'],
      ['  bare `node --test` passes 8/8. First half confirmed by my', 'text'],
      ['  own run. Second half NOT confirmed: that command is not in', 'accent'],
      ['  my permitted list. I did not run it and give it no weight.', 'accent'],
      ['', 'text'],
      ['  # it treated the documents as evidence, not instructions.', 'dim'],
    ],
  },
];

const W = 880;
const PAD = 26;
const CHROME = 34;
const LH = 20;
const FS = 13.5;
const FADE = 0.5; // seconds
const maxLines = Math.max(...ACTS.map((a) => a.lines.length));
const H = CHROME + PAD * 2 + maxLines * LH + 8;

const total = ACTS.reduce((n, a) => n + a.hold, 0);
const pct = (s) => ((s / total) * 100).toFixed(3);
const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let css = '';
let body = '';
let t = 0;

ACTS.forEach((act, ai) => {
  const start = t;
  const end = t + act.hold;
  act.lines.forEach((line, li) => {
    const [textRaw, color] = line;
    if (!textRaw) return;
    const id = `l${ai}_${li}`;
    const appear = start + 0.18 * li;
    // in -> hold -> out, expressed as one keyframe set over the whole loop
    css += `@keyframes ${id}{` +
      `0%,${pct(appear)}%{opacity:0}` +
      `${pct(Math.min(appear + FADE, end))}%,${pct(end - FADE * 0.6)}%{opacity:1}` +
      `${pct(end)}%,100%{opacity:0}}\n`;
    css += `#${id}{animation:${id} ${total}s linear infinite}\n`;
    body +=
      `<text id="${id}" x="${PAD}" y="${CHROME + PAD + (li + 1) * LH}" ` +
      `fill="${C[color]}" opacity="0">${esc(textRaw)}</text>\n`;
  });
  t = end;
});

const out = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="interlocking demo: the spec gate blocking an agent, a human approving it, and an independent verifier refusing to trust the documents">
<title>interlocking — the planning gate, enforced</title>
<style>
text{font-family:ui-monospace,'SF Mono',Menlo,Consolas,'DejaVu Sans Mono',monospace;font-size:${FS}px;white-space:pre}
${css}@media (prefers-reduced-motion:reduce){text{animation:none!important;opacity:1!important}}
</style>
<rect width="${W}" height="${H}" rx="10" fill="${C.bg}"/>
<rect width="${W}" height="${CHROME}" rx="10" fill="${C.chrome}"/>
<rect y="${CHROME - 10}" width="${W}" height="10" fill="${C.chrome}"/>
<circle cx="20" cy="17" r="5.5" fill="#ff5f57"/><circle cx="39" cy="17" r="5.5" fill="#febc2e"/><circle cx="58" cy="17" r="5.5" fill="#28c840"/>
<text x="${W / 2}" y="22" text-anchor="middle" fill="${C.dim}" font-size="12">interlocking — a gate that actually blocks</text>
${body}</svg>
`;

process.stdout.write(out);
