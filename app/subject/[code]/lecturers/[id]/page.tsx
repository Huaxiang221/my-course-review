"use client";

import { useEffect, useState, useRef } from "react";
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
  likes: number; 
  report_count: number;
};

// 星星图标组件
function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} height={size} viewBox="0 0 24 24" 
      fill={filled ? "#FACC15" : "#E5E7EB"} style={{ minWidth: size }} className="transition-colors duration-300"
    >
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}

// 大拇指图标组件
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

// 举报图标组件
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

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const lecturerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const formRef = useRef<HTMLDivElement>(null); 

  const [lecturer, setLecturer] = useState<Lecturer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [isVIP, setIsVIP] = useState(false);
  
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [sessionReviewIds, setSessionReviewIds] = useState<number[]>([]); 

  const [likedReviews, setLikedReviews] = useState<number[]>([]);
  const [reportedReviews, setReportedReviews] = useState<number[]>([]);

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

    const savedLikes = localStorage.getItem("lecturer_liked_reviews");
    if (savedLikes) setLikedReviews(JSON.parse(savedLikes));

    const savedReports = localStorage.getItem("lecturer_reported_reviews");
    if (savedReports) setReportedReviews(JSON.parse(savedReports));
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
    let error;

    if (editingReviewId) {
      const res = await supabase.from("reviews")
        .update({ rating, comment })
        .eq("id", editingReviewId);
      error = res.error;
    } else {
      const res = await supabase.from("reviews")
        .insert([{ lecturer_id: lecturerId, rating, comment, student_name: "Anonymous Student" }])
        .select();
      
      error = res.error;

      if (res.data && res.data.length > 0) {
        setSessionReviewIds(prev => [...prev, res.data[0].id]);
        
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
      }
    }

    if (!error) {
      await supabase.from("lecturers").update({ ai_summary: null }).eq("id", lecturerId);
      const { data } = await supabase.from("reviews").select("*").eq("lecturer_id", lecturerId).order("created_at", { ascending: false });
      setReviews(data || []);
      setRating(0); 
      setComment("");
      setSummary(""); 
      setEditingReviewId(null); 
    } else {
      alert("Error: " + error.message);
    }
    setIsSubmitting(false);
  }

  async function handleLike(reviewId: number, currentLikes: number) {
    if (likedReviews.includes(reviewId)) return; 

    const newLikesCount = (currentLikes || 0) + 1;

    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likes: newLikesCount } : r));
    
    const newLikedArray = [...likedReviews, reviewId];
    setLikedReviews(newLikedArray);
    localStorage.setItem("lecturer_liked_reviews", JSON.stringify(newLikedArray));

    const { error } = await supabase
      .from("reviews")
      .update({ likes: newLikesCount })
      .eq("id", reviewId);

    if (error) console.error("Like error:", error);
  }

  async function handleReport(review: Review) {
    if (reportedReviews.includes(review.id)) {
      return alert("You have already reported this comment. 🚩");
    }

    const confirmReport = window.confirm("Are you sure you want to report this comment?\n(Comments receiving 3 reports will be automatically deleted)");
    if (!confirmReport) return;

    const newReportCount = (review.report_count || 0) + 1;

    if (newReportCount >= 3) {
      const { error } = await supabase.from("reviews").delete().eq("id", review.id);
      
      if (!error) {
        setReviews(prev => prev.filter(r => r.id !== review.id)); 
        alert("This comment has been removed due to multiple reports. 🛡️");
      } else {
        alert("Error removing comment: " + error.message);
      }
    } else {
      const { error } = await supabase.from("reviews")
        .update({ report_count: newReportCount })
        .eq("id", review.id);

      if (!error) {
        setReviews(prev => prev.map(r => r.id === review.id ? { ...r, report_count: newReportCount } : r));
        
        const newReportedArray = [...reportedReviews, review.id];
        setReportedReviews(newReportedArray);
        localStorage.setItem("lecturer_reported_reviews", JSON.stringify(newReportedArray));
        
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
      
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md mb-6 pt-4 flex items-center">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-blue-600 transition-colors font-medium group flex items-center gap-2">
           <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
        </button>
        <h1 className="flex-1 text-center text-xl font-extrabold text-blue-900 tracking-tight">Lecturer Profile</h1>
        <div className="w-16"></div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-md space-y-6">
        
        {/* 1. 讲师名片 */}
        <motion.div variants={fadeInUp} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 w-full max-w-md relative overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
          <div className="h-24 bg-linear-to-r from-blue-600 to-indigo-500"></div>
          
          <div className="px-6 pb-6 -mt-12">
            
            <div className="mb-4">
              <div className="w-24 h-24 bg-white rounded-3xl p-1.5 shadow-md z-10 relative border border-gray-100">
                {/* 🌟 移除 isVIP 限制，所有人都能看到照片或 Emoji */}
                {lecturer.image ? (
                  <img src={lecturer.image} alt={lecturer.name} className="w-full h-full object-cover rounded-2xl bg-gray-100" />
                ) : (
                  <div className="w-full h-full bg-blue-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                    {lecturer.gender === "Female" ? "👩‍🏫" : "👨‍🏫"}
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-3 wrap-break-word leading-tight px-1">{lecturer.name}</h2>
            
            <div className="flex items-center gap-3 mb-5 px-1">
              <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-200 shadow-sm">
                <StarIcon filled={true} size={16} />
                <span className="text-base font-black text-yellow-700">{averageRating}</span>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{reviews.length} Reviews</span>
            </div>

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
              
              <div className="grid grid-cols-[65px_1fr] items-center">
                <span className="font-bold text-gray-400 uppercase tracking-wider">Phone</span>
                {/* 🔒 手机号仍然需要 VIP 才能看到完整版 */}
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
        <motion.div ref={formRef} variants={fadeInUp} className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-extrabold text-gray-900 mb-5 text-center">
            {editingReviewId ? "Edit Your Review" : "Review this Lecturer"}
          </h3>
          
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

        {/* 4. Feedback List */}
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
                const canEdit = sessionReviewIds.includes(review.id);
                
                // 状态检查
                const isLiked = likedReviews.includes(review.id);
                const currentLikes = review.likes || 0;
                const isReported = reportedReviews.includes(review.id);
                
                return (
                  <motion.div 
                    key={i} 
                    variants={fadeInUp} 
                    className={`bg-white p-5 rounded-3xl shadow-sm border ${editingReviewId === review.id ? 'border-blue-400 shadow-md ring-2 ring-blue-50' : 'border-gray-100 hover:-translate-y-1.5 hover:shadow-lg'} transition-all duration-300 flex flex-col`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                          {initial}
                        </div>
                        <span className="font-extrabold text-gray-900 text-base">
                          {review.student_name || "Anonymous Student"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon key={star} filled={star <= review.rating} size={14} />
                          ))}
                        </div>
                        
                        {canEdit && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-gray-400 hidden sm:block">
                              * Editable before refresh
                            </span>
                            <button 
                              onClick={() => handleEditClick(review)}
                              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-grow">
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                        {review.comment || "No comment provided."}
                      </p>
                    </div>

                    {/* 🌟 互动动作栏：举报 + 点赞 */}
                    <div className="flex justify-end items-center mt-3 gap-3 pr-1">
                      
                      {/* Report Button */}
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

                      {/* Like Button */}
                      <button 
                        onClick={() => handleLike(review.id, currentLikes)}
                        disabled={isLiked}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          isLiked 
                            ? "bg-blue-50 text-blue-600 border border-blue-100 cursor-default" 
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

      </motion.div>
    </div>
  );
}