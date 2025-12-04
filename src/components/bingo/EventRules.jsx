import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, ChevronDown, ChevronUp } from 'lucide-react';

export default function EventRules({ rules }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const defaultRules = `• Screenshots required for all tile completions
• One tile per team member at a time
• Admins will verify submissions within 1 hour
• No account sharing allowed
• Have fun and play fair!`;

  const displayRules = rules || defaultRules;

  return (
    <div 
      className="bg-gradient-to-b from-[#5b9bd5] to-[#4a8bc4] rounded-xl border-4 border-[#3a7bb4] overflow-hidden"
      style={{ fontFamily: "'RuneScape UF', sans-serif" }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-black/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-black" />
          <h3 className="text-black font-bold">Event Rules</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-700" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-700" />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-[#3a7bb4]/50">
              <div className="mt-3 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                {displayRules}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}