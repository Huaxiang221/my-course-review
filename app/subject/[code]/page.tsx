"use client";

import { useParams, useRouter } from "next/navigation";
// 👇 1. 引入刚才写的 Request 组件
import RequestModal from "@/app/components/RequestModal";

export default function SubjectSelection() {
  const params = useParams();
  const router = useRouter();
  // 这里的 subjectCode 就是 URL 里的 "SEMM1203"
  const subjectCode = params.code ? decodeURIComponent(params.code as string) : "Unknown";

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-md flex items-center mb-10">
        <button 
          onClick={() => router.back()} 
          className="text-gray-500 hover:text-gray-800 transition-colors font-medium"
        >
          ← Back
        </button>
        <h1 className="flex-1 text-center text-2xl font-bold text-blue-900 tracking-tight">
          {subjectCode}
        </h1>
        <div className="w-10"></div> 
      </div>

      <div className="w-full max-w-md space-y-4">
        
        {/* 1. 跳转到讲师列表 (Lecturers) */}
        <button 
          onClick={() => router.push(`/subject/${subjectCode}/lecturers`)}
          className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              👨‍🏫
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition-colors">Lecturers</h3>
              <p className="text-xs text-gray-400 font-medium">Rate & Review</p>
            </div>
          </div>
          <span className="text-gray-300 text-xl group-hover:text-blue-500 transition-colors">➔</span>
        </button>

        {/* 2. 跳转到课程详情 (About Course) */}
        <button 
          onClick={() => router.push(`/subject/${subjectCode}/course`)}
          className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-green-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              📚
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors">About Course</h3>
              <p className="text-xs text-gray-400 font-medium">Info & AI Summary</p>
            </div>
          </div>
          <span className="text-gray-300 text-xl group-hover:text-green-500 transition-colors">➔</span>
        </button>

      </div>

      {/* 👇 2. 在这里加入 Request Modal */}
      {/* 这里的 type="lecturer" 意思是：在这个页面，主要的缺失请求通常是请求加“老师” */}
      {/* 我们把 subjectCode 传进去，这样请求里就会自动带上 "SEMM1203" */}
      <div className="mt-8">
        <RequestModal type="lecturer" subjectCode={subjectCode} />
      </div>

    </div>
  );
}