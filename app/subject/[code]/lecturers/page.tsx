"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion"; // 🌟 引入动画引擎

// 👇 更新类型定义：加上 image 和 gender
type Review = { rating: number };
type Lecturer = { 
  id: number; 
  name: string; 
  subject_code: string;
  image: string | null; 
  gender: string;       
  reviews: Review[];
};

// 🌟 动画配置：瀑布流父容器
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 } // 卡片依次浮现的时间差
  }
};

// 🌟 动画配置：单张卡片出场
const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  }
};

export default function LecturerList() {
  const params = useParams();
  const router = useRouter();
  // 处理 URL 编码，防止 subject code 乱码
  const subjectCode = params.code ? decodeURIComponent(params.code as string) : "";
  
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 👑 新增：记录当前访客是不是 VIP
  const [isVIP, setIsVIP] = useState(false);

  // 检查 VIP 身份
  useEffect(() => {
    async function checkVIPStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        const { data } = await supabase
          .from("vip_admins")
          .select("email")
          .eq("email", user.email)
          .single();
        
        if (data) {
          setIsVIP(true); // 是 VIP，放行！
        }
      }
    }
    checkVIPStatus();
  }, []);

  // 获取讲师和评分数据
  useEffect(() => {
    async function fetchLecturersAndReviews() {
      const { data, error } = await supabase
        .from("lecturers")
        .select("*, reviews(rating)")
        .eq("subject_code", subjectCode);
      
      if (error) {
        console.error("Error:", error);
      } else {
        // @ts-ignore
        setLecturers(data || []);
      }
      setLoading(false);
    }

    if (subjectCode) fetchLecturersAndReviews();
  }, [subjectCode]);

  function calculateAverage(reviews: Review[]) {
    if (!reviews || reviews.length === 0) return "New";
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center overflow-hidden">
      
      {/* 🌟 Header (丝滑下拉) */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md flex items-center mb-8 pt-4"
      >
        <button 
          onClick={() => router.back()} 
          className="text-gray-400 hover:text-blue-600 transition-colors font-medium flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
        </button>
        <h1 className="flex-1 text-center text-xl font-extrabold text-blue-900">Lecturers</h1>
        <div className="w-16"></div> {/* 占位保持居中 */}
      </motion.div>

      {/* 🌟 核心区域：管理 Loading / Empty / List 的退场与进场 */}
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-20 text-center"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading lecturers...</p>
            </motion.div>
          ) : lecturers.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring" }}
              className="text-center p-10 bg-white rounded-2xl shadow-sm border border-gray-100"
            >
               <div className="text-5xl mb-3">👻</div>
               <p className="text-gray-500 font-medium text-lg">No lecturers found.</p>
               <p className="text-gray-400 text-sm mt-1">Check back later or request to add one!</p>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 pb-10"
            >
              {lecturers.map((lec) => {
                const averageRating = calculateAverage(lec.reviews);
                const reviewCount = lec.reviews?.length || 0;

                return (
                  <motion.div 
                    key={lec.id} 
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div 
                      onClick={() => router.push(`/subject/${subjectCode}/lecturers/${lec.id}`)}
                      className="relative bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group overflow-hidden"
                    >
                      {/* 🌟 隐形蓝条：Hover 时左侧亮起 */}
                      <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-center gap-4 overflow-hidden pl-1">
                        {/* 🔒 头像逻辑保持不变 */}
                        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-gray-50 shadow-sm relative">
                          {isVIP ? (
                            lec.image ? (
                              <img 
                                src={lec.image} 
                                alt={lec.name} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl bg-blue-50">
                                {lec.gender === "Female" ? "👩‍🏫" : "👨‍🏫"}
                              </div>
                            )
                          ) : (
                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                              <span className="text-xl">🔒</span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-800 text-lg truncate pr-2 group-hover:text-blue-600 transition-colors">
                            {lec.name}
                          </h3>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100">
                              <span className="text-yellow-500 text-xs mr-1">⭐</span>
                              <span className="text-yellow-700 font-bold text-sm">{averageRating}</span>
                            </div>
                            <span className="text-xs text-gray-400">({reviewCount} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-gray-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all pr-2">
                        ➔
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}