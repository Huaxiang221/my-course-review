"use client";

import React, { useState } from "react";

export default function BuyMeCoffee() {
  const [isOpen, setIsOpen] = useState(false);

  // ⚠️ 记得确认你的 BMAC 链接
  const bmacLink = "https://www.buymeacoffee.com/YOUR_USERNAME"; 

  return (
    <>
      {/* 1. 悬浮按钮 (点击后不再直接跳转，而是打开弹窗) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#FFDD00] text-black px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all font-bold border-2 border-black group"
      >
        <img
          src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
          alt="Buy me a coffee"
          className="w-6 h-6 transition-transform group-hover:rotate-12"
        />
        <span className="text-sm tracking-wide">Buy me a coffee</span>
      </button>

      {/* 2. 支付弹窗 (Modal) */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          
          {/* 弹窗卡片 */}
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 relative animate-in zoom-in-95 duration-200">
            
            {/* 关闭按钮 (X) */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-center mb-2">Support My Work ☕</h3>
            <p className="text-gray-500 text-center text-sm mb-6">
              Thank you for keeping this server running!
            </p>

            {/* 选项 A: Touch 'n Go / DuitNow */}
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-4 flex flex-col items-center">
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full mb-3">
                🇲🇾 Local (TnG / DuitNow)
              </span>
              {/* 👇 这里的图片就是你刚才放在 public 文件夹里的图片 */}
              <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 mb-2">
                 {/* 确保你的图片名字叫 tng-qr.jpeg，或者改成对应的名字 */}
                 <img src="/tng-qr.jpeg" alt="TNG QR" className="w-40 h-40 object-contain" />
              </div>
              <p className="text-xs text-gray-400">Scan with TnG / MAE / Bank App</p>
            </div>

            {/* 分割线 */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-300 text-xs">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* 选项 B: International (Buy Me a Coffee) */}
            <a
              href={bmacLink}
              target="_blank"
              rel="noreferrer"
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[#FFDD00] text-black py-3 rounded-xl font-bold hover:bg-[#ffea5c] transition-colors shadow-sm"
            >
              <img
                src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
                alt="Logo"
                className="w-5 h-5"
              />
              <span>Pay with USD / Card</span>
            </a>

          </div>
        </div>
      )}
    </>
  );
}