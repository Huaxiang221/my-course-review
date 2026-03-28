"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";

type Lecturer = {
  id: number;
  name: string;
  image: string | null;
  office: string;
  gender: string;
  phone: string;
  email: string;
  ai_summary: string | null;
  subject_code: string; 
};

type Review = {
  id: number;
  student_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

// 星星图标组件
function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} height={size} viewBox="0 0 24 24" 
      fill={filled ? "#FACC15" : "#E5E7EB"} style={{ minWidth: size }}
    >
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

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const lecturerId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [lecturer, setLecturer] = useState<Lecturer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [isVIP, setIsVIP] = useState(false);

  // 自动计算平均分
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

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
          setIsVIP(true); 
        }
      }
    }
    checkVIPStatus();
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!lecturerId) return;
      try {
        const { data: lec } = await supabase.from("lecturers").select("*").eq("id", lecturerId).single();
        if (lec) {
          setLecturer(lec);
          if (lec.ai_summary) {
            setSummary(lec.ai_summary);
          }
        }

        const { data: rev } = await supabase.from("reviews").select("*").eq("lecturer_id", lecturerId).order("created_at", { ascending: false });
        if (rev) setReviews(rev);
      } catch (e) {
        console.error("Fetch error:", e);
      }
    }
    fetchData();
  }, [lecturerId]);

  async function handleSubmit() {
    if (rating === 0) { alert("Please give a star rating! ⭐"); return; }
    if (!lecturerId || !lecturer) return; 

    setIsSubmitting(true);
    
    const { error } = await supabase.from("reviews").insert([{
      lecturer_id: lecturerId, rating, comment, student_name: "Anonymous Student",
    }]);

    if (!error) {
      await supabase.from("lecturers").update({ ai_summary: null }).eq("id", lecturerId);

      // 🤖 Telegram Notification Trigger
      fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lecturerName: lecturer.name,
          courseCode: lecturer.subject_code,
          comment: comment,
          rating: rating
        }),
      }).catch(err => console.error("Failed to trigger Telegram:", err));

      const { data } = await supabase.from("reviews").select("*").eq("lecturer_id", lecturerId).order("created_at", { ascending: false });
      setReviews(data || []);
      setRating(0); setComment("");
      setSummary(""); 
    } else {
      alert("Error: " + error.message);
    }
    setIsSubmitting(false);
  }

  async function generateSummary() {
    if (reviews.length === 0) return alert("No reviews yet!");
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
          courseCode: lecturer?.name || "the lecturer"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      const newSummary = data.summary;
      setSummary(newSummary); 

      if (lecturerId) {
          const { error: saveError } = await supabase
            .from("lecturers")
            .update({ ai_summary: newSummary }) 
            .eq("id", lecturerId);
            
          if (saveError) console.error("Failed to save summary:", saveError);
      }
    } catch (error: any) {
      console.error("Client Error:", error);
      alert("Error: " + error.message);
    }
    setIsGenerating(false);
  }

  // 解析 AI 的 JSON 返回
  let parsedSummary = { en: "", ms: "", zh: "" };
  if (summary) {
    try {
      parsedSummary = JSON.parse(summary);
    } catch {
      parsedSummary = { en: summary, ms: "", zh: "" };
    }
  }

  if (!lecturer) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-400 text-sm font-medium">Fetching Profile...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center overflow-hidden pb-24">
      
      {/* 顶部导航 */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md mb-6 pt-4 flex items-center">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-blue-600 transition-colors font-medium group flex items-center gap-2">
           <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
        </button>
        <h1 className="flex-1 text-center text-xl font-extrabold text-blue-900 tracking-tight">Lecturer Profile</h1>
        <div className="w-16"></div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-md space-y-6">
        
        {/* 1. 讲师名片 (完美重构版) */}
        <motion.div variants={fadeInUp} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 w-full max-w-md relative overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
          <div className="h-24 bg-linear-to-r from-blue-600 to-indigo-500"></div>
          
          <div className="px-6 pb-6 -mt-12">
            
            {/* 👑 纯净的头像区：不再有浮动的数字抢戏 */}
            <div className="mb-4">
              <div className="w-24 h-24 bg-white rounded-3xl p-1.5 shadow-md z-10 relative border border-gray-100">
                {isVIP ? (
                  lecturer.image ? (
                     <img src={lecturer.image} alt={lecturer.name} className="w-full h-full object-cover rounded-2xl bg-gray-100" />
                  ) : (
                     <div className="w-full h-full bg-blue-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                       {lecturer.gender === "Female" ? "👩‍🏫" : "👨‍🏫"}
                     </div>
                  )
                ) : (
                  <div className="w-full h-full bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-300 text-xs font-bold border border-gray-100 shadow-inner">
                     <span className="text-2xl mb-1">🔒</span>
                  </div>
                )}
              </div>
            </div>

            {/* 名字区域 */}
            <h2 className="text-2xl font-black text-gray-900 mb-3 wrap-break-word leading-tight px-1">{lecturer.name}</h2>
            
            {/* ✨ 全新设计的评分徽章：放置在名字下方，精致且不突兀 */}
            <div className="flex items-center gap-3 mb-5 px-1">
              <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-200 shadow-sm">
                <StarIcon filled={true} size={16} />
                <span className="text-base font-black text-yellow-700">{averageRating}</span>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{reviews.length} Reviews</span>
            </div>

            {/* 讲师详细信息 */}
            <div className="bg-gray-50/70 rounded-2xl p-4 space-y-2.5 border border-gray-100 text-xs shadow-inner">
              <div className="grid grid-cols-[65px_1fr] items-center">
                <span className="font-bold text-gray-400 uppercase tracking-wider">Office</span>
                <span className="text-gray-700 font-medium truncate">: {lecturer.office || "-"}</span>
              </div>
              <div className="grid grid-cols-[65px_1fr] items-center">
                <span className="font-bold text-gray-400 uppercase tracking-wider">Gender</span>
                <span className="text-gray-700 font-medium truncate">: {lecturer.gender || "-"}</span>
              </div>
              <div className="grid grid-cols-[65px_1fr] items-center">
                <span className="font-bold text-gray-400 uppercase tracking-wider">Email</span>
                <span className="text-gray-700 font-medium truncate">: {lecturer.email || "-"}</span>
              </div>
              
              {/* 🔒 电话打码区 */}
              <div className="grid grid-cols-[65px_1fr] items-center">
                <span className="font-bold text-gray-400 uppercase tracking-wider">Phone</span>
                {lecturer.phone ? (
                  isVIP ? (
                    <span className="text-gray-700 font-medium truncate">: {lecturer.phone}</span>
                  ) : (
                    <span className="text-gray-400 font-medium italic truncate">: 01*-******* 🔒</span>
                  )
                ) : (
                  <span className="text-gray-700 font-medium truncate">: -</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. AI Summary */}
        <motion.div variants={fadeInUp}>
          {!summary ? (
            <button 
              onClick={generateSummary}
              disabled={isGenerating || reviews.length === 0}
              className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl font-bold shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-lg hover:-translate-y-1.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex justify-center items-center gap-2 text-sm duration-300"
            >
              {isGenerating ? "AI is Analyzing..." : <><span>✨</span> Generate AI Summary</>}
            </button>
          ) : (
            <div className="bg-[#F8FAFC] p-5 rounded-4xl border border-indigo-100 shadow-sm relative overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-center mb-5 relative z-10">
                <h3 className="text-[#312E81] font-black text-lg flex items-center gap-2">
                  <motion.span animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="inline-block">✨</motion.span> 
                  Lecturer Summary
                </h3>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-indigo-600 tracking-wider">AI GENERATED</span>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                {parsedSummary.en && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-inner">
                    <span className="text-xs font-bold text-blue-500 mb-1.5 flex items-center gap-1.5 tracking-wide"><span className="text-base">🇬🇧</span> English</span>
                    <p className="text-gray-700 text-sm leading-relaxed">{parsedSummary.en}</p>
                  </div>
                )}
                {parsedSummary.ms && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-inner">
                    <span className="text-xs font-bold text-indigo-400 mb-1.5 flex items-center gap-1.5 tracking-wide"><span className="text-base">🇲🇾</span> Bahasa Melayu</span>
                    <p className="text-gray-700 text-sm leading-relaxed">{parsedSummary.ms}</p>
                  </div>
                )}
                {parsedSummary.zh && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-inner">
                    <span className="text-xs font-bold text-teal-500 mb-1.5 flex items-center gap-1.5 tracking-wide"><span className="text-base">🇨🇳</span> 中文</span>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{parsedSummary.zh}</p>
                  </div>
                )}
                {/* 兼容旧数据展示 */}
                {!parsedSummary.en && !parsedSummary.ms && !parsedSummary.zh && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-inner">
                     <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* 3. Review Form */}
        <motion.div variants={fadeInUp} className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
          <h3 className="text-1xl font-extrabold text-gray-900 mb-5 text-center">Review this Lecturer</h3>
          
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
            placeholder="How is their teaching style? Are they helpful?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl shadow-md hover:bg-black transition-colors">
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </motion.div>

        {/* 4. Feedback List (Card-in-Card Design) */}
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