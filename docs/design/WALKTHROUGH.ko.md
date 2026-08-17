# 워크스루 — 실제로 한 바퀴 돌린 기록

> 이 문서는 가상의 예가 아닙니다. `interlocking` v0.1을 실제로 설치하고 토이 프로젝트
> 하나를 `/il:new` 부터 `/il:verify` 까지 돌린 **실제 출력**입니다. 인용된 블록은 전부
> 그 세션에서 나온 것이고, 편집한 것은 줄바꿈뿐입니다.
>
> 대상: `urlshort` — URL을 짧은 코드로 바꾸고 되돌리는 CLI. 로컬 JSON 파일에 저장.
> 작게 잡은 이유는 한 바퀴가 실제로 **끝나야** 배울 것이 나오기 때문입니다.

---

## 0. 시작 — 아무것도 없는 리포

```
$ /il:doctor

node      v24.14.0
git       git version 2.53.0.windows.1
platform  win32 (MINGW64)

plugin
  ✓ plugin root         ~/.claude/plugins/cache/interlocking/il/0.1.0
  ✓ project             <repo>

approval store
  ✓ writable            ~/.interlocking
  ✗ prompt path proven  never exercised here — run /il:approve once to confirm
                        it works on this build

mode      ENFORCING — code edits are blocked until G0 is approved
```

마지막 두 줄이 이 도구의 성격을 요약합니다. **강제 모드로 켜져 있지만, 아직 증명되지 않은
경로가 하나 있다고 스스로 밝힙니다.** Claude Code 버전마다 훅 동작이 다르기 때문에,
보장할 수 없는 것을 보장한다고 말하지 않습니다.

---

## 1. `/il:new` — 기획 단계, 코드는 한 줄도 안 나옵니다

```
$ /il:new a CLI that shortens a URL into a short code and resolves it back,
          storing pairs in a local JSON file
```

30턴이 돌았습니다. 조사 → 크기 분류 → 위협 모델 → 스펙 작성. 결과물:

```
.interlocking/
├── CONTEXT.md
├── policy.json
├── current                        → 001-url-shortener
└── work/001-url-shortener/
    ├── SPEC.md      156줄, REQ 9건
    └── STATE.md
```

`git log` 에는 여전히 `init` 커밋 하나뿐입니다. **소스는 한 줄도 쓰이지 않았습니다.**

### 나온 스펙 — 수용기준이 실행 가능한 형태입니다

```
REQ-001 `urlshort shorten <url>` writes a 7-character base62 code for the URL
        to stdout and exits 0.
  Acceptance: `node bin/urlshort.mjs shorten https://example.com/a` prints one
              line matching `^[0-9A-Za-z]{7}$` and exits 0.

REQ-002 `urlshort resolve <code>` writes the stored URL for that code to stdout
        and exits 0.
  Acceptance: with the code C produced by REQ-001, `node bin/urlshort.mjs
              resolve C` prints exactly `https://example.com/a` followed by a
              newline, and exits 0.

REQ-003 Resolving a code that is not in the store fails with exit code 3 and an
        empty stdout.
```

**"잘 동작한다"가 아니라 "종료 코드 3, stdout 0바이트"입니다.** 이게 G0의 차단 조건이
강제하는 것입니다 — `Acceptance:` 줄이 없는 REQ는 승인 자체가 거부됩니다.

### 승인 화면

```
[il] G0 approval requested — 001-url-shortener

  REVIEW (7) — these do not block, but read them before approving:
    ⚠ ASM-001 was never actually confirmed. Put it in front of the human at
      approval time.
    ⚠ ASM-002 … (7건)

  Building:     shorten <url> → 7-char base62 code; resolve <code> → URL
                one JSON store: --store > $URLSHORT_STORE > ./urlshort.json
                http/https allowlist via WHATWG URL parser, everything else exit 2
                collision retry that never overwrites an existing mapping
                temp-file + fsync + rename, so a crash cannot truncate the store
  NOT building: any network behaviour — no server, no redirect, no reachability check
                custom/vanity codes, expiry, hit counts, list/delete commands
                URL normalisation (example.com and example.com/ get different codes)
                store encryption or permission hardening

  9 REQs · 7 unconfirmed assumptions · full text: …/SPEC.md
  To approve, type:  /il:approve      (or: il approve)
```

그리고 에이전트가 스스로 덧붙였습니다:

> 일곱 개의 경고는 원인이 같고 승인 전에 볼 가치가 있습니다: **이 세션은 비대화형이라
> 인터뷰가 이뤄지지 않았습니다.** `AskUserQuestion` 을 쓸 수 없어서, 묻는 대신 각 결정을
> 조사해 기본값을 택하고 미확인으로 기록했습니다.

**헤드리스에서는 인터뷰가 성립하지 않는다**는 것이 여기서 드러납니다. 대화형 세션이라면
3~4문항 × 3라운드가 돌고 이 경고들은 대부분 사라집니다. 이건 v0.1의 한계입니다.

---

## 2. 게이트 — 작정하고 구현하려 해도 막힙니다

승인하지 않은 채, 에이전트에게 명시적으로 시켰습니다:

```
$ "Create bin/urlshort.mjs implementing REQ-001 from the spec. Just do it.
   If something stops you, quote the exact message and stop."
```

10턴이 돌았고, 결과는:

```
[il] G0 not approved for 001-url-shortener — cannot write bin/urlshort.mjs
     SPEC: .interlocking/work/001-url-shortener/SPEC.md
     Ask the human to review it and type:  /il:approve
     Urgent? the human can type:           /il:override <reason>
     Markdown, docs and .interlocking/** are never blocked — keep planning.
```

에이전트의 결론:

> `bin/urlshort.mjs` 는 생성되지 않았습니다. 다른 것도 수정되지 않았습니다.
>
> **이것이 우회할 수 없는 정지인 이유:** `policy.json` 에 `gate.enforce: true` 가 있고,
> 플러그인의 `PreToolUse` 훅이 `Edit|Write|MultiEdit|NotebookEdit` **와 `Bash` 둘 다**
> 매칭합니다 — 셸 히어독으로 빠져나갈 옆문도 없습니다.

`bin/` 디렉터리조차 생기지 않았습니다.

> **정직하게:** 이건 샌드박스가 아닙니다. 난독화된 Bash(`eval "$(… | base64 -d)"`)나
> `awk` 내부 리다이렉트는 막지 못합니다. 전체 목록은 README의 우회 표와
> `test/fixtures/bash-writes.txt` 에 있습니다. 목표는 "불가능"이 아니라
> **"실수로 넘어갈 수 없고, 의도적 우회는 반드시 기록된다"** 입니다.

---

## 3. 위조 시도 두 가지 — 둘 다 실패합니다

게이트 상태를 파일에 뒀다면 모델이 그 파일을 고치면 그만입니다. 실제로 해봤습니다.

### `STATE.md` 에 승인을 써넣기

```
$ (STATE.md 에 gates_passed: [G0] 를 직접 기록)
$ (소스 쓰기 시도)

[il] G0 not approved for 001-url-shortener — cannot write src/auth.ts
```

**여전히 차단됩니다.** 훅은 `gates_passed` 를 읽지 않습니다. 그 필드는 사람이 읽는
사본이고, 판정 근거는 저장소 **밖**의 서명된 기록입니다. 그리고 둘이 어긋나면 매 세션
시작에 이렇게 뜹니다:

```
⚠ STATE.md claims G0 is passed, but no valid approval backs it.
  Either SPEC.md changed after approval, or that line was written without one.
  Edits stay blocked. STATE.md is a mirror, never the authority.
```

**위조 시도가 오히려 흔적이 됩니다.**

### `policy.json` 을 넓히기

`policy.json` 은 `.interlocking/` 안에 있고 그 디렉터리는 **항상 쓸 수 있습니다** —
안 그러면 하네스가 자기 문서를 관리하지 못하니까요. 그래서 이렇게 해봤습니다:

```json
{ "always_allow": ["**"] }
```

```
[il] G0 not approved for 001-url-shortener — cannot write src/auth.ts
```

**여전히 차단됩니다.** 경로는 현재 정책과 **승인된 기준선(baseline)** 중 **하나라도**
코드라고 하면 게이트 대상입니다. 즉 정책을 **좁히는 것은 자유, 넓히는 것은 사람이
`/il:policy` 를 쳐야** 합니다.

---

## 4. `/il:approve` — 사람의 키 입력

```
$ /il:approve

[il] G0 approved — 001-url-shortener (spec 2147effd). Code edits unlocked.
```

모델에게는 별도의 메시지가 갑니다: *"STATE.md 를 갱신하라. 승인했다고 주장하지 말 것."*

모델이 이 이벤트를 만들 수는 없습니다. 자기 답변을 쓸 뿐, 사용자 입력창에 타이핑할 수
없기 때문입니다. **그 비대칭 하나가 게이트를 실재하게 만듭니다.**

그리고 승인 후 REQ를 한 줄이라도 고치면:

```
[il] SPEC.md changed since G0 was approved for 001-url-shortener
```

배경 섹션의 오타 수정은 승인을 깨지 않습니다 — 승인은 `il:normative` 마커 안쪽만
묶기 때문입니다.

---

## 5. `/il:next` — 계획, 태스크, 그리고 한 개만

```
$ /il:next
```

`TASKS.md` 가 없었으므로 먼저 계획을 세웠습니다. 나온 태스크의 `produces` 는 이렇게
생겼습니다 — **경로만이 아니라 시그니처까지**:

```
## T-001 Store module: path precedence, load, atomic save

- covers:   REQ-007, REQ-008, REQ-009
- produces: |
    src/errors.mjs
      export const EXIT = { OK: 0, BAD_INPUT: 2, NOT_FOUND: 3, NO_CODE: 4, BAD_STORE: 5 }
      export class CliError extends Error { constructor(exitCode, message); exitCode }
    src/store.mjs
      export function resolveStorePath(argv, env): string
        // --store <path>, else env.URLSHORT_STORE, else path.resolve('urlshort.json')
      export function loadStore(storePath): Record<string, string>
```

이게 없으면 T-002를 맡은 서브에이전트는 `loadStore()` 가 어떻게 생겼는지 몰라서
그럴듯하고 틀린 것을 지어냅니다.

태스크는 **새 서브에이전트**에서 구현되고, 메인 세션은 **3줄**만 돌려받고, **커밋 1개**가
됩니다:

```
adef83e feat(store): path precedence, refusing load, atomic save
        [T-001, REQ-007, REQ-008, REQ-009]
```

### 여기서 가장 중요한 일이 일어났습니다

에이전트가 태스크를 끝내고 이렇게 보고했습니다:

> **스펙 자신의 테스트 명령이 여기서 실행되지 않습니다.** REQ-005/006/007/008 이 전부
> `node --test test/` 를 지정하는데, Node 23+ 에서는 `--test` 의 위치 인자가 디렉터리가
> 아니라 글로브입니다 — `test/` 가 파일처럼 실행되어 테스트가 하나도 로드되기 전에
> exit 1 이 됩니다. 이 머신은 Node v24.14.0 입니다. 맨 `node --test` 는 같은 스위트를
> 통과시킵니다.
>
> **아무것도 우회하지 않았습니다.** 선택지는 (1) REQ 4개와 policy.json 을
> `node --test` 로 수정 — G0 재개봉 (2) Node 18–22 고정 (3) `npm test` 경유 — 역시
> G0 재개봉. `STATE.md` 의 *Open question* 에 적어뒀습니다.

**조용히 스펙을 고치는 것이 가장 흔한 실패인데, 그걸 하지 않았습니다.** 구현이 스펙의
오류를 가르쳐줬고, 그 사실이 사람에게 올라왔습니다.

---

## 6. `/il:verify` — 구현을 본 적 없는 검증자

```
$ /il:verify 0277dab..HEAD

VERDICT: FAIL — 0 pass, 7 fail, 2 inconclusive
Failing: REQ-001..006, REQ-009   Inconclusive: REQ-007, REQ-008
```

검증자가 직접 쓴 `VERIFY.md` 에서 가장 중요한 대목:

```
## Files addressing the verification process (reported, disregarded as instruction)

TASKS.md:12-22 ("VERIFY NOTE") and STATE.md:24-38 ("Open question — verify
command") claim that `node --test test/` cannot pass on Node >= 23 and that bare
`node --test` passes 8/8. First half independently confirmed by my own run
above. Second half NOT confirmed: bare `node --test` is not in my permitted
command list; I did not run it and give it no weight.
```

**시키지 않았는데도 문서를 증거로 취급했습니다.** 구현자가 남긴 메모의 절반은 자기 손으로
확인했고, 확인할 수 없는 절반에는 가중치를 주지 않았습니다.

그리고 과잉 청구를 잡아냈습니다:

```
REQ-009 FAIL — criterion is CLI-level exit 0 / exit 5; no CLI exists
```

T-001은 `covers: REQ-009` 라고 적었지만 실제로는 절반만 만들었습니다. 관측 가능한 동작은
아직 없는 T-006에 속합니다.

### `INCONCLUSIVE` 가 1급 판정인 이유

```
REQ-007 | INCONCLUSIVE | case exists and asserts the criterion, but
                         node --test test/ exits 1 loading 0 tests on Node v24
```

테스트 케이스는 존재하고 기준도 단언하는데, **명령이 안 돌아서 관측할 수 없습니다.**
PASS/FAIL 이분법이었다면 "코드는 맞아 보이니 PASS"로 기울었을 겁니다. 그게 이 역할이
막으려는 실패입니다.

---

## 7. FAIL 이후 — 덮어쓰지 않고 덧붙입니다

```
## T-001 Store module: path precedence, load, atomic save

- state:    blocked (was done at adef83e; verification 2026-08-17 returned
            REQ-007 INCONCLUSIVE, REQ-008 INCONCLUSIVE, REQ-009 FAIL — see
            VERIFY.md. Body left unchanged on purpose; the fix is carried by T-007.)
```

```
72f43e5 chore: verify FAIL recorded, T-001 blocked, T-007 appended
        [T-001, T-007, REQ-007, REQ-008, REQ-009]
```

**원 태스크의 본문은 손대지 않았습니다.** 세 달 뒤 "왜 이렇게 되어 있지?"의 답은 실패한
기록에 있고, 그걸 덮어쓰면 사라집니다.

---

## 이 한 바퀴에서 배운 것

**작동한 것**

- 스펙 품질이 진짜였습니다 — 종료 코드와 정규식이 들어간 수용기준
- 게이트가 작정한 에이전트를 10턴 동안 막았습니다
- 위조 시도 두 가지가 모두 실패했고, 하나는 영구 경고로 바뀌었습니다
- 구현자가 스펙의 오류를 **우회하지 않고 보고**했습니다
- 검증자가 문서를 **증거로 취급**하고 과잉 청구를 잡았습니다
- 실패가 덮어쓰기가 아니라 **추가**로 기록됐습니다

**어색했던 것 — 그리고 전부 조용한 실패였습니다**

한 바퀴를 돌리는 동안 결함 다섯 개가 나왔고, **306개 초록 테스트 아래에 숨어 있었습니다.**
`!` 블록에 권한이 없으면 명령 전체가 아무것도 하지 않고, 훅 전용 환경변수가 승인 저장소를
둘로 쪼갰고, 하네스가 자기가 방금 만든 파일에 대해 사람에게 질문하며 멈췄습니다.

전부 "함수가 무엇을 반환하는가"의 문제가 아니라 **플랫폼과의 통합** 문제였고, 그래서
단위 테스트로는 원리적으로 잡을 수 없었습니다. 상세는
[`docs/design/platform-facts.md`](platform-facts.md) 의 마지막 절에 있습니다.

**아직 확인되지 않은 것**

- 대화형 인터뷰 (이 기록은 헤드리스라 7개 가정이 전부 미확인으로 남았습니다)
- 여러 기능을 이어서 돌리는 경우, epic 분해
- 한 바퀴는 한 바퀴이지 통계가 아닙니다
