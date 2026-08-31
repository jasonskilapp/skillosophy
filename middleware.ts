import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Set NEXT_PUBLIC_ROOT_DOMAIN in Vercel env vars (e.g. "skillosophy.com")
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "skillosophy.com";

function getSubdomain(hostname: string): string {
  const hostWithoutPort = hostname.split(":")[0];
  if (hostWithoutPort.endsWith(`.${ROOT_DOMAIN}`)) {
    return hostWithoutPort.slice(0, -(ROOT_DOMAIN.length + 1));
  }
  // Dev: client.localhost, admin.localhost
  if (hostWithoutPort.endsWith(".localhost")) {
    return hostWithoutPort.slice(0, -(".localhost".length));
  }
  return "";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(hostname);

  // Always pass through Next.js internals, static files, and auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (subdomain === "client") {
    if (!pathname.startsWith("/client")) {
      url.pathname = `/client${pathname === "/" ? "" : pathname}`;
    }
    const res = NextResponse.rewrite(url);
    res.headers.set("x-subdomain", "client");
    return res;
  }

  if (subdomain === "admin") {
    if (!pathname.startsWith("/admin")) {
      url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    }
    const res = NextResponse.rewrite(url);
    res.headers.set("x-subdomain", "admin");
    return res;
  }

  // Root domain → public discovery (future)
  // app subdomain or bare localhost → existing caseworker portal (no rewrite)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
