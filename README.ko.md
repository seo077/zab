<!-- English: README.md -->

# interlocking

**기획 게이트를 실제로 작동하게 만드는 Claude Code 플러그인.**

*interlocking*(연동장치)은 상충하는 진로를 물리적으로 설정할 수 없게 만드는 철도 장치입니다.
이 플러그인은 AI 코딩 세션에 같은 발상을 적용합니다 — **사람이 스펙을 승인하기 전까지 에이전트는
소스를 편집할 수 없고, 어떻게 요청받든 스스로 승인할 수도 없습니다.**

```
/plugin marketplace add <you>/interlocking
/plugin install il@interlocking
```

---

## 왜 또 만드나

[spec-kit][spec-kit]과 [BMAD][bmad]는 이미 좋은 spec-driven 워크플로를 서술하고 있고, 둘 다 쓸
만합니다. 다만 그것들은 **문서와 명령**입니다 — 에이전트에게 따르라고 *요청*하는 것이고, 도움이
되고 싶은 에이전트는 "이번 건은 건너뛰어도 되겠다"고 판단합니다. spec-kit은 의도적으로 에이전트
중립이라 훅을 아예 쓸 수 없습니다.

interlocking은 또 하나의 방법론이 아니라 **강제 계층**입니다:

| | |
|---|---|
| **게이트가 실제로 막는다** | 사람이 `SPEC.md`를 승인할 때까지 소스 편집이 거부됩니다 — 정중히 부탁하는 문단이 아니라 `PreToolUse` 훅으로. 마크다운·문서·`.interlocking/**`은 항상 쓸 수 있어 기획은 절대 막히지 않습니다. |
| **에이전트가 자기 게이트를 못 연다** | 승인은 사람이 친 키 입력을 훅이 읽어 **저장소 밖** 서명된 기록에 남깁니다. `STATE.md`의 `gates_passed`를 고쳐도 아무것도 열리지 않고, 매 세션 시작에 변조 경고가 뜹니다. |
| **세션이 재개된다** | 아무 시점에 죽여도 됩니다. 다음 세션이 재개 앵커·다음 액션과 함께, 미커밋 작업에 대한 질문을 들고 시작합니다 — 대신 답해주지 않고요. |
| **검증이 독립적이다** | 구현 대화를 본 적 없는 검증자 서브에이전트가 각 요구사항을 자기 수용기준으로 판정합니다. 읽고 실행할 수 있지만 소스는 못 씁니다 — 자기 설정이 아니라 훅이 막습니다. |

[spec-kit]: https://github.com/github/spec-kit
[bmad]: https://github.com/bmad-code-org/BMAD-METHOD

---

## 한 기능의 흐름

```
/il:new 사용자 로그인

  [il] 크기: feature (REQ 4건, 태스크 8개 예상)
       조사… 인터뷰(3문항)… 위협 모델…
       .interlocking/work/001-login/SPEC.md 작성

  [il] G0 승인 요청 — 001-login

    ⚠ REQ-004가 측정 불가능한 표현을 씁니다(fast). 어떤 숫자가 이를 증명합니까?
    ⚠ ASM-003은 실제로 확인된 적이 없습니다.

    만들 것:   이메일+비밀번호 로그인 · 서버 세션 · 30분 만료
    안 만들 것: 소셜 로그인 · 비밀번호 재설정
    REQ 4건 · 미확인 가정 1건 · 전문: .interlocking/work/001-login/SPEC.md
    승인하려면:  /il:approve

> 에이전트가 앞서 나가려 합니다
  ⏺ Write(src/auth/session.ts)
  ⎿  ✗ [il] G0 not approved for 001-login — cannot write src/auth/session.ts
        Ask the human to review it and type:  /il:approve
        Urgent? the human can type:           /il:override <reason>

> /il:approve
  [il] G0 approved — 001-login (spec 4f2a9c1e). Code edits unlocked.

/il:next     태스크 1개 = 서브에이전트 1개 = 커밋 1개
/il:verify   독립 검증자가 REQ별로 판정하고 VERIFY.md를 직접 씁니다
```

그리고 노트북이 꺼집니다. 다음 세션은 이렇게 열립니다:

```
[il] 001-login · EXECUTE · G0 approved (spec 4f2a9c1e ✓ unchanged)
NEXT: T-012 — src/auth/session.ts 세션 쿠키 (SPEC.md#REQ-007)

[il] ACTION REQUIRED — 무엇보다 먼저 사람과 해결할 것:
  미커밋 변경 3건: src/auth/session.ts, tests/test_session.ts…
  사람에게 묻고 대신 결정하지 말 것: (a) 이어서 완성 (b) 버리고 재시작 (c) diff 먼저
```

---

## 명령

| | |
|---|---|
| `/il:new <목표>` | 크기 분류 · 조사 · 인터뷰 · 위협 모델 · 스펙 · 승인 요청 |
| `/il:onboard` | 기존 리포에 얹기. 이미 있는 코드는 소급 적용하지 않습니다. |
| `/il:status` · `/il:resume` | 현재 상태 · 중단된 기능 이어받기 |
| `/il:next` | 다음 태스크를 새 서브에이전트에서 실행하고 커밋 |
| `/il:verify` | 독립 인수 검증 |
| `/il:doctor` | 이 설치에서 실제로 강제 가능한 것 |
| **`/il:approve`** | **사람만.** 게이트를 엽니다. |
| **`/il:override <사유>`** | **사람만.** 시간 제한·기록되는 우회 — 오타 크기 작업의 패스트 레인이기도 합니다. |
| **`/il:policy`** | **사람만.** 넓어진 `policy.json`을 승인합니다. |

마지막 셋은 모델이 호출할 수 없습니다. 사람이 친 것을 읽는 훅이 처리합니다. 두 형태 모두
동작합니다 — `/il:approve` 와 그냥 `il approve` — 그리고 두 번째는 의도된 보험입니다:
**등록되지 않은** 슬래시 명령은 훅을 통째로 건너뛰므로, 평범한 문장이 단락될 수 없는 형태입니다.

---

## 못 하는 것

대부분의 도구가 생략하는 부분입니다.

> **interlocking은 기획에서 구현으로 실수로 미끄러지는 것을 어렵게 만들고, 의도적인 우회를 전부
> 시끄럽고 기록되게 만듭니다. 샌드박스가 아닙니다.** 게이트를 우회하기로 결심한 모델은 우회할 수
> 있습니다. 설계 목표는 **당신이 그 사실을 알게 되는 것**입니다.

막지 못하는 것: `eval "$(… | base64 -d)"`, `awk`의 내부 리다이렉트, 런타임에 조립된 경로, 일부
MCP 파일시스템 서버, 그리고 당신 자신의 에디터.

전체 표와 110줄짜리 우회 코퍼스는 영어 README와
[`test/fixtures/bash-writes.txt`](test/fixtures/bash-writes.txt)에 있습니다.

> **우리가 놓친 우회를 찾으셨나요? 그 파일에 한 줄 추가하고 PR을 주세요.** 이 프로젝트에서 가장
> 값어치 있는 기여입니다 — 코퍼스 항목 없는 수정은 조용히 회귀합니다.

### "독립"은 어디까지인가

| | v0.1 |
|---|---|
| 컨텍스트 — 구현 대화를 보지 않음 | ✅ |
| 권한 — 소스를 못 씀, 훅이 강제 | ✅ |
| 입력 — 고정 템플릿, 호출자가 서술할 칸 없음 | ✅ |
| 판단 — SPEC이 요구사항의 유일한 출처 | ✅ |
| **모델 — 구현자와 동일** | ❌ |

**같은 모델은 같은 실수를 합니다.** Claude가 어떤 API를 잘못 기억하면 구현자와 검증자가 똑같이
잘못 기억합니다. [NASA IV&V][ivv] 기준으로는 부분적인 *기술적* 독립성일 뿐입니다.

[ivv]: https://swehb.nasa.gov/display/SWEHBVC/SWE-141+-+Software+Independent+Verification+and+Validation

### Validation과 verification

| | 질문 | 판정 주체 | 여기서는 |
|---|---|---|---|
| **Validation** | 옳은 것을 만들고 있나? | 언제나 사람 | **G0 승인** |
| **Verification** | 스펙대로 만들었나? | 자동화 가능 | **`/il:verify`** |

G0 승인이 곧 validation 단계입니다 — 인터뷰, 가정 원장, 만들 것/안 만들 것 요약. 사후
validation(써보니 맞나)은 v0.1에 없습니다. 그것이 G3입니다.

### 비용

게이트 대상 툴 호출당 **Windows 약 110ms, 그중 80ms가 맨 Node 기동**. Linux·macOS는 절반 정도입니다.
`Read`·`Grep`·`Glob`은 일부러 훅을 걸지 않습니다. `IL_DISABLE=1`로 전부 끌 수 있습니다.

`.interlocking/`이 없는 리포에서는 `existsSync` 한 번이면 끝입니다.

---

## 면책

> interlocking은 *절차*를 강제합니다. 당신의 코드가 정확한지, 안전한지, 목적에 맞는지는 검증하지
> 않습니다. 게이트는 우회할 수 있고, G0 편집 차단은 **보안 경계가 아니라** 실수로 미끄러지는 것에
> 대한 가드레일입니다. 보안 경계로 신뢰하지 마십시오.

텔레메트리 없음. 아무것도 기기 밖으로 나가지 않습니다. 하네스가 당신 프로젝트의 문서를 읽으므로,
그게 사실이어야 설치할 가치가 있습니다.

---

자세한 내용은 [영어 README](README.md), [보안 모델](SECURITY.md),
[기여 안내](CONTRIBUTING.md), [실측된 플랫폼 동작](docs/design/platform-facts.md),
[설계 노트](docs/design/concept.ko.md).

MIT. Node 18+ 및 Claude Code 필요.
