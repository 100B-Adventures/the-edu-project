# v2.0.23 독립 리뷰: 회원가입 공개 경로 + 코스 상담 신청

- 대상 커밋: 12b86125e (부모 origin/main 24b5d5824)
- 리뷰어: claude code-reviewer (독립 인스턴스, 변경을 만든 code-builder 와 다른 인스턴스)
- 일시: 2026-11-12 23:2x KST
- 판정: **PASS** (MAJOR 0, MINOR 4)

## 요지
- middleware.ts PUBLIC_PATHS 에 '/api/v1/auth/sign-up' 정확 일치 1줄. 하위 경로·대소문자·인코딩 변형은 인증 가드로 간다. 메서드 무관 통과지만 열리는 데이터 경로 없음.
- BFF 쿠키 전달은 본인 쿠키만, 권한 상승 경로 없음.
- 주문 API 호출 화면에서 제거, 사용자 노출 내부 문구 제거. RELEASE 공개 문장에 내부 정보 없음.
- 가입 서버 인증 누락(범위 밖): 백엔드 api.hongong.today 가 이미 외부에서 직접 닿으므로(컨트롤러 관찰: 직접 POST 500 응답) 이번 변경으로 노출면은 늘지 않는다. v2.0.24 로 바로 이어서 고친다.

## MINOR (다음 판)
1. 경계 테스트 보강(/sign-up/x → 307 등).
2. 쓰이지 않는 useCreateCourseOrderMutation 훅 정리, 테스트의 항상 통과하는 mock 검사.
3. '이메일 회원가입이 다시 됩니다' 는 배포 뒤 실제 가입 1회로 사실 확인.
4. 끝 슬래시 동작은 운영에서 curl 로 확인.
