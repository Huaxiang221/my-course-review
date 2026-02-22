import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/", "/subject/:path*"], // 锁住首页和所有详情页
};

export function proxy(req: NextRequest) {
  const basicAuth = req.headers.get("authorization");
  const url = req.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    const [user, pwd] = atob(authValue).split(":");

    // 👇 在这里设置你的账号和密码
    // 只有输入这个账号密码的人才能进
    if (user === "fkmcoursereview" && pwd === "utm2026") {
      return NextResponse.next();
    }
  }

  url.pathname = "/api/auth";

  return new NextResponse("🔒 Private Access Only", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}