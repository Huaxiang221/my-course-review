"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter, useParams } from "next/navigation";
// 引入图表组件
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// 定义数据类型
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
  rating: number; // 评分 (1-5)
  comment: string;
  created_at: string;
};

// 图表配色
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// 星星组件
function StarIcon({ filled, size, half = false }: { filled: boolean; size: number; half?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FACC15" : "#E5E7EB"} style={{ minWidth: size }}>
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}

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

  // 新增：计算出的平均分
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  useEffect(() => {
    async function fetchData() {
      if (!subjectCode) return;
      
      // 1. 获取课程信息
      const { data: courseData ,error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("code", subjectCode)
        .single();

        console.log("Current Code:", subjectCode);
        console.log("Database Response:", courseData);
        console.log("Database Error:", courseError);
        
      if (courseData) {
        setCourse(courseData);
        if (courseData.ai_summary) setSummary(courseData.ai_summary);
      }

      // 2. 获取所有评论 (用于计算平均分)
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
      alert("Review submitted!");
      // 清空旧总结
      await supabase.from("courses").update({ ai_summary: null }).eq("code", subjectCode);
      // 刷新数据
      const { data } = await supabase.from("course_reviews").select("*").eq("subject_code", subjectCode).order("created_at", { ascending: false });
      setReviews(data || []);
      setRating(0); setComment(""); setSummary("");
    } else {
      alert("Error: " + error.message);
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
        body: JSON.stringify({ reviewsText }),
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

  if (!course) return (
    <div className="p-10 text-center">
      <p className="text-gray-400">Loading course data...</p>
      <button onClick={() => router.back()} className="mt-4 text-blue-500">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center text-gray-800">
      
      {/* 顶部导航 */}
      <div className="w-full max-w-md mb-6 flex items-center">
        <button onClick={() => router.back()} className="text-gray-500 font-medium">← Back</button>
        <h1 className="flex-1 text-center text-xl font-bold text-blue-900">About Course</h1>
        <div className="w-10"></div>
      </div>

      {/* 1. 课程核心信息 + 总评分卡片 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 w-full max-w-md mb-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
        
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 font-bold shadow-sm">
          📚
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{course.code}</h2>
        <h3 className="text-gray-600 font-medium mb-4">{course.name}</h3>
        
        {/* ⭐ Overall Rating 展示区 (新增) ⭐ */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4 inline-flex items-center gap-3 border border-gray-100">
          <div className="flex items-center gap-1">
             <span className="text-3xl font-bold text-gray-800">{averageRating}</span>
             <span className="text-xs text-gray-400 self-end mb-1">/ 5.0</span>
          </div>
          <div className="h-8 w-[1px] bg-gray-200"></div>
          <div className="text-left">
            <div className="flex text-yellow-400 text-sm">
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s}>{s <= Math.round(Number(averageRating)) ? "★" : "☆"}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400">{reviews.length} Student Reviews</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed px-2">{course.description || "No description provided."}</p>
      </div>

      {/* 2. 📊 Marks Distribution Pie Chart (分数分布图) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 w-full max-w-md mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">Marks Distribution</h3>
        <p className="text-xs text-gray-400 text-center mb-4">Weightage of assessments</p>
        
        {course.marks_distribution ? (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={course.marks_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60} // 变成甜甜圈形状，更现代
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {course.marks_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">No marks data available yet.</p>
          </div>
        )}
      </div>

      {/* 3. AI Summary */}
      <div className="w-full max-w-md mb-8">
        {!summary ? (
          <button onClick={generateSummary} disabled={isGenerating} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-2xl font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
            {isGenerating ? "✨ AI is Analyzing..." : "✨ Summarize Feedback with AI"}
          </button>
        ) : (
          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm relative">
            <div className="absolute top-4 right-4 text-xs bg-white px-2 py-1 rounded-full text-indigo-400 border border-indigo-100">AI Generated</div>
            <h3 className="text-indigo-800 font-bold text-sm mb-2">✨ Course Summary</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
          </div>
        )}
      </div>

      {/* 4. Review Form & List */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md mb-8">
        <h3 className="font-bold text-gray-700 mb-4 text-center">Review this Subject</h3>
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} type="button" className="hover:scale-110 transition-transform">
              <StarIcon filled={s <= rating} size={36} />
            </button>
          ))}
        </div>
        <textarea
          className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-sm"
          rows={3}
          placeholder="Is this subject hard? How's the workload?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-2.5 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-black transition-colors">
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>

      <div className="w-full max-w-md space-y-3">
        <h3 className="text-lg font-bold text-gray-700 px-2 flex justify-between items-center">
          Feedback 
          <span className="text-sm font-normal text-gray-400">{reviews.length} reviews</span>
        </h3>
        {reviews.length === 0 ? <p className="text-gray-400 text-center py-4">No reviews yet. Be the first!</p> : null}
        {reviews.map((review, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-gray-800 text-sm">Student</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} filled={star <= review.rating} size={14} />)}
              </div>
            </div>
            <p className="text-gray-600 text-sm">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}