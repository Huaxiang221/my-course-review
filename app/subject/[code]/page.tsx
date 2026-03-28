"use client";

import { useParams, useRouter } from "next/navigation";
import RequestModal from "@/app/components/RequestModal";
import { motion, Variants } from "framer-motion"; // 🌟 引入动画引擎

// 🌟 动画配置：瀑布流父容器
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 } // 卡片依次浮现的时间差
  }
};

// 🌟 动画配置：子元素（卡片）
const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  }
};

export default function SubjectSelection() {
  const params = useParams();
  const router = useRouter();
  const subjectCode = params.code ? decodeURIComponent(params.code as string) : "Unknown";

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center overflow-hidden">
      
      {/* 🌟 Header (丝滑下拉) */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md flex items-center mb-10 pt-4"
      >
        <button 
          onClick={() => router.back()} 
          className="text-gray-400 hover:text-blue-600 transition-colors font-medium flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
        </button>
        <h1 className="flex-1 text-center text-2xl font-extrabold text-blue-900 tracking-tight">
          {subjectCode}
        </h1>
        <div className="w-14"></div> {/* 占位，保持标题绝对居中 */}
      </motion.div>

      {/* 🌟 选项卡区域 (瀑布流动画) */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-md space-y-4"
      >
        
        {/* 1. 讲师列表 (Lecturers) */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <button 
            onClick={() => router.push(`/subject/${subjectCode}/lecturers`)}
            className="w-full bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center justify-between hover:border-blue-200 transition-colors group relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-5 pl-2">
              {/* ✨ 现代化的 SVG 图标：Users */}
              <div className="w-14 h-14 bg-blue-50/80 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition-colors">Lecturers</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Rate & Review</p>
              </div>
            </div>
            <span className="text-gray-200 text-xl group-hover:text-blue-500 group-hover:translate-x-1 transition-all">➔</span>
          </button>
        </motion.div>

        {/* 2. 课程详情 (About Course) */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <button 
            onClick={() => router.push(`/subject/${subjectCode}/course`)}
            className="w-full bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] border border-gray-100 flex items-center justify-between hover:border-green-200 transition-colors group relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 w-1 h-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-5 pl-2">
              {/* ✨ 现代化的 SVG 图标：Book Open */}
              <div className="w-14 h-14 bg-green-50/80 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all shadow-inner">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors">About Course</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Info & AI Summary</p>
              </div>
            </div>
            <span className="text-gray-200 text-xl group-hover:text-green-500 group-hover:translate-x-1 transition-all">➔</span>
          </button>
        </motion.div>

      </motion.div>

      {/* 🌟 Request Modal (最后温柔淡入) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-10"
      >
        <RequestModal type="lecturer" subjectCode={subjectCode} />
      </motion.div>

    </div>
  );
}