"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";

type Subject = {
  id: number;
  code: string;
  name: string;
  year: number;
};

const years = [1, 2, 3, 4];

// 🌟 动画配置：瀑布流父容器 (已修复 TypeScript 报错)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// 🌟 动画配置：单张卡片出场 (已修复 TypeScript 报错)
const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  }
};

export default function Home() {
  const router = useRouter();
  
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [selectedYear, setSelectedYear] = useState(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 恢复记忆：读取之前选择的年份
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedYear = sessionStorage.getItem("saved_year");
      if (savedYear) {
        setSelectedYear(Number(savedYear));
      }
    }
  }, []);

  // 2. 终极安保系统：拦截非 VIP + 擦除带 token 的网址
  useEffect(() => {
    const checkVipAndCleanUrl = async () => {
      if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const userEmail = session.user.email;
          const { data: vipUser } = await supabase
            .from("vip_admins") 
            .select("email")
            .eq("email", userEmail)
            .single();

          if (!vipUser) {
            await supabase.auth.signOut();
            router.replace("/login");
            return; 
          }

          // 完美擦除网址里的 token，保持 URL 干净
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
      setIsAuthenticating(false);
    };

    checkVipAndCleanUrl();
  }, [router]);

  // 3. 获取课程数据
  useEffect(() => {
    async function fetchSubjects() {
      setLoading(true);
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("year", selectedYear);

      if (error) {
        console.error("Error fetching subjects:", error);
      } else {
        // @ts-ignore
        setSubjects(data || []);
      }
      setLoading(false);
    }

    if (!isAuthenticating) {
      fetchSubjects();
    }
  }, [selectedYear, isAuthenticating]);

  // 🚨 核心拦截：正在查岗时显示全屏 Loading
  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-400 text-sm font-medium animate-pulse">Checking access...</p>
      </div>
    );
  }

  // ✅ 验证通过后，展示丝滑 UI
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 overflow-hidden">
      
      {/* 🌟 标题丝滑降落 */}
      <motion.h1 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold text-blue-700 mb-2 mt-8"
      >
        Uni Course Review 🎓
      </motion.h1>
      <motion.p 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-gray-500 mb-8 text-sm"
      >
        Real data from Supabase!
      </motion.p>

      {/* 🌟 高级感拉满的年份选择器 (Apple Style) */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-1.5 rounded-full shadow-sm mb-8 flex gap-1 border border-gray-100 relative"
      >
        {years.map((year) => (
          <button
            key={year}
            onClick={() => {
              setSelectedYear(year);
              if (typeof window !== "undefined") {
                sessionStorage.setItem("saved_year", year.toString());
              }
            }}
            className={`relative px-6 py-2 rounded-full text-sm font-bold transition-colors z-10 ${
              selectedYear === year ? "text-white" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {/* 魔法就在这里：滑动的背景块 */}
            {selectedYear === year && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-blue-600 rounded-full -z-10 shadow-md"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            Year {year}
          </button>
        ))}
      </motion.div>

      {/* 🌟 核心区域：加入 AnimatePresence 管理组件的生死退场 (优化了 min-h-100) */}
      <div className="w-full max-w-md min-h-100">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="py-20 text-center"
            >
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
               <p className="text-gray-400 text-sm">Loading subjects...</p>
            </motion.div>
          ) : subjects.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring" }}
              className="text-center p-10 bg-white rounded-2xl border border-gray-100 shadow-sm"
            >
               <p className="text-4xl mb-3">📭</p>
               <p className="text-gray-500 font-medium">No subjects found for Year {selectedYear}.</p>
               <p className="text-xs text-gray-400 mt-1">Go add some in Supabase!</p>
            </motion.div>
          ) : (
            <motion.div
              key={`list-${selectedYear}`} // 绑定 Year，改变时重新触发瀑布流
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="space-y-4 pb-10"
            >
              {subjects.map((subject) => (
                <motion.div 
                  key={subject.id} 
                  variants={itemVariants}
                  // 鼠标悬浮和点击的物理反弹感
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={`/subject/${subject.code}`}
                    className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-center pl-2">
                      <div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                          {subject.code}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800 mt-2.5 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                          {subject.name}
                        </h3>
                      </div>
                      <span className="text-gray-300 text-xl group-hover:text-blue-500 group-hover:translate-x-1 transition-all">➔</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-auto py-6 text-gray-400 text-xs"
      >
        © 2026 FKM Course Review
      </motion.footer>
    </div>
  );
}