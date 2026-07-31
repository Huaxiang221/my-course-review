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
  comment_en?: string | null; // ✨ 新增：持久化保存的英文翻译字段
  created_at: string;
  likes: number; 
  report_count: number;
};

// ================= Icon 库 (保持不变) =================
function StarIcon({ filled, size, color = "#FACC15" }: { filled: boolean; size: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "#E5E7EB"} style={{ minWidth: size }} className="transition-colors duration-300">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}

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

function FlagIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.15.743a9 9 0 01-6.105-.712l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  );
}

function OfficeIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>;
}
function UserIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
}
function MailIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
}
function PhoneIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>;
}
function LockLineIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
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
  
  // 🌟 星星打分状态
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [isVIP, setIsVIP] = useState(false);
  
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [sessionReviewIds, setSessionReviewIds] = useState<number[]>([]); 

  const [likedReviews, setLikedReviews] = useState<number[]>([]);
  const [reportedReviews, setReportedReviews] = useState<number[]>([]);

  // ✨ 新增：独立的翻译状态管理
  const [showTranslation, setShowTranslation] = useState<Record<number, boolean>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});

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
        
        if (data) setIsVIP(true); 
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
          if (lec.ai_summary) setSummary(lec.ai_summary);
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
      // ✨ 修改：更新留言时，清除原本已翻译的 comment_en 结果，以保持最新一致
      const res = await supabase.from("reviews")
        .update({ rating, comment, comment_en: null })
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

  // ✨ 新增：处理点击翻译按钮的逻辑
  async function handleTranslateToggle(review: Review) {
    // 场景 1：如果本地或数据库中已经有翻译结果，直接 Toggle 切换显示状态
    if (review.comment_en) {
      setShowTranslation(prev => ({ ...prev, [review.id]: !prev[review.id] }));
      return;
    }

    // 场景 2：尚未翻译，发起 API 请求
    setIsTranslating(prev => ({ ...prev, [review.id]: true }));
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: review.comment }),
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Translation failed");

      const translatedText = data.translatedText;

      // 1. 更新本地状态，使其即时显示
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, comment_en: translatedText } : r));
      setShowTranslation(prev => ({ ...prev, [review.id]: true }));

      // 2. 异步将结果保存回 Supabase，实现持久化缓存 (不 block UI 渲染)
      supabase.from("reviews").update({ comment_en: translatedText }).eq("id", review.id)
        .then(({ error }) => {
          if (error) console.error("Failed to save translation to Supabase:", error);
        });

    } catch (error: any) {
      console.error("Translation Error:", error);
      alert("Error translating comment: " + error.message);
    } finally {
      setIsTranslating(prev => ({ ...prev, [review.id]: false }));
    }
  }

  async function handleLike(reviewId: number, currentLikes: number) {
    if (likedReviews.includes(reviewId)) return; 
    const newLikesCount = (currentLikes || 0) + 1;
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likes: newLikesCount } : r));
    const newLikedArray = [...likedReviews, reviewId];
    setLikedReviews(newLikedArray);
    localStorage.setItem("lecturer_liked_reviews", JSON.stringify(newLikedArray));
    const { error } = await supabase.from("reviews").update({ likes: newLikesCount }).eq("id", reviewId);
    if (error) console.error("Like error:", error);
  }

  async function handleReport(review: Review) {
    if (reportedReviews.includes(review.id)) return alert("You have already reported this comment. 🚩");
    const confirmReport = window.confirm("Are you sure you want to report this comment?\n(Comments receiving 3 reports will be automatically deleted)");
    if (!confirmReport) return;

    const newReportCount = (review.report_count || 0) + 1;
    if (newReportCount >= 3) {
      const { error } = await supabase.from("reviews").delete().eq("id", review.id);
      if (!error) {
        setReviews(prev => prev.filter(r => r.id !== review.id)); 
        alert("This comment has been removed due to multiple reports. 🛡️");
      } else alert("Error removing comment: " + error.message);
    } else {
      const { error } = await supabase.from("reviews").update({ report_count: newReportCount }).eq("id", review.id);
      if (!error) {
        setReviews(prev => prev.map(r => r.id === review.id ? { ...r, report_count: newReportCount } : r));
        const newReportedArray = [...reportedReviews, review.id];
        setReportedReviews(newReportedArray);
        localStorage.setItem("lecturer_reported_reviews", JSON.stringify(newReportedArray));
        alert("Report submitted successfully. Thank you! 🙏");
      } else alert("Error reporting: " + error.message);
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
      if (!response.ok) throw new Error(data.error || "Failed to generate summary");
      const newSummary = data.summary;
      setSummary(newSummary); 

      if (lecturerId) {
          const { error: saveError } = await supabase.from("lecturers").update({ ai_summary: newSummary }).eq("id", lecturerId);
          if (saveError) console.error("Failed to save summary:", saveError);
      }
    } catch (error: any) {
      console.error("Client Error:", error);
      alert("Error: " + error.message);
    }
    setIsGenerating(false);
  }

  // JSON 解析与 Fallback (保持不变)
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

  let parsedTitle = "";
  let realName = lecturer?.name || "";
  if (lecturer?.name) {
    const parts = lecturer.name.split(' ');
    let splitIndex = -1;
    parts.forEach((p, i) => { if (p.includes('.')) splitIndex = i; });
    if (splitIndex !== -1) {
      parsedTitle = parts.slice(0, splitIndex + 1).join(' ');
      realName = parts.slice(splitIndex + 1).join(' ');
    }
  }

  if (!lecturer) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-400 text-sm font-medium">Fetching Profile...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center overflow-x-hidden pb-24">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-6xl mb-8 flex items-center px-2">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-all active:scale-95 shrink-0"
          title="Back"
        >
          <span className="text-lg -mt-0.5">←</span>
        </button>
        <h1 className="flex-1 text-center text-2xl font-extrabold text-blue-900 tracking-tight pr-10">Lecturer Profile</h1>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-start px-2">
        
        {/* 左侧边栏 (讲师信息与打分) */}
        <div className="w-full lg:w-[360px] flex flex-col gap-6 lg:sticky lg:top-8 shrink-0">
          <motion.div variants={fadeInUp} className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <div className="h-28 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-800 rounded-t-[2rem]"></div>
            <div className="px-6 pb-8 relative text-center">
              <div className="absolute -top-14 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 bg-white rounded-full p-[3px] shadow-[0_0_20px_rgba(59,130,246,0.15)] relative">
                  <div className="absolute inset-0 rounded-full border-[3px] border-blue-50"></div>
                  {lecturer.image ? (
                    <img src={lecturer.image} alt={realName} className="w-full h-full object-cover rounded-full relative z-10" />
                  ) : (
                    <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center text-4xl relative z-10">
                      {lecturer.gender === "Female" ? "👩‍🏫" : "👨‍🏫"}
                    </div>
                  )}
                </div>
              </div>
              <div className="h-12"></div>
              <div className="flex flex-col items-center mt-2 px-2">
                {parsedTitle && <span className="text-sm font-semibold text-blue-600/80 mb-1.5">{parsedTitle}</span>}
                <h2 className="text-[22px] font-extrabold text-gray-900 leading-tight tracking-tight">{realName}</h2>
              </div>
              <div className="flex justify-center items-center gap-2 mt-4">
                <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                  <StarIcon filled={true} size={15} color="#EAB308" />
                  <span className="text-sm font-black text-yellow-600">{averageRating}</span>
                </div>
                <span className="text-sm text-gray-500 font-medium tracking-wide">
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              <div className="mt-8 flex flex-col max-w-[260px] mx-auto pl-2 text-left">
                <div className="flex items-start gap-4 py-3.5">
                  <OfficeIcon className="w-[18px] h-[18px] text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-[14px] text-gray-600 font-medium leading-snug break-words">{lecturer.office || "-"}</span>
                </div>
                <div className="border-b border-gray-100 w-full"></div>
                <div className="flex items-center gap-4 py-3.5">
                  <UserIcon className="w-[18px] h-[18px] text-gray-400 shrink-0" />
                  <span className="text-[14px] text-gray-600 font-medium">{lecturer.gender || "-"}</span>
                </div>
                <div className="border-b border-gray-100 w-full"></div>
                <div className="flex items-center gap-4 py-3.5">
                  <MailIcon className="w-[18px] h-[18px] text-gray-400 shrink-0" />
                  <span className="text-[14px] text-gray-600 font-medium truncate">{lecturer.email || "-"}</span>
                </div>
                <div className="border-b border-gray-100 w-full"></div>
                <div className="flex items-center gap-4 py-3.5">
                  <PhoneIcon className="w-[18px] h-[18px] text-gray-400 shrink-0" />
                  <div className="flex items-center gap-2">
                    {lecturer.phone ? (
                      isVIP ? (
                        <span className="text-[14px] text-gray-600 font-medium">{lecturer.phone}</span>
                      ) : (
                        <>
                          <span className="text-[14px] text-gray-400 font-medium tracking-widest">01*-*******</span>
                          <LockLineIcon className="w-[14px] h-[14px] text-gray-300" />
                        </>
                      )
                    ) : (
                      <span className="text-[14px] text-gray-600 font-medium">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div ref={formRef} variants={fadeInUp} className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6 text-center">
              {editingReviewId ? "Edit Your Review" : "Review this Lecturer"}
            </h3>
            <div className="flex justify-center gap-3 mb-6 p-1">
              {[1, 2, 3, 4, 5].map((s) => {
                const isActive = s <= (hoverRating || rating);
                return (
                  <motion.button 
                    key={s} onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} type="button" className="relative outline-none rounded-full"
                    animate={{ scale: isActive ? 1.15 : 1 }} whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]' : 'drop-shadow-none'}`}>
                      <StarIcon filled={isActive} size={36} color="#FACC15" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <textarea
              className="w-full p-4.5 border border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 mb-5 text-sm resize-none shadow-inner leading-relaxed transition-all"
              rows={4} placeholder="How is their teaching style? Are they helpful?" value={comment} onChange={(e) => setComment(e.target.value)}
            />
            <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 hover:bg-gray-800 transition-all duration-300">
              {isSubmitting ? "Saving..." : (editingReviewId ? "Update Review" : "Submit Review")}
            </button>
            {editingReviewId && (
              <button onClick={cancelEdit} disabled={isSubmitting} className="w-full mt-3 py-3.5 bg-white text-gray-500 font-bold rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-800 transition-colors">
                Cancel Edit
              </button>
            )}
          </motion.div>
        </div>

        {/* 右侧主内容区 (AI Summary + 评价列表) */}
        <div className="flex-1 w-full flex flex-col gap-6 min-w-0">
          <motion.div variants={fadeInUp}>
            {!summary ? (
              <button onClick={generateSummary} disabled={isGenerating || reviews.length === 0} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-[2rem] font-bold shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex justify-center items-center gap-2 text-base duration-300">
                {isGenerating ? "AI is Analyzing..." : <><span>✨</span> Generate AI Summary</>}
              </button>
            ) : (
              <div className="bg-[#F8FAFC] p-6 rounded-[2rem] border border-indigo-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-[#312E81] font-black text-xl flex items-center gap-2">
                    <motion.span animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="inline-block">✨</motion.span> Lecturer Summary
                  </h3>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-indigo-600 tracking-wider">AI GENERATED</span>
                  </div>
                </div>
                <div className="space-y-4 relative z-10">
                  {parsedSummary.en && (
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-inner">
                      <span className="text-sm font-bold text-blue-500 mb-2 flex items-center gap-1.5 tracking-wide"><span className="text-base">🇬🇧</span> English</span>
                      <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">{parsedSummary.en}</p>
                    </div>
                  )}
                  {parsedSummary.ms && (
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-inner">
                      <span className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-1.5 tracking-wide"><span className="text-base">🇲🇾</span> Bahasa Melayu</span>
                      <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">{parsedSummary.ms}</p>
                    </div>
                  )}
                  {parsedSummary.zh && (
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-inner">
                      <span className="text-sm font-bold text-teal-500 mb-2 flex items-center gap-1.5 tracking-wide"><span className="text-base">🇨🇳</span> 中文</span>
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

          <motion.div variants={fadeInUp} className="w-full space-y-5 mt-2">
            <div className="flex items-center gap-3 mb-2 px-2">
               <h3 className="text-2xl font-extrabold text-gray-900">Student Feedback</h3>
               <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                 {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
               </span>
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
                  
                  // 判断当前是否处于展示翻译状态
                  const isShowingTranslation = showTranslation[review.id];
                  // 展示的文本内容
                  const displayComment = isShowingTranslation && review.comment_en 
                    ? review.comment_en 
                    : review.comment || "No comment provided.";
                  
                  return (
                    <motion.div 
                      key={i} variants={fadeInUp} 
                      className={`bg-white p-6 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border ${editingReviewId === review.id ? 'border-blue-400 shadow-md ring-2 ring-blue-50' : 'border-gray-100 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]'} transition-all duration-300 flex flex-col`}
                    >
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                            {initial}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-gray-900 text-[17px]">
                              {review.student_name || "Anonymous Student"}
                            </span>
                            <span className="text-xs text-gray-400 font-medium mt-1">
                              {new Date(review.created_at).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex gap-1 bg-yellow-50 px-2.5 py-1.5 rounded-full border border-yellow-100 shadow-sm">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon key={star} filled={star <= review.rating} size={16} color="#EAB308" />
                            ))}
                          </div>
                          
                          {canEdit && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-gray-400 hidden sm:block">
                                * Editable before refresh
                              </span>
                              <button onClick={() => handleEditClick(review)} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100">
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex-grow shadow-inner">
                        {/* 留言内容展示 */}
                        <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">
                          {displayComment}
                        </p>

                        {/* ✨ 新增：独立的 Translate to English 按钮 */}
                        {review.comment && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => handleTranslateToggle(review)}
                              disabled={isTranslating[review.id]}
                              className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="text-sm">🌐</span>
                              {isTranslating[review.id] 
                                ? "Translating..." 
                                : (isShowingTranslation 
                                    ? "Show Original" 
                                    : (review.comment_en ? "Show Translation" : "Translate to English"))}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end items-center mt-4 gap-3">
                        <button 
                          onClick={() => handleReport(review)} disabled={isReported}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${isReported ? "bg-red-50 text-red-400 border border-red-100 cursor-default" : "bg-white text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm"}`}
                        >
                          <FlagIcon className="w-3.5 h-3.5" />
                          <span>{isReported ? "Reported" : "Report"}</span>
                        </button>
                        <button 
                          onClick={() => handleLike(review.id, currentLikes)} disabled={isLiked}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${isLiked ? "bg-blue-50 text-blue-600 border border-blue-100 cursor-default" : "bg-white text-gray-400 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm"}`}
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