// The design brief is the screen a human approves from, so its failure mode is
// not a crash — it is a line that reads plausibly and is not what the SPEC says.
// Every test here is about that: quoted, not composed; complete, not summarised;
// and the two things it must never do is drop a requirement or invent one.
//
// Wrapping gets the same attention because the specs this harness is used on are
// written in Korean, where a 78-CHARACTER line is 150 COLUMNS wide and the
// terminal re-wraps it into exactly the mess the brief exists to avoid.
//
// The requirement and the criterion under it come from two different files
// written by two different agents. The brief's job is to put them side by side —
// so the tests below feed SPEC and CRITERIA separately and check the pairing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeDesignBrief, wrapText, displayWidth, BRIEF_WIDTH } from '../hooks/il.mjs';

const SPEC = `# SPEC — 001-anchor-layer

## Background

Coordinates only exist in the PDF.

## Decisions

DEC-001 Coordinates always come from the PDF; LaTeX supplies structure only.
  Asked: On the arXiv path, where do the coordinates come from?
  Answer: Always the PDF, same version as the source.
  Lands in: REQ-001, REQ-002

DEC-002 pdfplumber, not PyMuPDF.
  Asked: Which PDF engine — 8x slower and MIT, or fast and AGPL?
  Answer: MIT. Do not close off hosting it later.
  Lands in: REQ-002

## Size

\`feature\`

<!-- il:normative:begin -->

## Requirements

REQ-001 The fetcher turns an arXiv id into one cached document.

REQ-002 [circuit] A PDF with no text layer is refused rather than anchored.
  It is refused before indexing, not after.

REQ-003 Anchors survive a restart.

## Threat model

| Asset | Threat | Mitigation | Becomes |
|---|---|---|---|
| the user's unpublished PDF | cache lands in the repo and gets committed | keep the cache outside the repo | REQ-001 |
| arXiv infrastructure | repeated runs become a request flood | 3s spacing, no network on cache hit | REQ-002 |

Out of scope, and why: man-in-the-middle (ASM-002).

## Assumptions

ASM-001 The output of this slice is a local CLI. (user: explicitly agreed)
  Affects: REQ-001

ASM-002 (user: 미확인) The five fixture papers are chosen in the first task.
  Affects: REQ-003

<!-- il:normative:end -->

## Out of scope

- OCR. A PDF with no text layer is refused.
- Comparing several papers.
`;

// Written by il-criteria, which did not write the spec above. REQ-003 is left
// out on purpose: an uncriterioned requirement must be visible as a hole, not
// quietly listed as though someone could rule on it.
const CRITERIA = `# CRITERIA — 001-anchor-layer

<!-- il:normative:begin -->

REQ-001
  Judged: \`ps fetch 1706.03762v5\` writes paper.pdf and meta.json; the recorded
  pdf_sha256 equals the file's actual sha256.
  Method: run the command in a temp cache dir and compare hashes

REQ-002
  Judged: exit code 2 and NO_TEXT_LAYER on stderr; anchors.json not created.
  Method: run against fixtures/scanned.pdf

<!-- il:normative:end -->
`;

const brief = (spec = SPEC, extra = {}) =>
  composeDesignBrief({ feature: '001-anchor-layer', spec, criteria: CRITERIA, ...extra });

// ─────────────────────────────────────────────────────────────────────────────
// displayWidth / wrapText — columns, not characters
// ─────────────────────────────────────────────────────────────────────────────

test('Korean counts two columns per character, ASCII one', () => {
  assert.equal(displayWidth('abc'), 3);
  assert.equal(displayWidth('앵커'), 4);
  assert.equal(displayWidth('앵커 layer'), 4 + 1 + 5);
  assert.equal(displayWidth(''), 0);
  assert.equal(displayWidth(null), 0);
});

test('wrapping a Korean line respects the column budget, not the character count', () => {
  const korean = '앵커 인덱스는 문장 단위로 만들어지고 각 문장은 페이지 번호와 rect 배열을 갖는다 그리고 더 길어진다';
  const lines = wrapText(korean, 40);
  assert.ok(lines.length > 1, 'a 100-column line must wrap at 40');
  for (const l of lines) assert.ok(displayWidth(l) <= 40, `overflowed: ${displayWidth(l)} cols — ${l}`);
  // Nothing may be lost or duplicated in the process.
  assert.equal(lines.join(' ').split(/\s+/).join(' '), korean);
});

test('the indent comes out of the budget, not on top of it', () => {
  const lines = wrapText('one two three four five six seven eight nine ten', 30, '      ');
  for (const l of lines) {
    assert.ok(l.startsWith('      '));
    assert.ok(displayWidth(l) <= 30);
  }
});

test('a hanging indent applies to continuation lines only', () => {
  // Without it, the second line of a wrapped requirement starts in the same
  // column as the id and reads as a new item.
  const lines = wrapText('one two three four five six seven eight', 24, '  ', '        ');
  assert.ok(lines.length > 1);
  assert.ok(lines[0].startsWith('  ') && !lines[0].startsWith('   '));
  for (const l of lines.slice(1)) assert.ok(l.startsWith('        '), l);
  for (const l of lines) assert.ok(displayWidth(l) <= 24, `${displayWidth(l)}: ${l}`);
});

test('a token longer than the budget overflows rather than being cut in half', () => {
  // Breaking a URL across lines makes it uncopyable, which is worse than ragged.
  const url = 'https://info.arxiv.org/help/api/tou.html#a-very-long-fragment-here';
  const lines = wrapText(`see ${url} (read 2026-08-19)`, 30);
  assert.ok(lines.some((l) => l.includes(url)), `the url was split: ${JSON.stringify(lines)}`);
});

test('wrapText never throws and never returns a phantom line', () => {
  assert.deepEqual(wrapText('', 40), []);
  assert.deepEqual(wrapText('   \n  \n ', 40), []);
  assert.deepEqual(wrapText(undefined, 40), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// composeDesignBrief — every requirement, and how each is judged
// ─────────────────────────────────────────────────────────────────────────────

test('every requirement appears, with the criterion CRITERIA.md sets for it', () => {
  const out = brief();
  for (const id of ['REQ-001', 'REQ-002', 'REQ-003']) {
    assert.ok(out.includes(id), `${id} is missing from the brief a human approves from`);
  }
  assert.ok(out.includes('ps fetch 1706.03762v5'), 'the criterion must be quoted, not described');
  assert.ok(out.includes('NO_TEXT_LAYER'));
});

test('the criterion is quoted from CRITERIA.md, never from the spec', () => {
  // A spec that kept an inline "Acceptance:" must not be able to supply the
  // yardstick — otherwise the author of the requirement is grading it again.
  const withInline = SPEC.replace(
    'REQ-003 Anchors survive a restart.',
    'REQ-003 Anchors survive a restart.\n  Acceptance: whatever the implementer says is fine.'
  );
  const out = composeDesignBrief({ feature: '001-anchor-layer', spec: withInline, criteria: CRITERIA });
  const req003 = out.slice(out.indexOf('REQ-003'), out.indexOf('REQ-003') + 400);
  assert.match(req003, /judged\s+NOTHING/, 'the inline acceptance must not be promoted to a criterion');
});

test('a requirement with no criterion is called out, not quietly listed', () => {
  const out = brief();
  const req003 = out.slice(out.indexOf('REQ-003'), out.indexOf('REQ-003') + 300);
  assert.match(req003, /judged\s+NOTHING/, 'REQ-003 has no criterion and the brief must say so');
});

test('with no CRITERIA.md at all, the brief says so once rather than N times', () => {
  const out = composeDesignBrief({ feature: '001-anchor-layer', spec: SPEC });
  assert.match(out, /No CRITERIA\.md yet/);
});

test('the method is shown under the criterion when there is one', () => {
  assert.match(brief(), /how\s+run against fixtures\/scanned\.pdf/);
});

test('the domain tag survives into the brief', () => {
  // It decides which verifier rules on the REQ later, so hiding it here would
  // hide a routing decision the human is approving.
  assert.match(brief(), /REQ-002 \[circuit\]/);
});

test('the requirement body and its criterion are not run together', () => {
  const out = brief();
  assert.ok(out.includes('It is refused before indexing, not after.'));
  assert.ok(out.includes('judged'), 'the criterion is labelled separately from the requirement text');
});

test('decisions lead, with the question and the human answer kept apart', () => {
  const out = brief();
  const decIdx = out.indexOf('DEC-001');
  const reqIdx = out.indexOf('REQ-001');
  assert.ok(decIdx > 0 && decIdx < reqIdx, 'what the human decided comes before what was built from it');
  assert.ok(out.includes('Which PDF engine'), 'the question asked');
  assert.ok(out.includes('MIT. Do not close off hosting it later.'), 'their answer, in their words');
  assert.match(out, /lands\s+REQ-001, REQ-002/);
});

test('a spec with no decisions says so instead of showing an empty heading', () => {
  const out = brief(SPEC.replace(/## Decisions[\s\S]*?## Size/, '## Size'));
  assert.match(out, /DECIDED WITH YOU \(0\)/);
  assert.match(out, /No DEC-### entries/);
});

test('unconfirmed assumptions are marked; agreed ones are not', () => {
  const out = brief();
  const asm2 = out.slice(out.indexOf('ASM-002'));
  assert.match(out, /1 UNCONFIRMED/);
  assert.ok(out.includes('⚠ ASM-002'), 'the one that was never confirmed must be flagged');
  // Slice up to the ⚠ that introduces ASM-002, not up to its id — the marker
  // is printed before the id it belongs to.
  const asm1 = out.slice(out.indexOf('ASM-001'), out.indexOf('⚠ ASM-002'));
  assert.ok(!asm1.includes('⚠'), 'an explicitly agreed assumption is not a warning');
  assert.match(asm2, /affects REQ-003/);
  assert.ok(!out.includes('il:normative'), 'the markers delimiting the region are not content');
});

test('the threat table becomes readable lines, mitigation tied to its REQ', () => {
  const out = brief();
  assert.ok(out.includes("the user's unpublished PDF"));
  assert.ok(out.includes('keep the cache outside the repo'));
  assert.match(out, /\(REQ-001\)/);
  assert.ok(!out.includes('|---|'), 'the markdown separator row is not content');
  assert.ok(!out.includes('| Asset |'), 'the header row is not content');
});

test('a prose threat model is shown as prose rather than dropped', () => {
  const prose = SPEC.replace(/\| Asset \|[\s\S]*?\| REQ-002 \|\n/, 'Asset: the session cookie. Mitigation: HttpOnly.\n');
  assert.ok(brief(prose).includes('Asset: the session cookie'));
});

test('what is NOT being built is shown — that is half of what approval means', () => {
  const out = brief();
  assert.ok(out.includes('OCR.'));
  assert.ok(out.includes('Comparing several papers'));
});

test('an unconfirmed-assumption warning is not repeated under the checker', () => {
  // The assumptions section already marks it with a ⚠. Four near-identical
  // lines underneath teach the reader that this part of the screen is skippable.
  const out = brief(SPEC, {
    findings: [
      { req: 'ASM-002', kind: 'unconfirmed-assumption', severity: 'warn', message: 'ASM-002 was never confirmed.' },
    ],
  });
  assert.ok(!out.includes('ASM-002 was never confirmed.'));
  assert.ok(!out.includes('CHECKER FLAGGED'), 'with nothing else flagged the section does not appear at all');
  assert.ok(out.includes('⚠ ASM-002'), 'but the assumption itself is still marked');
});

test('checker findings ride along: blockers on top, warnings at the bottom', () => {
  const out = brief(SPEC, {
    findings: [
      { req: null, kind: 'x', severity: 'block', message: 'no threat model.' },
      { req: 'REQ-003', kind: 'y', severity: 'warn', message: 'REQ-003 is unmeasurable.' },
    ],
  });
  const blocker = out.indexOf('no threat model.');
  const warning = out.indexOf('REQ-003 is unmeasurable.');
  assert.ok(blocker > 0 && warning > 0);
  assert.ok(blocker < out.indexOf('REQ-001'), 'a gate that will refuse is the first thing to know');
  assert.ok(warning > blocker);
  assert.match(out, /THE GATE WILL REFUSE THIS AS WRITTEN \(1\)/);
});

test('the footer counts what the human is actually accepting', () => {
  const out = brief();
  assert.match(out, /3 REQ · 2 decision\(s\) · 1 unconfirmed assumption\(s\)/);
  assert.match(out, /spec hash [0-9a-f]{8}/);
  assert.ok(out.includes('.interlocking/work/001-anchor-layer/SPEC.md'));
});

test('no line of the brief exceeds the width it was asked for', () => {
  for (const width of [48, BRIEF_WIDTH, 120]) {
    for (const line of composeDesignBrief({ feature: 'f', spec: SPEC, width }).split('\n')) {
      // Long single tokens are allowed to overflow by design; nothing else is.
      if (line.trim().split(/\s+/).length > 1) {
        assert.ok(displayWidth(line) <= width, `${displayWidth(line)} > ${width}: ${line}`);
      }
    }
  }
});

test('the brief renders a Korean spec without mangling it', () => {
  const ko = `# SPEC — 001-앵커

## Decisions

DEC-001 좌표의 유일한 출처는 PDF다.
  질문: arXiv 경로에서 좌표를 어디서 뽑나?
  답: 언제나 PDF에서. LaTeX는 구조만 준다.
  반영: REQ-001

<!-- il:normative:begin -->
## Requirements

REQ-001 입력 해석기는 arXiv ID 또는 로컬 PDF 경로를 받아 캐시된 문서 하나로 만든다.

## 위협 모델

| Asset | Threat | Mitigation | Becomes |
|---|---|---|---|
| 미공개 논문 | 캐시가 리포 안에 커밋됨 | 캐시를 리포 밖에 고정 | REQ-001 |

## 가정

ASM-001 (user: 미확인) fixture 논문 5편은 첫 태스크에서 고른다.
  영향: REQ-001
<!-- il:normative:end -->
`;
  const koCriteria = `# CRITERIA — 001-앵커

<!-- il:normative:begin -->

REQ-001
  판정: \`ps fetch 1706.03762v5\` 실행 후 meta.json의 pdf_sha256이 실제 sha256과 일치한다.
  방법: 임시 캐시 디렉터리에서 실행 후 해시 대조

<!-- il:normative:end -->
`;
  const out = composeDesignBrief({ feature: '001-앵커', spec: ko, criteria: koCriteria });
  assert.ok(out.includes('언제나 PDF에서'), 'the Korean answer is quoted');
  assert.match(out, /judged\s+`ps fetch/, '판정: is recognised as a criterion line');
  assert.match(out, /how\s+임시 캐시/, '방법: is recognised as a method line');
  assert.ok(out.includes('⚠ ASM-001'), '미확인 marks an unconfirmed assumption');
  assert.ok(out.includes('캐시를 리포 밖에 고정'), 'the Korean threat table is parsed');
  assert.match(out, /affects REQ-001/, '영향: is recognised');
});

test('CRLF and LF produce the same brief — a checkout must not change what is shown', () => {
  assert.equal(brief(SPEC.replace(/\n/g, '\r\n')), brief(SPEC));
});

test('a spec the parser cannot make sense of degrades instead of throwing', () => {
  for (const junk of ['', '# nothing here', null, undefined, '<!-- il:normative:begin -->\n\n<!-- il:normative:end -->']) {
    const out = composeDesignBrief({ feature: 'f', spec: junk });
    assert.equal(typeof out, 'string');
    assert.ok(out.includes('DESIGN BRIEF'), 'it still says what screen this is');
  }
  assert.match(composeDesignBrief({ feature: 'f', spec: '# empty' }), /No REQ-### items/);
  // Never a throw and never a lie: with no input at all it still says there is
  // nothing, rather than rendering an empty screen that reads like a clean spec.
  assert.match(composeDesignBrief(null), /No REQ-### items/);
});

test('the brief invents nothing — every REQ id in it is one the spec declared', () => {
  const out = brief();
  const shown = new Set([...out.matchAll(/REQ-\d+/g)].map((m) => m[0]));
  const declared = new Set([...SPEC.matchAll(/REQ-\d+/g)].map((m) => m[0]));
  for (const id of shown) assert.ok(declared.has(id), `${id} appears in the brief but not in the SPEC`);
});
