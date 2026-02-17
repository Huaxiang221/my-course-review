"use client";

import { useEffect, useState } from "react";

export default function NoticeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has seen the notice in this session
    const hasSeenNotice = sessionStorage.getItem("has_seen_notice");
    if (!hasSeenNotice) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    // Mark as seen for this session
    sessionStorage.setItem("has_seen_notice", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Important Notice</h2>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          
          {/* Warning Box */}
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
            <p className="font-bold text-red-700 mb-1">🚫 Private Access Only</p>
            <p>Please <strong>DO NOT share the password</strong> with others. This is a private tool intended for internal use only.</p>
          </div>

          <p>
            If this website is discovered by <strong>Lecturers</strong> or the <strong>Student Council (MPP)</strong>, it will be <strong>permanently shutdown</strong> immediately to comply with university regulations.
          </p>

          {/* Contact Box */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800">
            <strong>To Lecturers / MPP:</strong><br/>
            If you are a university official and wish for this website to be taken down, please contact me directly. I will cooperate fully.
            <br/>
            <a 
              href="https://wa.me/60143681313" 
              target="_blank" 
              className="mt-2 inline-flex items-center gap-1 text-green-600 font-bold hover:underline text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              WhatsApp: 014-3681313 ↗
            </a>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleClose}
          className="mt-6 w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}