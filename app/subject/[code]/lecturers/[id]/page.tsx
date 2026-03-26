"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter, useParams } from "next/navigation";

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
    if (!lecturerId || !lecturer) return; // 确保 lecturer 数据存在

    setIsSubmitting(true);
    
    const { error } = await supabase.from("reviews").insert([{
      lecturer_id: lecturerId, rating, comment, student_name: "Anonymous Student",
    }]);

    if (!error) {
      alert("Review submitted! 🎉");
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
        body: JSON.stringify({ reviewsText }),
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
          else console.log("Summary saved to database!");
      }

    } catch (error: any) {
      console.error("Client Error:", error);
      alert("Error: " + error.message);
    }
    
    setIsGenerating(false);
  }

  if (!lecturer) return <div className="p-10 text-center text-gray-400">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center text-gray-800">
      
      <div className="w-full max-w-md mb-4 text-left">
        <button 
          onClick={() => router.back()} 
          className="text-blue-600 font-medium flex items-center gap-1"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-md border border-gray-100 w-full max-w-md mb-8 relative overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400"></div>
        <div className="px-6 pb-6 -mt-12 grid grid-cols-[100px_1fr] gap-6">
          
          {/* 🔒 照片打码区 */}
          <div className="w-24 h-24 bg-white rounded-2xl p-1.5 shadow-lg z-10 relative">
            {isVIP ? (
              lecturer.image ? (
                 <img src={lecturer.image} alt={lecturer.name} className="w-full h-full object-cover rounded-xl bg-gray-100" />
              ) : (
                 <div className="w-full h-full bg-blue-50 rounded-xl flex items-center justify-center text-5xl">
                   {lecturer.gender === "Female" ? "👩‍🏫" : "👨‍🏫"}
                 </div>
              )
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 text-xs font-bold">
                 <span className="text-xl mb-1">🔒</span>
              </div>
            )}
          </div>

          <div className="pt-14 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 mb-3 break-words leading-tight">{lecturer.name}</h2>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 border border-gray-100 text-xs">
              <div className="grid grid-cols-[60px_1fr] items-center">
                <span className="font-bold text-gray-400 uppercase tracking-wider">Office</span>
                <span>: {lecturer.office || "-"}</span>
              </div>
              <div className="grid grid-cols-[60px_1fr] items-center">
                <span className="font-bold text-gray-400 uppercase tracking-wider">Gender</span>
                <span>: {lecturer.gender || "-"}</span>
              </div>
              <div className="grid grid-cols-[60px_1fr] items-center">
                <span className="font-bold text-gray-400 uppercase tracking-wider">Email</span>
                <span className="truncate">: {lecturer.email || "-"}</span>
              </div>
              
              {/* 🔒 电话打码区 (修复排版) */}
              <div className="grid grid-cols-[60px_1fr] items-center">
                <span className="font-bold text-gray-400 uppercase tracking-wider">Phone</span>
                {lecturer.phone ? (
                  isVIP ? (
                    <span>: {lecturer.phone}</span>
                  ) : (
                    <span className="text-gray-400 italic">: 01*-******* 🔒</span>
                  )
                ) : (
                  <span>: -</span>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mb-8">
        {!summary ? (
          <button 
            onClick={generateSummary}
            disabled={isGenerating}
            className="w-full bg-indigo-600 text-white p-3 rounded-2xl font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {isGenerating ? "✨ Analyzing..." : "✨ Summarize Reviews with AI"}
          </button>
        ) : (
          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm relative">
            <h3 className="text-indigo-800 font-bold text-sm mb-2">✨ AI Summary</h3>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
            <div className="mt-3 flex gap-4 text-xs">
                <span className="text-gray-400 italic">Saved from last analysis</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md mb-8">
        <h3 className="font-bold text-gray-700 mb-4 text-center">Rate & Review</h3>
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} type="button">
              <StarIcon filled={s <= rating} size={36} />
            </button>
          ))}
        </div>
        <textarea
          className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-sm"
          rows={3}
          placeholder="How was the class?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700">
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      <div className="w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-700 mb-4 px-2">Past Reviews ({reviews.length})</h3>
        <div className="space-y-3">
          {reviews.map((review, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-gray-800 text-sm">{review.student_name}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} filled={star <= review.rating} size={14} />)}
                </div>
              </div>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{review.comment}</p>
              <p className="text-xs text-gray-300 mt-2 text-right">{new Date(review.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}