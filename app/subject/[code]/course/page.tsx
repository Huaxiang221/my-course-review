"use client";

import { useEffect, useState } from "react";
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

type Review = {
  id: number;
  student_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

// 图表配色
const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#FBBF24", "#F97316"];

// 📖 书本图标
function BookOpenIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

// 星星图标组件
function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FACC15" : "#E5E7EB"} style={{ minWidth: size }}>
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}

// ✨ 动画配置：瀑布流效果
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

  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  useEffect(() => {
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
    if (rating === 0) return alert("Please give a rating! ⭐");
    setIsSubmitting(true);

    const { error } = await supabase.from("course_reviews").insert([{
      subject_code: subjectCode, rating, comment, student_name: "Anonymous Student",
    }]);

    if (!error) {
      await supabase.from("courses").update({ ai_summary: null }).eq("code", subjectCode);
      const { data } = await supabase.from("course_reviews").select("*").eq("subject_code", subjectCode).order("created_at", { ascending: false });
      setReviews(data || []);
      setRating(0); setComment(""); setSummary("");
    }
    setIsSubmitting(false);
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

  let parsedSummary = { en: "", ms: "", zh: "" };
  if (summary) {
    try {
      parsedSummary = JSON.parse(summary);
    } catch {
      parsedSummary = { en: summary, ms: "", zh: "" };
    }
  }

  if (!course) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-400 text-sm font-medium">Fetching Course...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center overflow-hidden pb-24">
      
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md mb-6 pt-4 flex items-center">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-blue-600 transition-colors font-medium group flex items-center gap-2">
           <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
        </button>
        <h1 className="flex-1 text-center text-xl font-extrabold text-blue-900 tracking-tight">About Course</h1>
        <div className="w-16"></div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-md space-y-6">
        
        {/* 1. 课程核心信息 (新增 hover凸起效果) */}
        <motion.div variants={fadeInUp} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 text-center relative overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-green-400 via-blue-500 to-indigo-500"></div>
          
          <div className="relative inline-flex mb-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner border border-blue-100">
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
              <div className="flex text-yellow-400 text-base gap-0.5 mb-1.5">
                {[1, 2, 3, 4, 5].map(s => <StarIcon key={s} filled={s <= Math.round(Number(averageRating))} size={18} />)}
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full border border-yellow-200 shadow-sm">Overall Rating</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed px-2 whitespace-pre-line">{course.description || "No description provided."}</p>
        </motion.div>

        {/* 2. Marks Distribution Chart (新增 hover凸起效果) */}
        <motion.div variants={fadeInUp} className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
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

              {/* HTML Legend */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 px-4">
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

        {/* 3. AI Summary (新增 hover凸起效果) */}
        <motion.div variants={fadeInUp}>
          {!summary ? (
            <button onClick={generateSummary} disabled={isGenerating || reviews.length === 0} className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl font-bold shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-lg hover:-translate-y-1.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex justify-center items-center gap-2 text-sm duration-300">
              {isGenerating ? "AI is Analyzing..." : <><span>✨</span> Generate AI Summary</>}
            </button>
          ) : (
            <div className="bg-[#F8FAFC] p-5 rounded-4xl border border-indigo-100 shadow-sm relative overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-center mb-5 relative z-10">
                <h3 className="text-[#312E81] font-black text-lg flex items-center gap-2">
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

              <div className="space-y-3 relative z-10">
                {parsedSummary.en && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-inner">
                    <span className="text-xs font-bold text-blue-500 mb-1.5 flex items-center gap-1.5 tracking-wide">
                      <span className="text-base">🇬🇧</span> English
                    </span>
                    <p className="text-gray-700 text-sm leading-relaxed">{parsedSummary.en}</p>
                  </div>
                )}
                {parsedSummary.ms && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-inner">
                    <span className="text-xs font-bold text-indigo-400 mb-1.5 flex items-center gap-1.5 tracking-wide">
                      <span className="text-base">🇲🇾</span> Bahasa Melayu
                    </span>
                    <p className="text-gray-700 text-sm leading-relaxed">{parsedSummary.ms}</p>
                  </div>
                )}
                {parsedSummary.zh && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-inner">
                    <span className="text-xs font-bold text-teal-500 mb-1.5 flex items-center gap-1.5 tracking-wide">
                      <span className="text-base">🇨🇳</span> 中文
                    </span>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{parsedSummary.zh}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* 4. Review Form (新增 hover凸起效果 + Title变大) */}
        <motion.div variants={fadeInUp} className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
          <h3 className="text-1xl font-extrabold text-gray-900 mb-5 text-center">Review this Subject</h3>
          
          <div className="flex justify-center gap-1.5 mb-5 bg-gray-50 rounded-full p-2 border border-gray-100 shadow-inner">
            {[1, 2, 3, 4, 5].map((s) => (
              <motion.button 
                key={s} 
                onClick={() => setRating(s)} 
                type="button" 
                className="p-1 rounded-full hover:bg-yellow-50 transition-colors"
                whileHover={{ scale: 1.25, transition: { duration: 0.2 } }} 
                whileTap={{ scale: 0.9 }}
              >
                <StarIcon filled={s <= rating} size={36} />
              </motion.button>
            ))}
          </div>
          <textarea
            className="w-full p-4 border border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4 text-sm resize-none shadow-inner"
            rows={3}
            placeholder="Is this subject hard? How's the workload?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl shadow-md hover:bg-black transition-colors">
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </motion.div>

        {/* 5. 👑 Feedback List (包含 hover凸起效果) */}
        <motion.div variants={fadeInUp} className="w-full space-y-4 pt-4">
          <div className="flex justify-between items-end mb-4 px-2">
             <h3 className="text-xl font-extrabold text-gray-900">Feedback</h3>
             <span className="text-sm font-medium text-gray-400">{reviews.length} reviews</span>
          </div>

          {reviews.length === 0 ? (
             <p className="text-gray-400 text-center py-6">No reviews yet. Be the first!</p>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
              {reviews.map((review, i) => {
                const initial = review.student_name ? review.student_name.charAt(0).toUpperCase() : 'S';
                
                return (
                  <motion.div 
                    key={i} 
                    variants={fadeInUp} 
                    className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300"
                  >
                    
                    {/* Header: Avatar, Name, and Stars */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        {/* 浅蓝色字母头像 */}
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                          {initial}
                        </div>
                        <span className="font-extrabold text-gray-900 text-base">
                          {review.student_name || "Student"}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon key={star} filled={star <= review.rating} size={16} />
                        ))}
                      </div>
                    </div>

                    {/* Comment Box: 灰色气泡背景 */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                        {review.comment || "No comment provided."}
                      </p>
                    </div>
                    
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}