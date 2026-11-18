# Codex 운용 — 공용 원본의 클라이언트 연결

이 문서는 Z와 A가 필요한 운용 수단을 찾는 안내다. 공통 업무 규정은 각 역할 부팅문·공통규칙과 z/상호작용규칙.md가 정한다. B에게 이 문서 전체나 설치자의 평가를 자동 배정하지 않는다.

## 진입과 위치

프로젝트 루트에서 새 세션을 연다. Codex의 AGENTS.md는 Z 호출문의 A/B 분기를 먼저 처리하고, z일 때만 CLAUDE 전체·장부·실행로그·공용 Z 부팅을 읽는다. 일반 질문은 Task로 바꾸지 않는다. CLAUDE의 저장소 값을 루트 기준으로 해석하고 장부 _meta.pipeline_repo와 대조한다. 불일치는 보고하며 자동 보정하지 않는다.

각 프로젝트의 .codex/prepare-project.ps1은 config/hooks 두 후보만 만든다. 템플릿은 빈 hooks와 enabled=false MCP이고, 복사 위치에서 이름·파이프라인 메타를 Z가 준비한 뒤 후보를 만든다. 이동 뒤에도 새 루트에서 재준비한다. 모델·계정·기존 신뢰를 재설치하지 않는다. 후보 적용과 훅 신뢰는 별도 절차다.

## 모드1·2와 독립성

모드1과 모드2는 같은 파일의 동일 호출문 전문을 사용한다. Z가 호출문 경로·SHA256·실행 인수·반환 세션 ID를 남긴다. Codex spawn_agent에는 fork_turns="none"을 명시하고 사용자 지정이 없는 모델/추론 override를 생략한다. [상호작용규칙.md](상호작용규칙.md) §1.3.1의 실제 preset 선택은 지정으로 기록하며 preselect·무응답은 지정이 아니다. A/B·B1/B2·설계/구현·★ 뒤 다음 단계는 각각 새 세션이다. 상호작용규칙 §3의 MR-1~4 상한은 그대로다.

독립 옵션은 실제 지침 주입을 관찰한 결과와 구별한다. 글로벌/상위/프로젝트 AGENTS가 추가될 수 있으며, 훅 stdout의 systemMessage와 additionalContext도 전달 경로가 다르다. 관찰 가능한 초기 문맥·읽기 경로·서로 다른 세션 ID와 호출 인수를 함께 기록한다. 도구가 전체 초기 문맥을 공개하지 않으면 그 한계를 적는다. 부모 전용 무해 표식의 비노출 답변 하나만으로 비상속을 단정하지 않는다.

★에서는 역할 호출을 종료하고 사용자 확인을 받는다. 승인 뒤 새로운 호출문·새 세션으로 다음 단계에 간다. API 한도 등 외부 중단은 상호작용규칙 §1.2에 따라 Z가 쓰기 상태를 먼저 확인한다. 같은 지시와 쓰기 현황만으로 같은 단계 재개가 가능하면 재개하고, 불가능하면 같은 전문의 새 세션을 연다. 새 정보를 B에 보태지 않는다.

## 모드2 구성 선택

두 Z 계열의 선택 의미·preset·설치 확인·지원 불일치·기록은 [상호작용규칙.md](상호작용규칙.md) §1.3.1을 따른다. 이 안내에 preset을 중복 정의하지 않는다. 선택형 UI의 선언·실제 화면·응답 수신과 CLI 목록은 각각 관찰한다. 최신 모델이나 effort를 확인하지 못하면 null과 이유로 반환하며 자동 하향하지 않는다. CLI/companion 도움말의 인수 지원과 실제 Agent 도구 스키마를 혼동하지 않는다. B 초기 자동 문맥 공개와 제목 중립화는 같은 규칙 §1.3.2·§3.5를 따른다.

## PowerShell 전용 시작 — D-84

현재 주 사용 경로는 프로젝트 PowerShell에서 `.codex/start-codex.ps1`을 명시 실행하여 사전 배너를 출력한 뒤 같은 루트의 새 Codex CLI를 여는 방식이다. `powershell.exe -NoLogo -NoProfile -File '.codex/start-codex.ps1'`을 사용하고 수동 상태 조회에는 `-BannerOnly`를 붙인다. 기존 codex 직접 실행·앱·IDE·웹·전역 alias/profile/PATH는 변경하지 않는다. 자동 인수는 표시용 `--no-alt-screen`뿐이다. 기존 시제품과 같은 코드 라벨은 버전 이력 식별이며 운영 적용 여부를 뜻하지 않는다.

사전 배너는 PowerShell stdout이며 기존 SessionStart Hook과 별개의 사건이다. Hook은 보존하고 첫 입력 뒤 중복을 허용한다. TTY에서 한 화면 높이만큼 줄바꿈해 앞선 배너를 위쪽 기록으로 이동시킨다. 초기 팝업/재그리기 후 실제 사용자 호스트에서 위로 스크롤해 재확인해야 한다. 현재 화면 고정이나 모든 호스트의 스크롤 동작을 보증하지 않는다. 현재 사용자 호스트의 직접 재확인은 미완이다.

설치된 시작 파일의 `.codex` 부모가 프로젝트 루트다. 루트·CLAUDE 지정 파이프라인·manifest 메타의 일치·존재·기입과 링크 여부를 확인하고, 배너 SHA256 `B050F561531468CA059ED438F60536A4D76C0394396B07E62BAC38741050E688`을 확인한 뒤 로컬 배너를 실행한다. 이는 Codex 자체 신뢰 확인 전 사용자가 실행하는 코드이므로 entry/helper/banner를 먼저 검토한다. 고정값 변경은 새 본문 검토→후보/해시→파일별 승인→Z 적용으로 다루며 Hook 신뢰를 자동 갱신하지 않는다. 배너 stdout은 비어 있지 않은 systemMessage 하나인 JSON이어야 하며 stdin은 닫고 10초 제한을 둔다. 배너를 모델 입력이나 환경변수 문맥으로 전달하지 않는다.

지원 인수·오류코드·설치 전제는 각 루트 Codex_부팅안내.md를 따른다. 전용 명령의 복사/이동 성공과 기존 Hook/MCP 절대경로 준비는 별개다. 기존 prepare-project→후보 검토→파일별 적용→새 Hook 검토→새 세션 순서를 유지한다. 템플릿은 미기입·비활성 상태로 보존하며 실제 복사본은 운영 대상으로 추가하지 않는다.

R4 운영 후보는 T7의 `output/T7_Codex운용동등화/revisions/R4/implementation/`에 있고 변경목록·별도 운영설계 보완·설치운용복구 안내로 연결한다. R2 도구를 덮어쓰지 않는다. R4 도구는 승인된 새12파일과 안내/진입 문서 및 새 설계보완의 정확한 파일별 목록만 다루며 Z가 승인·Apply/Rollback 기록을 `log/T7_Codex운용동등화/적용/R4/`에 남긴다. 원설계·기준·판정·장부·전역 설정은 적용 대상이 아니다. A/B의 증거 구획과 Z 기록을 분리한다. 새 역할은 해당 승인 뒤 별도 호출한다.

## 배너와 권한

Codex 훅은 startup/resume/clear에 매칭하고 프로젝트 절대 스크립트 경로를 실행한다. session-start.ps1은 자신의 부모 루트 장부를 읽어 systemMessage JSON만 출력한다. Task·로그를 쓰거나 추가 모델 문맥을 만들지 않는다. 기존 Hook 자동 실행은 실제 사용하는 CLI의 발생 시점과 출력으로 관찰한다. 앱·IDE·웹을 따로 주장할 때는 각 환경의 증거를 남긴다. 수동 JSON 출력은 별도 진단이다. 새/변경 훅은 공식 UI에서 검토해야 하며 신뢰 해시 자동 삽입이나 우회 옵션을 기본 운용으로 쓰지 않는다.

현재 사용자 기본은 on-request·auto_review·workspace-write다. 설정 우선순위는 CLI override → 신뢰된 프로젝트 계층 → profile → 사용자 등이며 관리 requirements는 별도 제약이다. 실제 앱 권한 선택과 현재 sandbox·보호 디렉터리 제한을 함께 확인한다. 명령 rules는 파일 쓰기 권한이나 ★를 대신하지 않는다. Claude의 PowerShell 문자열 허용을 전체 셸 allow로 옮기지 않는다. 단순 읽기는 rules, 작업 공간 쓰기는 sandbox, 경계 밖은 자동 검토로 대응한다. 거부 원문·미적용 파일을 남긴다.

## Claude MCP

각 프로젝트 config의 command는 설치된 Claude 실행 파일, args는 mcp serve, cwd는 실제 프로젝트 절대경로다. Agent/TaskStop만 노출하고 시작 30초·도구 1,800초와 default_tools_approval_mode=auto를 쓴다. cwd는 OS 보안 경계가 아니다. 기존 계정·모델을 쓰며 새 키나 프로그램을 설치하지 않는다.

사용자가 Claude 위임을 요청하거나 모드2에서 Claude를 선택하면 새 Agent에 독립 호출문을 전달한다. 일반 역할은 general-purpose·description·prompt를 사용하고, 상호작용규칙 §1.3.1의 실제 선택이 있으면 현재 Agent 스키마와 model/effort를 대조해 전달하며 name/isolation은 생략한다. isError·내부 status/content·toolStats가 있으면 그 값·실제 반환 ID를 확인한다. TaskStop은 자기 호출이 실제 실행 중일 때 반환된 ID만 대상으로 한다. completed 뒤 반환된 agentId, 호출자가 정한 name, JSON-RPC 요청 번호나 Codex 셀 ID로 진행 중 중단을 추정하지 않는다. 연결 목록 조회와 모델 호출·중단·서버 정리는 서로 다른 관찰이다.

프로젝트의 check-claude-mcp.mjs는 Node 표준 라이브러리로 직접 stdio 진단한다. 기본은 연결/목록이며 --call-agent와 --stop-probe는 명시 선택이다. 실제 Codex 앱/CLI의 연결된 Agent도 별도로 관찰한다. Node 결과로 앱 연결 확인을 대신하지 않는다. 중단 진단은 일반 A/B 역할이 아니며 최대 20초 대기만 요청한다. 현재 Agent 스키마에는 일반 로컬 background 인수가 없으므로 임의 인수를 추가하거나 remote isolation으로 바꾸지 않는다. R2 helper는 Agent 응답에 실행 중 status=running과 실제 agentId가 함께 있을 때만 TaskStop(task_id=agentId)을 요청한다. completed 뒤 ID만 공개되면 TaskStop을 보내지 않고 exit 3과 stop-unobserved를 남긴다. TaskStop 요청/응답·Agent 최종 상태·서버 정리를 각각 기록한다. 허용 Agent/TaskStop만으로 최종 상태를 다시 조회할 수 없으면 중단은 미확인이다. 원문 오류·응답이 없는 값을 성공으로 채우지 않는다.

## 갈래와 스킬

갈래는 Z 호출문에서 지정한 것만 사용한다. A는 a/부팅.md·a/공통규칙.md §7.2를 따른다. .md는 지시문, 바로 아래 사용법.md를 둔 폴더는 실행 스킬, 그렇지 않은 폴더는 두 겹까지 묶음이다. 실행 허가는 해당 규정의 유보와 작업의 실행 사양을 따른다. 공용 skills를 .agents/skills나 .codex/skills로 설치·복사하지 않는다. B는 자신의 규정으로 허용된 원문에 접근하며 A는 b/ 본문을 읽거나 쓰지 않는다.

## 관찰·복구 인계

명령·인수·cwd·버전·시각·세션 ID·입력/설정 해시·stdout/stderr·종료 코드·전후 파일 상태를 담당 증거 구획에 남긴다. 제품이 제공하지 않는 UI 로그 경로를 추측하지 않는다. 자동 배너·직접 A/B·모드2 독립성·프로젝트별 MCP cwd는 적용 뒤 새 세션으로 확인한다. Z가 승인·적용·마감 기록을, A/B가 자기 산출/보고를 쓴다.

파일별 승인 후 Z가 원본 기준선 재대조·바이트 백업·개별 복사·후보 해시 대조를 한다. 동시 변경을 덮어쓰지 않는다. 복구는 적용 후와 현재 해시가 같은 선택 파일만 역순 복원한다. 신규 파일만 개별 제거하며 장부 전체 복원·폴더 재귀 삭제·사용자 config 일괄 되돌리기는 하지 않는다. 먼저 격리 사본에서 복구 수단을 실제 실행한다. T7 R2의 fixture 후보·목적지는 승인 파일에 명시된 A1/R2 또는 B2/R2 소유 구획과 그 안의 지정 복사/이동 위치로 제한한다. 승인·적용·복구 기록은 Z의 T7 적용/R2 구획에 둔다. B가 자기 위치의 후보와 파일을 관찰할 수 있도록 하며 A/B 증거 구획을 합치지 않는다.

공식 자료(설정 등 R1 확인 2026-10-21, MCP 재조회 2026-10-22): [설정 계층](https://learn.chatgpt.com/docs/config-file/config-basic), [프로젝트 설정](https://learn.chatgpt.com/docs/config-file/config-advanced), [AGENTS](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [훅](https://learn.chatgpt.com/docs/hooks), [rules](https://learn.chatgpt.com/docs/agent-configuration/rules), [auto-review](https://learn.chatgpt.com/docs/sandboxing/auto-review), [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [MCP](https://learn.chatgpt.com/docs/extend/mcp). 실제 callable 도구 정의와 설치 버전이 다르면 차이를 기록하고 현재 확인된 수단을 사용한다.
