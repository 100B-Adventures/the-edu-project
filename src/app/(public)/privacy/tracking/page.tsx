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
      '방문 페이지 주소, 가입·문의 완료 이벤트, 쿠키 식별자, 기기·브라우저 정보, IP',
    purpose: '광고 성과 측정과 맞춤형 광고',
    optOut: 'Meta 광고 설정 또는 브라우저 쿠키 차단',
    href: 'https://www.facebook.com/adpreferences',
  },
  {
    name: '당근 픽셀(전환 추적 코드)',
    company: '당근마켓 주식회사',
    items:
      '방문 페이지 주소, 가입·문의 완료 이벤트, 쿠키 식별자, 기기·브라우저 정보',
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
        이메일, 전화번호, 이름은 이 도구들로 보내지 않습니다.
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

      <p className="font-body2-normal text-text-sub2 mt-8 leading-relaxed">
        국외 이전: 해외 법인이 제공하는 도구는 페이지를 이용하는 시점에 암호화
        통신으로 해당 업체 서버에 전송되어 국외에서 처리될 수 있습니다. 보유
        기간은 각 업체의 정책과 계정 설정을 따릅니다. 거부해도 서비스 이용에는
        제한이 없습니다. 문의: support@hongong.today
      </p>
      <p className="font-body2-normal text-text-sub2 mt-4">
        시행일자: 2026년 11월 5일
      </p>
    </main>
  );
}
