import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // /admin protection: cookie existence check only.
  // The /admin page renders its own login form when no session is found.
  // Real role verification happens in the Server Component via auth.api.getSession().
  if (pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      // No cookie — let the request through; /admin page will render login form
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except: api routes, Next.js internals, static files, studio
    "/((?!api|_next/static|_next/image|favicon.ico|studio).*)",
  ],
};
