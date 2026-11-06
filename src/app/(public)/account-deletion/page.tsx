import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '계정 삭제 안내 | 오독공',
  description: '오독공 계정과 관련 데이터를 삭제하는 방법을 안내합니다.',
};

const STEPS = [
  '오독공 앱 또는 hongong.today 에 로그인합니다.',
  '설정 화면으로 이동합니다.',
  '계정 탈퇴에서 탈퇴하기를 누르고 안내에 따라 최종 탈퇴를 완료합니다.',
];

export default function AccountDeletionPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-title-heading mb-3">계정 삭제 안내</h1>
      <p className="font-body2-normal text-text-sub2 mb-8 leading-relaxed">
        오독공 계정은 앱과 웹사이트에서 직접 삭제할 수 있습니다. 로그인할 수
        없다면 가입한 이메일 주소로 support@hongong.today 에 삭제를 요청해
        주세요.
      </p>

      <section className="border-line-line1 mb-6 rounded-xl border p-5">
        <h2 className="font-body1-heading mb-3">직접 삭제하는 방법</h2>
        <ol className="font-body2-normal list-decimal space-y-2 pl-5 leading-relaxed">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <Link
          href="/settings"
          className="font-body2-normal mt-4 inline-block underline"
        >
          설정 화면으로 이동
        </Link>
      </section>

      <section className="border-line-line1 rounded-xl border p-5">
        <h2 className="font-body1-heading mb-3">삭제되는 데이터와 보관 기간</h2>
        <p className="font-body2-normal leading-relaxed">
          탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다. 관계 법령에 따라
          보관해야 하는 정보는 정해진 기간 동안 보관한 뒤 파기합니다. 자세한
          항목과 기간은 개인정보 처리방침에서 확인할 수 있습니다.
        </p>
      </section>
    </main>
  );
}
