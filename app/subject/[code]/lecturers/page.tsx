"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useParams, useRouter } from "next/navigation";

// 👇 1. 更新类型定义：加上 image 和 gender
type Review = { rating: number };
type Lecturer = { 
  id: number; 
  name: string; 
  subject_code: string;
  image: string | null; 
  gender: string;       
  reviews: Review[];
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

  // 新增：专门用来检查 VIP 身份的 useEffect
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

  useEffect(() => {
    async function fetchLecturersAndReviews() {
      // select("*") 会自动把 image 和 gender 都抓回来
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
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      
      <div className="w-full max-w-md flex items-center mb-8">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 transition-colors font-medium">← Back</button>
        <h1 className="flex-1 text-center text-xl font-bold text-blue-900">Lecturers</h1>
        <div className="w-10"></div>
      </div>

      <div className="w-full max-w-md space-y-4">
        {loading ? (
          <p className="text-center text-gray-400 py-10">Loading...</p>
        ) : lecturers.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-2xl shadow-sm border border-gray-100">
             <div className="text-4xl mb-3">👻</div>
             <p className="text-gray-500 font-medium">No lecturers found.</p>
          </div>
        ) : (
          lecturers.map((lec) => {
            const averageRating = calculateAverage(lec.reviews);
            const reviewCount = lec.reviews?.length || 0;

            return (
              <div 
                key={lec.id} 
                onClick={() => router.push(`/subject/${subjectCode}/lecturers/${lec.id}`)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4 hover:shadow-md transition-all cursor-pointer group"
              >
                
                <div className="flex items-center gap-4 overflow-hidden">
                  {/* 👇👇👇 这里是核心修改：头像显示逻辑 👇👇👇 */}
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50 shadow-sm relative">
                    {isVIP ? (
                      // 👑 VIP 视角：显示真实图片或性别头像
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
                      // 🔒 普通人视角：只显示一把锁
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="text-xl">🔒</span>
                      </div>
                    )}
                  </div>
                  {/* 👆👆👆 修改结束 👆👆👆 */}

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

                <div className="text-gray-300 group-hover:text-blue-500 transition-colors pr-2">
                  ➔
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}