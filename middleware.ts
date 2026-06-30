import { NextRequest, NextResponse } from "next/server";

// UX short-circuit only: redirect /admin sub-routes to the /admin login when the admin
// cookie is absent. This is NOT the security boundary — real auth is enforced server-side
// by isAdmin() on the /admin page and inside every admin server action (Node HMAC verify,
// which can't run on the Edge runtime middleware uses).
export function middleware(req: NextRequest) {
  if (!req.cookies.has("wcp_admin")) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin"; // the /admin page renders the password form
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // /admin itself self-gates with the login form; this protects any future /admin/* routes.
  matcher: ["/admin/:path+"],
};
