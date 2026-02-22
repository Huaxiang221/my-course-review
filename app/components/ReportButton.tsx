"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 直接读取环境变量里的 Supabase 链接和钥匙
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setIsSubmitting(true);

    // 把错误信息存进刚刚建的 error_reports 表里
    const { error } = await supabase
      .from("error_reports")
      .insert([{ description }]);

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setDescription("");
      }, 2000);
    } else {
      alert("Failed to send report. Please try again.");
      console.error(error);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      {/* 左下角的悬浮按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-12 h-12 bg-red-50 text-red-600 rounded-full shadow-lg hover:bg-red-100 hover:scale-105 transition-all border border-red-200"
        title="Report an Issue"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4"/><path d="M8 12H3"/><path d="M21 12h-5"/><path d="M9 16H5"/><path d="M19 16h-4"/></svg>
      </button>

      {/* 提交弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">✕</button>
            <h3 className="text-lg font-bold mb-2">Report an Issue 🐞</h3>
            <p className="text-xs text-gray-500 mb-4">Found a bug or missing a lecturer? Let me know!</p>
            
            {success ? (
              <div className="bg-green-50 text-green-600 p-4 rounded-xl text-center font-bold text-sm">
                Report sent successfully! Thank you.
              </div>
            ) : (
              <>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the error or missing lecturer here..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm h-32 mb-4 focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !description.trim()}
                  className="w-full bg-black text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Sending..." : "Submit Report"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}