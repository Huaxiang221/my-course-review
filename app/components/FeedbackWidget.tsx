"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"report" | "suggestion">("report");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return alert("Please provide a description.");
    
    setIsSubmitting(true);

    const { error } = await supabase.from("error_reports").insert([
      {
        type,
        description,
        email: email.trim() || null,
        page_url: pathname,
        status: "Pending" 
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      alert("Something went wrong: " + error.message);
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setDescription("");
        setEmail("");
      }, 3000);
    }
  }

  return (
    <>
      {/* Floating Button - 增加了 z-[9990] 确保按钮也不会被其他东西盖住 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9990] bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
        </svg>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out font-bold text-sm">
          Feedback
        </span>
      </button>

      {/* Modal Interface */}
      <AnimatePresence>
        {isOpen && (
          // 这里的 z-[9999] 确保黑色半透明遮罩在最顶层
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              // 这里的 z-[10000] 确保白色弹窗在遮罩之上，绝对不会被穿透
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative z-[10000]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {isSuccess ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✨</div>
                  <h3 className="text-xl font-bold text-gray-900">Thank you!</h3>
                  <p className="text-gray-500 text-sm">We've received your feedback and will look into it.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1">Help us improve</h2>
                    <p className="text-sm text-gray-500 font-medium">What's on your mind?</p>
                  </div>

                  {/* Type Selector */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                    <button
                      type="button"
                      onClick={() => setType("report")}
                      className={`py-2 px-4 rounded-xl text-sm font-bold transition-all ${type === "report" ? "bg-white shadow-sm text-red-600 border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      🐛 Report Issue
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("suggestion")}
                      className={`py-2 px-4 rounded-xl text-sm font-bold transition-all ${type === "suggestion" ? "bg-white shadow-sm text-blue-600 border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      💡 Suggestion
                    </button>
                  </div>

                  {/* Description Input */}
                  <div>
                    <textarea
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={type === "report" ? "Describe the bug you found..." : "I think it would be cool if..."}
                      className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm resize-none transition-colors"
                    />
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="To get notified when we fix/build this"
                      className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm transition-colors"
                    />
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl shadow-md hover:bg-black transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? <span className="animate-pulse">Submitting...</span> : "Submit Feedback"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}