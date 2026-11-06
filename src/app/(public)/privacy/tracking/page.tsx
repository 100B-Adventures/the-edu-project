import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '자동 수집 도구 안내 | 오독공',
  description:
    '오독공이 쓰는 분석·광고 측정 도구의 수집 항목, 목적, 국외 이전과 거부 방법을 안내합니다.',
};

const TOOLS = [
  {
    name: 'Google Analytics(GA4)',
    company: 'Google LLC (미국)',
    items:
      '방문 페이지 주소, 화면 이용 기록, 가입·문의 완료 이벤트, 쿠키 식별자, 기기·브라우저 정보, IP',
    purpose: '서비스 이용 통계와 유입 경로 분석',
    optOut: 'Google 애널리틱스 차단 부가기능 또는 브라우저 쿠키 차단',
    href: 'https://tools.google.com/dlpage/gaoptout',
  },
  {
    name: 'Microsoft Clarity(세션 리플레이·히트맵)',
    company: 'Microsoft Corporation (미국)',
    items:
      '방문 페이지 주소, 클릭·스크롤·화면 이동 기록, 쿠키 식별자, 기기·브라우저 정보, IP',
    purpose: '화면 사용성 개선과 오류 원인 분석',
    optOut: '브라우저 쿠키 차단 또는 추적 방지 기능',
    href: 'https://privacy.microsoft.com/ko-kr/privacystatement',
  },
  {
    name: 'Meta 픽셀',
    company: 'Meta Platforms, Inc. (미국)',
    items:
      '방문 페이지 주소, 선생님·학부모 가입과 문의 완료 이벤트, 쿠키 식별자, 기기·브라우저 정보, IP',
    purpose: '광고 성과 측정과 맞춤형 광고',
    optOut: 'Meta 광고 설정 또는 브라우저 쿠키 차단',
    href: 'https://www.facebook.com/adpreferences',
  },
  {
    name: '당근 픽셀(전환 추적 코드)',
    company: '당근마켓 주식회사',
    items:
      '방문 페이지 주소, 선생님·학부모 가입과 문의 완료 이벤트, 쿠키 식별자, 기기·브라우저 정보',
    purpose: '광고 성과 측정',
    optOut: '브라우저 쿠키 차단',
    href: null,
  },
];

export default function PrivacyTrackingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-title-heading mb-3">자동 수집 도구 안내</h1>
      <p className="font-body2-normal text-text-sub2 mb-8 leading-relaxed">
        회사는 서비스 개선과 광고 성과 측정을 위해 아래 도구를 사용합니다. 이
        안내는 개인정보 처리방침의 서비스 이용 분석 및 쿠키 항목을 보충합니다.
        회사는 이메일, 전화번호, 이름을 이 도구들의 이벤트 값으로 보내지
        않습니다.
      </p>

      <div className="space-y-6">
        {TOOLS.map((tool) => (
          <section
            key={tool.name}
            className="border-line-line1 rounded-xl border p-5"
          >
            <h2 className="font-body1-heading mb-3">{tool.name}</h2>
            <dl className="font-body2-normal space-y-2 leading-relaxed">
              <div>
                <dt className="font-semibold">제공 받는 자</dt>
                <dd>{tool.company}</dd>
              </div>
              <div>
                <dt className="font-semibold">수집 항목</dt>
                <dd>{tool.items}</dd>
              </div>
              <div>
                <dt className="font-semibold">목적</dt>
                <dd>{tool.purpose}</dd>
              </div>
              <div>
                <dt className="font-semibold">거부 방법</dt>
                <dd>
                  {tool.href ? (
                    <a
                      href={tool.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {tool.optOut}
                    </a>
                  ) : (
                    tool.optOut
                  )}
                </dd>
              </div>
            </dl>
          </section>
        ))}
      </div>

      <section className="border-line-line1 mt-6 rounded-xl border p-5">
        <h2 className="font-body1-heading mb-3">
          Meta 픽셀과 당근 픽셀을 쓰지 않는 경우
        </h2>
        <ul className="font-body2-normal list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            학생 계정으로 로그인한 경우 모든 화면. 학생 계정의 정확한 나이를
            받지 않으므로 학생 계정 전체에 적용합니다. 그 브라우저에서
            로그아웃한 뒤에도, 선생님이나 학부모 계정으로 로그인하기 전까지
            같습니다.
          </li>
          <li>회원 정보의 생년월일로 만 14세 미만임이 확인되는 경우</li>
          <li>학습, 문제 풀이, 학생 공개 프로필 화면</li>
          <li>로그인 화면과 초대 링크 화면, 주소에 초대 값이 들어 있는 화면</li>
          <li>학생 회원의 가입 완료, 초대 링크를 통한 가입 완료 이벤트</li>
        </ul>
        <p className="font-body2-normal text-text-sub2 mt-3 leading-relaxed">
          Google Analytics와 Microsoft Clarity는 서비스 개선 목적으로 위 화면 중
          초대 링크 화면과 주소에 초대 값이 들어 있는 화면을 뺀 나머지에서
          동작합니다. 초대 링크 화면과 그 화면에서 바로 넘어온 화면에서는 이 두
          도구도 쓰지 않습니다. 초대 코드와 초대 링크를 보여 주는 부분은 Clarity
          기록에서 가립니다. 공개 화면을 로그인 없이 볼 때는 회사가 이용자의
          나이를 알 수 없어 위 두 픽셀이 동작할 수 있습니다.
        </p>
      </section>

      <p className="font-body2-normal text-text-sub2 mt-8 leading-relaxed">
        국외 이전: 해외 법인이 제공하는 도구는 페이지를 이용하는 시점에 암호화
        통신으로 해당 업체 서버에 전송되어 국외에서 처리될 수 있습니다. 보유
        기간은 각 업체의 정책과 계정 설정을 따릅니다. 거부해도 서비스 이용에는
        제한이 없습니다. 문의: support@hongong.today
      </p>
      <p className="font-body2-normal text-text-sub2 mt-4">
        시행일자: 2026년 11월 6일 (이전 안내: 2026년 11월 5일)
      </p>
    </main>
  );
}
