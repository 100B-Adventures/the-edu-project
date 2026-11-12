import { NextRequest, NextResponse } from 'next/server';

import { decodeJwt } from 'jose';

// CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://dev.hongong.today',
  'https://hongong.today',
  'https://www.hongong.today',
  'https://dev.d-edu.site',
  'https://d-edu.site',
  'https://the-edu-front.vercel.app',
];
const createCorsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Custom-Header',
  'Access-Control-Allow-Credentials': 'true',
});

// 인증없이 접근 가능한 경로
const PUBLIC_PATHS = new Set<string>([
  '/',
  '/login',
  '/register',
  '/403',
  '/api/v1/auth/login',
  '/api/v1/auth/sign-up', // 이메일 회원가입: 비로그인 방문자가 부른다
  '/api/v1/member/info', // 자체 인증 처리 (쿠키 없으면 204 반환)
  '/api/drawing-session-ingest', // dev: iPad 필기 캡처 (route는 production에서 404)
]);

// next.js 인프라 내부로의 요청인지 판단
function isInfraRequest(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  return (
    // req.method === 'OPTIONS' ||
    req.headers.get('next-router-prefetch') === '1' ||
    req.headers.get('next-router-state-tree') === '1' ||
    req.headers.get('purpose') === 'prefetch' ||
    req.headers.get('rsc') === '1' ||
    searchParams.has('_rsc') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2)$/.test(pathname)
  );
}

// 인증 없으면 로그인으로
function handleAuthGuard(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get('Authorization')?.value;
  // const refreshToken = req.cookies.get('refresh')?.value;

  if (!accessToken) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/admin')) {
    try {
      const role = decodeJwt(accessToken).auth;
      if (role !== 'ROLE_ADMIN') {
        const url = req.nextUrl.clone();
        url.pathname = '/403';
        url.search = '';
        return NextResponse.redirect(url);
      }
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

function isPublicCourseLessonsRequest(req: NextRequest) {
  return (
    req.method === 'GET' &&
    /^\/api\/v1\/common\/courses\/[^/]+\/lessons$/.test(req.nextUrl.pathname)
  );
}

// 미들웨어 메인함수
export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  if (req.method === 'OPTIONS') {
    const reqOrigin = req.headers.get('origin') || origin;
    let allowedOrigin = reqOrigin;

    if (!ALLOWED_ORIGINS.includes(reqOrigin)) {
      allowedOrigin = ALLOWED_ORIGINS[0] || '*';
    }

    const corsHeaders = createCorsHeaders(allowedOrigin);

    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (isInfraRequest(req)) {
    return NextResponse.next();
  }

  // 공개 경로 통과
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // 백엔드 공개 API 경로는 인증 없이 통과 (BFF에서 쿠키는 자동으로 붙음)
  if (pathname.startsWith('/api/v1/public/')) {
    return NextResponse.next();
  }

  // 구매 전 커리큘럼 메타데이터 공개. 백엔드가 잠긴 본문·문제는 제거한다.
  if (isPublicCourseLessonsRequest(req)) {
    return NextResponse.next();
  }

  // 인증 가드
  return handleAuthGuard(req);
}

export const config = {
  matcher: [
    '/',
    '/api/:path*',
    '/dashboard/:path*',
    '/study-rooms/:path*',
    '/mypage',
    '/admin/:path*',
    '/403',
  ],
};
