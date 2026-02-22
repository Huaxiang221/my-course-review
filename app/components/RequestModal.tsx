"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 初始化 Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 接收来自 page.tsx 传过来的 type 和 subjectCode
export default function RequestModal({ type, subjectCode }: { type: string, subjectCode: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // 表单状态 (Form States)
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [office, setOffice] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);

    // 将数据存入 Supabase 的 lecturer_requests 表
    const { error } = await supabase.from("lecturer_requests").insert([
      {
        course_code: subjectCode, // 使用传进来的 subjectCode (例如 SEMM1203)
        name: name.trim(),
        gender: gender || null, // 如果没填，就存为 null
        office: office.trim() || null,
        phone_number: phone.trim() || null,
        email: email.trim() || null,
      },
    ]);

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        // 清空表单
        setName("");
        setGender("");
        setOffice("");
        setPhone("");
        setEmail("");
      }, 2000);
    } else {
      alert("Failed to submit request. Please try again.");
      console.error(error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="text-center">
      <p className="text-sm text-gray-400 mb-2">Can't find the lecturer?</p>
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 font-bold hover:underline transition-all"
      >
        + Request to add lecturer
      </button>

      {/* 弹窗 (Modal) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative text-left shadow-2xl">
            
            {/* 关闭按钮 */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
            
            <h3 className="text-xl font-bold mb-1">Request New Lecturer</h3>
            <p className="text-xs text-gray-500 mb-5">
              Adding details helps me update the database faster! (Only name is required)
            </p>

            {success ? (
              <div className="bg-green-50 text-green-600 p-4 rounded-xl text-center font-bold text-sm">
                Request sent successfully! I will add them soon.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Name - 必填 */}
                <div>
                  <label className="text-xs font-bold text-gray-700 ml-1">Lecturer Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Ali bin Abu"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Gender - 选填 */}
                <div>
                  <label className="text-xs font-bold text-gray-700 ml-1">Gender (Optional)</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Office - 选填 */}
                <div>
                  <label className="text-xs font-bold text-gray-700 ml-1">Office Room (Optional)</label>
                  <input
                    type="text"
                    value={office}
                    onChange={(e) => setOffice(e.target.value)}
                    placeholder="e.g. C23-314"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Phone & Email - 并排以节省空间 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 ml-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 012-3456789"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 ml-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ali@utm.my"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !name.trim()}
                  className="w-full mt-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}