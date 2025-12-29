export { auth as middleware } from '@/lib/auth';

export const config = {
    matcher: [
        // Match all paths except:
        // - api/auth (auth endpoints)
        // - _next/static (static files)
        // - _next/image (image optimization files)
        // - favicon.ico (favicon file)
        // - public files (images, etc.)
        '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
