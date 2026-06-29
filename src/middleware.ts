import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Izinkan akses ke path publik
  const publicPaths = ["/login"];
  const isPublicPath =
    publicPaths.includes(pathname) || pathname.startsWith("/api/auth");

  if (isPublicPath) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as string;

  // Hanya admin yang bisa mengakses route admin
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/notifikasi",
    "/admin/:path*",
    "/profil/:path*",
    "/pinjaman/:path*",
    "/detail-katalog/:path*",
  ],
};
