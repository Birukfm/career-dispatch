import { NextRequest, NextResponse } from "next/server";

const protectedPagePrefixes: readonly string[] = ["/documents", "/settings"];

export function proxy(request: NextRequest): NextResponse {
  const hostname: string = request.nextUrl.hostname.toLowerCase();
  const isLocalRequest: boolean = ["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(hostname);
  const isProtectedPath: boolean = request.nextUrl.pathname.startsWith("/api/") || protectedPagePrefixes.some((prefix: string): boolean => request.nextUrl.pathname.startsWith(prefix));
  if (!isLocalRequest && isProtectedPath) {
    const accessToken: string = process.env.CAREER_DISPATCH_ACCESS_TOKEN ?? "";
    if (!accessToken) {
      return applySecurityHeaders(new NextResponse("Remote access is disabled. Configure CAREER_DISPATCH_ACCESS_TOKEN to continue.", { status: 403 }), false);
    }
    if (!isAuthorized(request, accessToken)) {
      const response: NextResponse = new NextResponse("Authentication required.", { status: 401 });
      response.headers.set("WWW-Authenticate", 'Basic realm="Career Dispatch", charset="UTF-8"');
      return applySecurityHeaders(response, false);
    }
  }
  return applySecurityHeaders(NextResponse.next(), !isLocalRequest);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

function isAuthorized(request: NextRequest, expectedToken: string): boolean {
  const authorization: string = request.headers.get("authorization") ?? "";
  const suppliedToken: string = extractToken(authorization);
  return suppliedToken.length === expectedToken.length && constantTimeEqual(suppliedToken, expectedToken);
}

function extractToken(authorization: string): string {
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }
  if (!authorization.startsWith("Basic ")) {
    return "";
  }
  try {
    const decodedCredentials: string = atob(authorization.slice(6));
    return decodedCredentials.slice(decodedCredentials.indexOf(":") + 1);
  } catch {
    return "";
  }
}

function constantTimeEqual(firstValue: string, secondValue: string): boolean {
  let difference: number = 0;
  for (let index: number = 0; index < firstValue.length; index += 1) {
    difference |= firstValue.charCodeAt(index) ^ secondValue.charCodeAt(index);
  }
  return difference === 0;
}

function applySecurityHeaders(response: NextResponse, shouldUseHttps: boolean): NextResponse {
  const isDevelopment: boolean = process.env.NODE_ENV === "development";
  const upgradeDirective: string = shouldUseHttps && !isDevelopment ? "upgrade-insecure-requests;" : "";
  const contentSecurityPolicy: string = `default-src 'self'; script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; ${upgradeDirective}`.replace(/\s{2,}/g, " ").trim();
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  if (shouldUseHttps && !isDevelopment) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}
