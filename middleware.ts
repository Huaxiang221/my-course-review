import { NextRequest, NextResponse } from "next/server";

export const config = {
  // 锁住首页和所有 subject 详情页，但放行 API 和静态文件
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // 1. 检查普通用户的密码记录 (等下我们在 login 页面会发放这个 Cookie)
  const hasStandardAccess = req.cookies.get("standard_access")?.value === "true";

  // 2. 检查 VIP 的 Supabase 登录状态 (Supabase 登录后会自动生成 sb- 开头的 cookie)
  const hasVipAccess = req.cookies.getAll().some(cookie => cookie.name.includes("-auth-token"));

  // 3. 如果既没有普通权限，也没有 VIP 权限，踢回咱们自己画的登录页
  if (!hasStandardAccess && !hasVipAccess) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}