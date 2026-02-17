"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";

// 👇 1. 定义 props 类型：多加一个 optional 的 subjectCode
type RequestModalProps = {
  type: "lecturer" | "subject";
  subjectCode?: string; // 问号表示这个并不是必须的 (因为请求加科目时可能没有)
};

export default function RequestModal({ type, subjectCode }: RequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return alert("Please fill in the name!");
    
    setIsSubmitting(true);
    
    // 👇 2. 发送数据时，把 related_code 也带上
    const { error } = await supabase.from("requests").insert([
      { 
        type, 
        name, 
        status: "pending",
        related_code: subjectCode || null // 如果有 code 就存，没有就是 null
      }
    ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Request sent! We will add it soon. 🚀");
      setName("");
      setIsOpen(false);
    }
    
    setIsSubmitting(false);
  }

  return (
    <>
      <div className="mt-8 text-center pb-10">
        <p className="text-gray-400 text-sm mb-2">
          Can't find the {type}?
        </p>
        <button 
          onClick={() => setIsOpen(true)}
          className="text-blue-600 font-bold hover:underline text-sm"
        >
          + Request to add {type}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Request to Add</h3>
            <p className="text-sm text-gray-500 mb-4">
              {/* 👇 3. 提示语变得更智能了 */}
              {subjectCode 
                ? `Enter the missing lecturer's name for ${subjectCode}:` 
                : `Enter the missing ${type}'s name/code:`}
            </p>

            <input
              type="text"
              className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={`E.g. ${type === "lecturer" ? "Dr. Strange" : "SEMM 9999"}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="flex gap-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submit" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}