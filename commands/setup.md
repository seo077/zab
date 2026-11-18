---
description: 이 폴더를 zab 프로젝트로 준비한다 — input · output · log · pipeline 폴더와 빈 장부를 만든다. 이미 있는 파일은 건드리지 않는다.
allowed-tools: Bash(node:*)
---

## 실행 결과

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/zab.mjs" setup`

---

위는 설치 스크립트가 방금 이 폴더에 한 일이다. 사용자에게 짧게 전한다.

- 만든 것과 그대로 둔 것을 위 출력대로 알린다. 출력에 없는 파일을 만들었다고 말하지 않는다.
- `CLAUDE.md` 가 "그대로 둔 것"에 있으면, 기존 파일을 보존했다는 것과 zab 안내를 넣고 싶을 때 참고할 양식이 템플릿에 있다는 것만 알린다. 직접 고치지 않는다.
- 재료는 `input/` 에 넣고, 다음은 `/zab:design` 이라고 안내한다.

여기서 끝낸다. Task를 개설하거나 역할을 호출하지 않는다.
