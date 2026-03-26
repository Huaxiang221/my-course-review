"use client";

import { useState, useEffect } from "react"; // 👈 新增导入 useEffect
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// 初始化 Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // 👇👇👇 新增代码：接应 Google 登录成功的用户
  useEffect(() => {
    // 监听 Supabase 的登录状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // 如果发现有人通过 Google 登录成功了
      if (event === "SIGNED_IN" && session) {
        console.log("VIP Login Detected! Granting access...");
        // 1. 立刻发放一张普通 Cookie 通行证，骗过 Middleware
        document.cookie = "standard_access=true; path=/; max-age=" + 60 * 60 * 24 * 7;
        
        // 2. 护送进入首页并刷新状态
        router.push("/");
        router.refresh();
      }
    });

    // 清理监听器
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);
  // 👆👆👆 新增结束

  // 处理普通学生输入密码
  const handleStandardLogin = () => {
    if (password === "utm2026") { 
      document.cookie = "standard_access=true; path=/; max-age=" + 60 * 60 * 24 * 7;
      router.push("/"); 
      router.refresh();
    } else {
      setError("Incorrect password!");
    }
  };

  // 处理 VIP Google 登录
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`, // 授权后跳回首页
      },
    });

    if (error) alert("Google Login Failed!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-8">Course Review Access</h1>
        
        {/* === 普通密码登录区 === */}
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Standard Access</p>
          <input
            type="password"
            placeholder="Enter access password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStandardLogin()}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          <button 
            onClick={handleStandardLogin}
            className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all"
          >
            Enter Website
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-4 text-xs text-gray-400 font-bold uppercase">Admin Only</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* === VIP Google 登录区 === */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Admin Login with Google
        </button>

      </div>
    </div>
  );
}