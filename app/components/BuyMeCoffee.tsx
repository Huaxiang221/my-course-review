"use client";

import React, { useState } from "react";

export default function BuyMeCoffee() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTng, setShowTng] = useState(false);

  // ⚠️ 你的 Buy Me a Coffee 链接
  const bmacLink = "https://www.buymeacoffee.com/seng517"; 

  return (
    <>
      {/* 1. 悬浮按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#FFDD00] text-black px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all font-bold border-2 border-black group"
      >
        <img
          src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
          alt="Buy me a coffee"
          className="w-5 h-5 transition-transform group-hover:rotate-12"
        />
        <span className="text-sm font-bold">Donate</span>
      </button>

      {/* 2. 弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 relative animate-in zoom-in-95 duration-200">
            
            {/* 关闭按钮 */}
            <button 
              onClick={() => { setIsOpen(false); setShowTng(false); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-center mb-1">Support My Work 🚀</h3>
            <p className="text-gray-500 text-center text-xs mb-6">
              Thank you for keeping this server running!
            </p>

            {/* 核心逻辑：显示选择按钮 OR 显示 QR Code */}
            {!showTng ? (
              // 👉 状态 A: 两个大按钮供选择
              <div className="space-y-3">
                {/* TnG 按钮 */}
                <button
                  onClick={() => setShowTng(true)}
                  className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-xl border border-blue-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                      {/* TnG Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">TnG / DuitNow</div>
                      <div className="text-xs opacity-70">No fees (Local)</div>
                    </div>
                  </div>
                  <span className="text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
                </button>

                {/* BMAC 按钮 */}
                <a
                  href={bmacLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between bg-yellow-50 hover:bg-yellow-100 text-yellow-800 p-4 rounded-xl border border-yellow-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FFDD00] text-black p-2 rounded-lg">
                      <img src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg" className="w-5 h-5" alt="icon"/>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">Buy Me a Coffee</div>
                      <div className="text-xs opacity-70">USD / Card</div>
                    </div>
                  </div>
                  <span className="text-yellow-600 group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            ) : (
              // 👉 状态 B: 显示大 QR Code
              <div className="animate-in slide-in-from-right-8 duration-200 text-center">
                <button 
                  onClick={() => setShowTng(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1"
                >
                  ← Back
                </button>

                <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm inline-block mb-3">
                   {/* ✅ 这里的图片是 tng-qr.png */}
                   <img 
                     src="/tng-qr.png" 
                     alt="TNG QR Code" 
                     className="w-64 h-64 object-contain" 
                   />
                </div>
                
                <p className="text-sm font-bold text-gray-700">Scan via TnG / MAE</p>
                <p className="text-xs text-gray-400 mt-1">
                  On mobile? Screenshot this & upload in app.
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}