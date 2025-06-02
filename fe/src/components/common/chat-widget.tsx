'use client';

import React, { useEffect, useRef, useState } from 'react';

// Chỉ tạo Audio khi ở client
const isClient = typeof window !== 'undefined';
const sendSound = isClient ? new Audio('/sounds/send.mp3') : null;
const receiveSound = isClient ? new Audio('/sounds/receive.mp3') : null;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { from: 'user', text: input }]);
    sendSound?.play();
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: input }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { from: 'bot', text: data.reply }]);
      receiveSound?.play();
    } catch (err) {
      if (err instanceof Error) {
        console.error('Lỗi khi gửi tin nhắn:', err.message);

        setMessages((prev) => [
          ...prev,
          { from: 'bot', text: 'Xin lỗi, có lỗi xảy ra khi gửi tin nhắn.' },
        ]);
      }
      setMessages((prev) => [...prev, { from: 'bot', text: 'Lỗi khi gửi tin nhắn.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages, isTyping]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Khung chat */}
      <div
        className={`transition-all duration-300 ${
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {open && (
          <div className="w-80 h-96 shadow-xl rounded-lg flex flex-col border border-[#9F6508] bg-gradient-to-br from-[#F3C871] to-[#FFF3B4]">
            {/* Header */}
            <div className="bg-[#9F6508] text-white p-3 font-semibold rounded-t-lg flex justify-between items-center">
              <span>💬 FoodieBot</span>
              <button onClick={() => setOpen(false)} className="text-sm font-light">✖</button>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 p-2 overflow-y-auto text-sm space-y-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar bot */}
                  {msg.from === 'bot' && (
                    <img
                      src="/bot-avatar.png"
                      alt="bot"
                      className="w-6 h-6 rounded-full border"
                    />
                  )}

                  {/* Bubble */}
                  <div
                    className={`
                      max-w-[75%] p-2 rounded-md text-sm 
                      whitespace-pre-wrap break-words
                      ${msg.from === 'user'
                        ? 'bg-white border border-[#F3C871] self-end'
                        : 'bg-white border border-[#9F6508] self-start'}
                    `}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

              {isTyping && (
                <div className="flex justify-start text-sm italic text-gray-600 px-2">Bot đang trả lời...</div>
              )}
            </div>

            {/* Input */}
            <div className="p-2 border-t border-[#9F6508] flex gap-2 bg-white rounded-b-lg">
              <input
                type="text"
                className="flex-1 border rounded p-1 text-sm border-[#F3C871]"
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="text-[#9F6508] font-semibold text-sm">Gửi</button>
            </div>
          </div>
        )}
      </div>

      {/* Nút bong bóng chat */}
      {!open && (
        <button
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-[#F3C871] to-[#9F6508] text-white text-xl transition-all duration-300"
          onClick={() => setOpen(true)}
        >
          💬
        </button>
      )}
    </div>
  );
}
