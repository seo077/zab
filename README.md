# ung

**Claude Code용 Z·A·B 협업 파이프라인.** 사람이 결정하고, 오케스트레이터(Z)가 배치·중계·기록하고, 구현자(A)가 만들고, 만든 과정을 보지 못한 검증자(B)가 판정한다.

*A human-in-the-loop pipeline for Claude Code: an orchestrator that never builds or judges, a builder, and a verifier that never saw the build. The method is written in Korean; an English summary is [below](#in-english).*

```
/ung:setup    프로젝트 폴더 준비 — input · output · log · pipeline
/ung:design   Z와 사양을 정하고, B가 검증 기준을 쓰고, 사람이 승인한다
/ung:build    A가 만들고, 새 세션의 B가 판정하고, 사람이 최종 수락한다
```

## 설치

Claude Code에서:

```
/plugin install ung --marketplace seo077/ung
```

Node 18 이상이 필요하다. 그 밖의 의존성은 없다.

## 어떻게 도나

```
/ung:design                                    /ung:build
┌──────────────────────────────────────┐      ┌───────────────────────────────────────────┐
 협의 → ★사양 확정 → B 기준 작성 → ★기준 승인  →  A 구현 → ★구현 확인 → B 판정 → ★최종 수락
                    (→ A 설계 → ★설계 승인)              (조건부·미달이면 A 재작업 → B 재검증)
```

★는 사람이 확인하는 자리다. 거기서 Z는 멈추고, 열어 볼 **파일 경로**를 알려 준다. 내용을 요약해 대신 말하지 않는다.

지키는 선은 넷이다.

1. **기준이 먼저다.** 무엇을 보면 됐다고 할지를 만들기 전에 B가 쓰고, 사람이 승인한다.
2. **판정은 검증자만 한다.** B는 A와 다른 새 세션이고, 재검증은 직전 검증과도 다른 새 세션이다. Z는 B의 판정을 옮길 뿐 요약하지 않는다.
3. **A에게는 넉넉히, B에게는 아껴서.** A는 배경과 결정 원문을 다 받는다. B가 받는 것은 대상 경로와 승인 여부 정도다. 미리 들은 것으로 판단하면 독립 검증이 아니기 때문이다.
4. **한 파일에는 주인이 하나다.** 장부와 공용 로그는 Z만, 산출물은 A만, 기준과 판정은 B만 쓴다.

## 작업 종류 — 파이프라인과 갈래

`/ung:design` 을 실행하면 Z가 쓸 수 있는 파이프라인 목록을 보여 준다.

| 파이프라인 | 무엇 |
|---|---|
| 범용 | 맞는 정의가 없는 일회성·탐색 작업의 기본 골격. 코드 작업도 여기서 시작한다 |
| 회로분석 | 회로도를 모듈별로 읽어 분석하고 오류·위험·개선점을 진단한다 |
| 엑셀작업 | 엑셀 작업을 레이아웃 → 출력 두 단계로, 원본을 고치지 않고 해낸다 |
| 파이프라인신설 | 새 종류의 작업을 위한 파이프라인 한 벌을 만든다 |

작업 종류마다 달라지는 지식은 **갈래**로 붙는다. A는 `a/갈래별/<갈래>/` 의 규칙·참고자료·skills를, B는 `b/갈래별/<갈래>/` 의 검증 기준을 읽는다. 되풀이할 새 작업이 생기면 **파이프라인신설**을 한 판 돌려 정의와 갈래 한 벌을 만든다.

## 무엇이 어디에 있나

역할 문서·정의·갈래는 **플러그인 안에 한 벌만** 있다. 프로젝트에 복사하지 않는다.

```
플러그인                          프로젝트 (/ung:setup 이 만든다)
├─ pipeline/                      ├─ CLAUDE.md · 프로젝트지도.md
│  ├─ z/  부팅 · 상호작용규칙       ├─ input/     재료
│  │      · pipelines/<작업>.md    ├─ output/    결과
│  ├─ a/  부팅 · 공통규칙 · 갈래별/  ├─ pipeline/  이 프로젝트에서 만든 정의·갈래
│  └─ b/  부팅 · 공통규칙           └─ log/
│         · 검증기준_공통 · 갈래별/      ├─ manifest.json     Task 장부 (Z만)
├─ templates/project/                 ├─ 실행로그.md · AI 논의사항.md
├─ commands/  setup · design · build   └─ T{N}_<작업명>/    Task 방
├─ agents/    a · b                          검증기준 · (설계명세) · 구현요약/ · 검증요약/
└─ scripts/ung.mjs
```

- 한 번 쓰는 **사실**은 프로젝트에, 되풀이하는 **방법**은 파이프라인에 둔다.
- 플러그인의 `pipeline/` 은 읽기 전용이다. 프로젝트에서 새로 만든 정의·갈래는 프로젝트의 `pipeline/` 에 생기고, 되풀이가 확인되면 이 저장소에 Pull Request로 올린다. 방향은 프로젝트 → 파이프라인 한쪽뿐이다.
- 파이프라인 한 판이 **Task 하나**(`T1`·`T2`…)다. 재작업은 새 Task가 아니라 Task 안의 반복 `R2`·`R3`이다.

자세한 것은 [pipeline/README.md](pipeline/README.md)와 [pipeline/z/플러그인운용.md](pipeline/z/플러그인운용.md).

## 이것이 하지 않는 일

- **아무것도 막지 않는다.** 훅은 둘뿐이다 — 세션을 열 때 Task 상황판을 보여 주는 것, 그리고 플러그인 자신의 문서(`pipeline/` · `templates/`)를 권한 확인 없이 읽게 하는 것. 어느 쪽도 거절하지 않는다. 규칙은 문서이고, 지키는 것은 역할을 맡은 모델과 ★에서 직접 열어 보는 사람이다.
- **빠르지 않다.** 기준을 먼저 쓰고, 사람이 여러 번 확인하고, 검증을 새 세션으로 돌린다. 틀려도 되돌리기 쉬운 일에는 과하다 — 그런 판에서는 Z가 검증 생략을 제안할 수 있고, 정하는 것은 사용자다.
- **Codex는 아직이다.** 지금은 Claude Code만 지원한다.

## 개발

```
npm test                              # scripts/ung.mjs
claude plugin validate .
claude --plugin-dir .                 # 이 저장소를 플러그인으로 얹어 실행
```

이 저장소의 예전 설계(훅으로 승인 전 편집을 차단하던 `interlocking`)는 태그 `interlocking-v0.1-final` 에 남아 있다.

## In English

ung packages a working method, not an enforcement layer. One session becomes **Z**, the orchestrator, which assigns work, relays results verbatim and keeps the ledger — and is forbidden to build or to judge. **A** builds. **B** writes the acceptance criteria *before* anything is built, and later a fresh B session, given little more than file paths, judges the result against the criteria the human approved. Every ★ in a pipeline definition is a point where the agents stop and a person opens the file themselves.

`/ung:setup` scaffolds a project folder, `/ung:design` runs up to the last approval before building, and `/ung:build` runs from there to final acceptance. Role documents live once, inside the plugin; a project holds only its materials, results and logs. Nothing is blocked by hooks — the rules are documents.

## License

MIT
