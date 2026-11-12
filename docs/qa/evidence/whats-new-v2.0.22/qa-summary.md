# v2.0.22 업데이트 소식 헤드리스 QA

<!-- STAMP
created_at: 2026-11-12 17:51 KST
model: gpt-5.6-sol
agent: code-builder
skills: verify, qa
sources: release-notes-and-whats-new.md, RELEASE.md, headless-qa.json
decision: 서로 독립된 브라우저 컨텍스트에 이전 버전을 심어 시나리오 간 localStorage 오염을 차단했다.
-->

- 대상 커밋: `d54eed831`
- 실행 경로: `http://localhost:43222/updates`
- 서버: Next.js 개발 서버, 헤드리스 Chromium
- `/updates`: HTTP 200, 공개 노트 3개
- 카드: `last_seen_version=v2.0.20`에서 1개 노출, 새로고침 뒤 0개
- GA4: `whats_new_view`, `whats_new_try`, `whats_new_feedback(value=like)`, `whats_new_dismiss`의 이름과 `version=v2.0.22` 파라미터 확인
- 가로 넘침: 390px, 834px, 1280px 모두 0
- 콘솔 오류: 0
- 캡처: `updates-390.png`, `updates-1280.png`

## 첫 QA 실패 원인

제품 코드 결함이 아니었다. 첫 QA 스크립트가 1회 노출 검증 뒤 같은 Playwright 페이지와 컨텍스트를 여러 이벤트 시나리오에서 다시 사용했고, 그 과정에서 `last_seen_version`과 문서 수명주기가 섞였다. 정본은 첫 방문자도 알림 대상으로 규정하며, 별도 진단에서 저장값 없음과 `v2.0.20` 두 경우 모두 카드 1개와 `whats_new_view` 호출을 확인했다. 최종 QA는 각 이벤트마다 독립 컨텍스트를 사용했다.

원시 호출과 수치는 `headless-qa.json`에 보존했다.
