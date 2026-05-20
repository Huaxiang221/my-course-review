"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter, useParams } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence, Variants } from "framer-motion"; 

type Course = {
  code: string;
  name: string;
  description: string;
  ai_summary: string | null;
  marks_distribution: { name: string; value: number }[] | null;
};

// 🌟 Review 类型去掉了 reported_by，只保留 report_count
type Review = {
  id: number;
  student_name: string;
  rating: number; 
  comment: string;
  created_at: string;
  likes: number; 
  report_count: number; 
};

// 🎨 图表配色
const COLORS = [
  "#8B5CF6", "#3B82F6", "#10B981", "#FBBF24", "#F97316",
  "#EC4899", "#14B8A6", "#84CC16", "#06B6D4", "#F43F5E" 
];

// 📖 书本图标
function BookOpenIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

// 🌟 星星图标组件
function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#F97316" : "#E5E7EB"} style={{ minWidth: size }} className="transition-colors duration-300">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}

// 👍 大拇指图标组件
function ThumbUpIcon({ className = "w-4 h-4", solid = false }: { className?: string, solid?: boolean }) {
  return solid ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.125c0-1.75.599-3.358 1.602-4.5698.53-.636.984-1.231 1.492-1.892.45-.588.899-1.161 1.272-1.739a11.2 11.2 0 001.076-1.99 3.012 3.012 0 012.78-1.921H15.5c1.656 0 3 1.343 3 3v.685c0 .356.126.702.355.975l.184.22c.118.14.248.271.385.394a4.5 4.5 0 011.576 3.435v.982a4.5 4.5 0 01-1.576 3.435c-.137.123-.267.254-.385.394l-.184.22a1.5 1.5 0 00-.355.975v.685c0 1.657-1.344 3-3 3h-2.145c-.244 0-.486-.06-.698-.17l-.872-.456a2.002 2.002 0 00-1.85-.015l-.83.43c-.22.113-.47.172-.724.172H7.493z" />
      <path d="M4.5 18.5A1.5 1.5 0 013 17V10.5a1.5 1.5 0 011.5-1.5h1.5v9.5H4.5z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V2.75a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25v1.372c0 .516.209 1.031.572 1.394.316.316.632.632.948.948A4.49 4.49 0 0119.5 11v1.5a4.49 4.49 0 01-1.328 3.178c-.316.316-.632.632-.948.948-.363.363-.572.878-.572 1.394v1.372a2.25 2.25 0 01-2.25 2.25h-3.21a2.25 2.25 0 01-1.956-1.12l-1.05-1.838a3.75 3.75 0 00-2.47-1.65l-1.55-.38a2.25 2.25 0 01-1.68-2.19V10.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 10.5H4.5v9.75h4.5v-9.75z" />
    </svg>
  );
}

// 🚩 举报图标组件
function FlagIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.15.743a9 9 0 01-6.105-.712l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  );
}

// ✨ 动画配置
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function CourseReviewPage() {
  const params = useParams();
  const router = useRouter();
  const subjectCode = params.code ? decodeURIComponent(params.code as string) : "";
  const formRef = useRef<HTMLDivElement>(null); 

  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0); 
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [sessionReviewIds, setSessionReviewIds] = useState<number[]>([]); 

  // 🌟 只用本地存储记录点赞和举报，不依赖任何账号
  const [likedReviews, setLikedReviews] = useState<number[]>([]);
  const [reportedReviews, setReportedReviews] = useState<number[]>([]); 

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  useEffect(() => {
    // 页面加载时，读取本地存储的记录
    const savedLikes = localStorage.getItem("course_liked_reviews");
    if (savedLikes) setLikedReviews(JSON.parse(savedLikes));

    const savedReports = localStorage.getItem("course_reported_reviews");
    if (savedReports) setReportedReviews(JSON.parse(savedReports));

    async function fetchData() {
      if (!subjectCode) return;
      
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("code", subjectCode)
        .single();
        
      if (courseData) {
        setCourse(courseData);
        if (courseData.ai_summary) setSummary(courseData.ai_summary);
      }

      const { data: reviewData } = await supabase
        .from("course_reviews")
        .select("*")
        .eq("subject_code", subjectCode)
        .order("created_at", { ascending: false });
        
      if (reviewData) setReviews(reviewData);
    }
    fetchData();
  }, [subjectCode]);

  async function handleSubmit() {
    if (rating === 0) return alert("Please rate the difficulty level! ⭐");
    setIsSubmitting(true);

    let error;

    if (editingReviewId) {
      // 📝 更新
      const res = await supabase.from("course_reviews")
        .update({ rating, comment })
        .eq("id", editingReviewId);
      error = res.error;
    } else {
      // ➕ 新增
      const res = await supabase.from("course_reviews")
        .insert([{ subject_code: subjectCode, rating, comment, student_name: "Anonymous Student" }])
        .select();
      
      error = res.error;
      
      if (res.data && res.data.length > 0) {
        setSessionReviewIds(prev => [...prev, res.data[0].id]);
      }
    }

    if (!error) {
      await supabase.from("courses").update({ ai_summary: null }).eq("code", subjectCode);
      const { data } = await supabase.from("course_reviews").select("*").eq("subject_code", subjectCode).order("created_at", { ascending: false });
      setReviews(data || []);
      setRating(0); 
      setComment(""); 
      setSummary("");
      setEditingReviewId(null); 
    } else {
      alert("Something went wrong: " + error.message);
    }
    setIsSubmitting(false);
  }

  // 👍 处理点赞
  async function handleLike(reviewId: number, currentLikes: number) {
    if (likedReviews.includes(reviewId)) return; 

    const newLikesCount = (currentLikes || 0) + 1;
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likes: newLikesCount } : r));
    
    const newLikedArray = [...likedReviews, reviewId];
    setLikedReviews(newLikedArray);
    localStorage.setItem("course_liked_reviews", JSON.stringify(newLikedArray));

    const { error } = await supabase
      .from("course_reviews")
      .update({ likes: newLikesCount })
      .eq("id", reviewId);

    if (error) console.error("Like error:", error);
  }

  // 🚩 处理举报 (纯 Local Storage 验证)
  async function handleReport(review: Review) {
    // 检查本地缓存，看当前浏览器是否举报过这条评论
    if (reportedReviews.includes(review.id)) {
      return alert("You have already reported this comment. 🚩");
    }

    const confirmReport = window.confirm("Are you sure you want to report this comment?\n(Comments receiving 3 reports will be automatically deleted)");
    if (!confirmReport) return;

    const newReportCount = (review.report_count || 0) + 1;

    // 🚨 达到 3 次举报，直接从数据库删除
    if (newReportCount >= 3) {
      const { error } = await supabase.from("course_reviews").delete().eq("id", review.id);
      
      if (!error) {
        setReviews(prev => prev.filter(r => r.id !== review.id)); // 从 UI 中移除
        alert("This comment has been removed due to multiple reports. 🛡️");
      } else {
        alert("Error removing comment: " + error.message);
      }
    } else {
      // 还没到 3 次，更新数据库的举报数量
      const { error } = await supabase.from("course_reviews")
        .update({ report_count: newReportCount })
        .eq("id", review.id);

      if (!error) {
        // 更新 UI
        setReviews(prev => prev.map(r => r.id === review.id ? { ...r, report_count: newReportCount } : r));
        
        // 记录到当前浏览器的 Local Storage，防止这台设备再次举报
        const newReportedArray = [...reportedReviews, review.id];
        setReportedReviews(newReportedArray);
        localStorage.setItem("course_reported_reviews", JSON.stringify(newReportedArray));
        
        alert("Report submitted successfully. Thank you! 🙏");
      } else {
        alert("Error reporting: " + error.message);
      }
    }
  }

  function handleEditClick(review: Review) {
    setRating(review.rating);
    setComment(review.comment);
    setEditingReviewId(review.id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function cancelEdit() {
    setEditingReviewId(null);
    setRating(0);
    setComment("");
  }

  async function generateSummary() {
    if (reviews.length === 0) return alert("No reviews to summarize!");
    setIsGenerating(true);

    try {
      const reviewsText = reviews.map(r => r.comment).join(". ");
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reviewsText, 
          averageRating, 
          reviewCount: reviews.length,
          courseCode: subjectCode
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSummary(data.summary);
      await supabase.from("courses").update({ ai_summary: data.summary }).eq("code", subjectCode);
    } catch (e: any) {
      alert("AI Error: " + e.message);
    }
    setIsGenerating(false);
  }

  // 🌟 同步了强大的 JSON 防御解析逻辑
  let parsedSummary = { en: "", ms: "", zh: "" };
  if (summary) {
    try {
      let cleanSummary = summary.replace(/```json/gi, "").replace(/```/g, "").trim();
      cleanSummary = cleanSummary.replace(/\n/g, "\\n").replace(/\r/g, "");
      parsedSummary = JSON.parse(cleanSummary);
    } catch (error) {
      console.warn("JSON解析警告 (已启动备用方案):", error);
      const extractMatch = (lang: string) => {
        const regex = new RegExp(`"${lang}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?:,|\\}|$)`);
        const match = summary.match(regex);
        return match ? match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : "";
      };
      const fallbackEn = extractMatch("en");
      const fallbackMs = extractMatch("ms");
      const fallbackZh = extractMatch("zh");
      if (fallbackEn || fallbackMs || fallbackZh) {
        parsedSummary = { en: fallbackEn || "", ms: fallbackMs || "", zh: fallbackZh || "" };
      } else {
        parsedSummary = { en: summary, ms: "", zh: "" };
      }
    }
  }

  if (!course) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-400 text-sm font-medium">Fetching Course...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center overflow-x-hidden pb-24">
      
      {/* 🌟 顶部导航条加宽 */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-5xl mb-8 pt-4 flex items-center">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-blue-600 transition-colors font-medium group flex items-center gap-2">
           <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
        </button>
        <h1 className="flex-1 text-center text-2xl font-extrabold text-blue-900 tracking-tight">About Course</h1>
        <div className="w-16"></div>
      </motion.div>

      {/* 🌟 核心修改：双栏网格布局 */}
      <motion.div 
        variants={staggerContainer} 
        initial="hidden" 
        animate="show" 
        className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-start"
      >
        
        {/* ==========================================
            左侧边栏 (课程信息 + 图表 + 评分表单) -> 固定悬浮
        ========================================== */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 lg:sticky lg:top-8 shrink-0">
          
          {/* 1. 课程核心信息 */}
          <motion.div variants={fadeInUp} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 text-center relative overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-green-400 via-blue-500 to-indigo-500"></div>
            
            <div className="relative inline-flex mb-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner border border-blue-100 mt-2">
                    <BookOpenIcon className="w-8 h-8" />
                </div>
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-1">{course.code}</h2>
            <h3 className="text-gray-500 font-medium mb-6 px-4">{course.name}</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50/70 rounded-2xl p-4 border border-gray-100 shadow-inner">
              <div className="flex flex-col items-center border-r border-gray-200">
                 <div className="flex items-end gap-1">
                   <span className="text-5xl font-black text-gray-800 leading-none">{averageRating}</span>
                   <span className="text-sm text-gray-400 font-bold mb-0.5">/5.0</span>
                 </div>
                 <p className="text-xs text-gray-400 font-medium mt-1.5">{reviews.length} Student Reviews</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="flex text-orange-400 text-base gap-0.5 mb-1.5">
                  {[1, 2, 3, 4, 5].map(s => <StarIcon key={s} filled={s <= Math.round(Number(averageRating))} size={18} />)}
                </div>
                <span className="text-xs bg-orange-50 text-orange-700 font-bold px-3 py-1 rounded-full border border-orange-200 shadow-sm">Overall Difficulty</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed px-2 whitespace-pre-line">{course.description || "No description provided."}</p>
          </motion.div>

          {/* 2. Marks Distribution Chart */}
          <motion.div variants={fadeInUp} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-extrabold text-gray-900 mb-1 text-center">Marks Distribution</h3>
            <p className="text-sm text-gray-400 text-center mb-5 font-medium">Weightage of assessments</p>
            
            {course.marks_distribution ? (
              <div className="flex flex-col items-center">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={course.marks_distribution}
                        cx="50%" cy="50%"
                        innerRadius={70} outerRadius={95}
                        cornerRadius={10} 
                        paddingAngle={3} 
                        dataKey="value"
                        stroke="#ffffff" 
                        strokeWidth={3}
                      >
                        {course.marks_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}/>
                      <Legend content={() => null} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 px-4 w-full">
                  {course.marks_distribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-md shadow-inner border-2 border-white shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-xs font-bold text-gray-600 truncate">{entry.name}</span>
                      <span className="text-sm font-black text-gray-800 ml-auto">{entry.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-medium">No marks data available.</p>
              </div>
            )}
          </motion.div>

          {/* 3. Review Form */}
          <motion.div ref={formRef} variants={fadeInUp} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-extrabold text-gray-900 mb-2 text-center">
              {editingReviewId ? "Edit Your Review" : "Rate Subject Difficulty"}
            </h3>
            
            <div className="flex justify-center items-center gap-2 mb-4 text-xs font-bold text-gray-400">
              <span className="bg-green-50 text-green-600 px-2 py-1 rounded-md">1 = Very Easy</span>
              <span>—</span>
              <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md">5 = Extremely Hard</span>
            </div>
            
            <div className="flex justify-center gap-1.5 mb-5 bg-gray-50 rounded-full p-2 border border-gray-100 shadow-inner">
              {[1, 2, 3, 4, 5].map((s) => (
                <motion.button 
                  key={s} 
                  onClick={() => setRating(s)} 
                  type="button" 
                  className="p-1 rounded-full hover:bg-orange-50 transition-colors"
                  whileHover={{ scale: 1.25, transition: { duration: 0.2 } }} 
                  whileTap={{ scale: 0.9 }}
                >
                  <StarIcon filled={s <= rating} size={36} />
                </motion.button>
              ))}
            </div>
            <textarea
              className="w-full p-4 border border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4 text-sm resize-none shadow-inner"
              rows={4}
              placeholder="Is this subject hard? How's the workload?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl shadow-md hover:bg-black transition-colors">
              {isSubmitting ? "Saving..." : (editingReviewId ? "Update Review" : "Submit Review")}
            </button>
            
            {editingReviewId && (
              <button 
                onClick={cancelEdit} 
                disabled={isSubmitting} 
                className="w-full mt-3 py-3.5 bg-white text-gray-500 font-bold rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-800 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </motion.div>
        </div>

        {/* ==========================================
            右侧主内容区 (AI Summary + 评价列表)
        ========================================== */}
        <div className="flex-1 w-full flex flex-col gap-6 min-w-0">
          
          {/* 4. AI Summary */}
          <motion.div variants={fadeInUp}>
            {!summary ? (
              <button onClick={generateSummary} disabled={isGenerating || reviews.length === 0} className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-[2.5rem] font-bold shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-lg hover:-translate-y-1.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex justify-center items-center gap-2 text-base duration-300">
                {isGenerating ? "AI is Analyzing..." : <><span>✨</span> Generate AI Summary</>}
              </button>
            ) : (
              <div className="bg-[#F8FAFC] p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm relative overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-[#312E81] font-black text-xl flex items-center gap-2">
                    <motion.span 
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      className="inline-block"
                    >
                      ✨
                    </motion.span> 
                    Course Summary
                  </h3>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-indigo-600 tracking-wider">AI GENERATED</span>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  {parsedSummary.en && (
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-inner">
                      <span className="text-sm font-bold text-blue-500 mb-2 flex items-center gap-1.5 tracking-wide">
                        <span className="text-base">🇬🇧</span> English
                      </span>
                      <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">{parsedSummary.en}</p>
                    </div>
                  )}
                  {parsedSummary.ms && (
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-inner">
                      <span className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-1.5 tracking-wide">
                        <span className="text-base">🇲🇾</span> Bahasa Melayu
                      </span>
                      <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">{parsedSummary.ms}</p>
                    </div>
                  )}
                  {parsedSummary.zh && (
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-inner">
                      <span className="text-sm font-bold text-teal-500 mb-2 flex items-center gap-1.5 tracking-wide">
                        <span className="text-base">🇨🇳</span> 中文
                      </span>
                      <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">{parsedSummary.zh}</p>
                    </div>
                  )}
                  {!parsedSummary.en && !parsedSummary.ms && !parsedSummary.zh && (
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-inner">
                       <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">{summary}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* 5. Feedback List */}
          <motion.div variants={fadeInUp} className="w-full space-y-5 mt-2">
            <div className="flex justify-between items-end mb-2 px-2">
               <h3 className="text-2xl font-extrabold text-gray-900">Student Feedback</h3>
               <span className="text-sm font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">{reviews.length} reviews</span>
            </div>

            {reviews.length === 0 ? (
               <div className="bg-white border border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center shadow-sm">
                 <span className="text-4xl mb-3">💬</span>
                 <p className="text-gray-400 font-medium">No reviews yet. Be the first to share your experience!</p>
               </div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
                {reviews.map((review, i) => {
                  const initial = review.student_name ? review.student_name.charAt(0).toUpperCase() : 'S';
                  const canEdit = sessionReviewIds.includes(review.id);
                  const isLiked = likedReviews.includes(review.id);
                  const currentLikes = review.likes || 0;
                  const isReported = reportedReviews.includes(review.id);
                  
                  return (
                    <motion.div 
                      key={i} 
                      variants={fadeInUp} 
                      className={`bg-white p-6 rounded-3xl shadow-sm border ${editingReviewId === review.id ? 'border-orange-400 shadow-md ring-2 ring-orange-50' : 'border-gray-100 hover:-translate-y-1.5 hover:shadow-md'} transition-all duration-300 flex flex-col`}
                    >
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xl">
                            {initial}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-gray-900 text-[17px]">
                              {review.student_name || "Anonymous Student"}
                            </span>
                            {/* 🌟 补充了日期显示逻辑，和 Lecturer 页面保持一致 */}
                            <span className="text-xs text-gray-400 font-medium">
                              {new Date(review.created_at).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1 bg-orange-50 px-2.5 py-1.5 rounded-full border border-orange-100 shadow-sm">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon key={star} filled={star <= review.rating} size={16} />
                            ))}
                          </div>
                          
                          {canEdit && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-gray-400 hidden sm:block">
                                * Editable before refresh
                              </span>
                              <button 
                                onClick={() => handleEditClick(review)}
                                className="text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors border border-orange-100"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex-grow shadow-inner">
                        <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">
                          {review.comment || "No comment provided."}
                        </p>
                      </div>

                      {/* 🌟 互动动作栏：举报 + 点赞 */}
                      <div className="flex justify-end items-center mt-4 gap-3">
                        <button 
                          onClick={() => handleReport(review)}
                          disabled={isReported}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            isReported 
                              ? "bg-red-50 text-red-400 border border-red-100 cursor-default" 
                              : "bg-white text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm"
                          }`}
                        >
                          <FlagIcon className="w-3.5 h-3.5" />
                          <span>{isReported ? "Reported" : "Report"}</span>
                        </button>

                        <button 
                          onClick={() => handleLike(review.id, currentLikes)}
                          disabled={isLiked}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            isLiked 
                              ? "bg-orange-50 text-orange-600 border border-orange-100 cursor-default" 
                              : "bg-white text-gray-400 border border-gray-200 hover:bg-gray-50 hover:text-gray-600 shadow-sm"
                          }`}
                        >
                          <ThumbUpIcon className="w-3.5 h-3.5 mb-0.5" solid={isLiked} />
                          <span>{currentLikes > 0 ? currentLikes : "Like"}</span>
                        </button>
                      </div>

                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>

        </div>
      </motion.div>

    </div>
  );
}