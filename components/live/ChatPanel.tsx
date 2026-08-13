"use client";

import { useState } from "react";
import { ChatMessage } from "@/types/live-class";
import { Send, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  messages: ChatMessage[];
  onClose: () => void;
  onSend: (msg: string) => void;
}

export function ChatPanel({ messages, onClose, onSend }: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute top-4 bottom-24 right-4 w-80 glass-panel border border-white/10 rounded-2xl flex flex-col overflow-hidden bg-slate-900/80 backdrop-blur-xl z-40"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
         <h3 className="font-outfit font-semibold text-white">In-Call Messages</h3>
         <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors">
            <X size={18} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
         {messages.map(msg => (
           <div key={msg.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-white/5 overflow-hidden flex items-center justify-center">
                 {msg.senderAvatar ? <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-slate-400">{msg.senderName[0]}</span>}
              </div>
              <div className="flex-1">
                 <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-200">{msg.senderName}</span>
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                 </div>
                 <p className="text-sm text-slate-300 leading-snug">{msg.text}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="p-4 border-t border-white/5 bg-slate-900/50">
         <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send message..." 
              className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors">
               <Send size={16} />
            </button>
         </form>
      </div>
    </motion.div>
  );
}
