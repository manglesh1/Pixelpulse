// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

async function roleFromToken(token?: string | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return (payload as any)?.role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/errors") ||
    pathname === "/favicon.ico";

  const isAdminRoute = /^\/(admin|admin-page|api\/admin)(\/|$)/.test(pathname);

  const token = req.cookies.get("adminToken")?.value ?? null;
  const role = await roleFromToken(token);

  if (isAdminRoute) {
    if (role !== "admin") {
      return NextResponse.rewrite(new URL("/errors/unauthorized", req.url));
    }
    return NextResponse.next();
  }

  if (!isPublic && !token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
