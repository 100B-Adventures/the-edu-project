import LoginForm from '@/features/auth/components/login-form';
import { OdokgongLogin } from '@/features/auth/components/odokgong-login';
import { PageViewTracker } from '@/shared/components/analytics';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default function LoginPage() {
  return (
    <main className="max-w-dialog-wide mx-auto w-full px-4">
      <PageViewTracker pageName="auth_login" />
      {isMvpHShellEnabled() ? <OdokgongLogin /> : <LoginForm />}
    </main>
  );
}
