import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, X, Minimize2, Maximize2, Bell, BellOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PlayerLink from '@/components/bingo/PlayerLink';

export default function ClanChat({ eventId, teamId, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const lastMessageCount = useRef(0);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat', eventId, teamId],
    queryFn: () => {
      if (teamId) {
        return base44.entities.ChatMessage.filter({ event_id: eventId, team_id: teamId }, '-created_date', 100);
      }
      return base44.entities.ChatMessage.filter({ event_id: eventId }, '-created_date', 100);
    },
    enabled: !!eventId,
    refetchInterval: 3000
  });

  const sortedMessages = [...messages].reverse();

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > lastMessageCount.current) {
      setUnreadCount(prev => prev + (messages.length - lastMessageCount.current));
    }
    lastMessageCount.current = messages.length;
  }, [messages.length, isOpen]);

  // Clear unread when opening
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sortedMessages, isOpen, isMinimized]);

  const sendMessage = useMutation({
    mutationFn: (text) => base44.entities.ChatMessage.create({
      event_id: eventId,
      team_id: teamId || null,
      sender_name: user?.display_name || user?.full_name || 'Player',
      sender_email: user?.email,
      message: text,
      message_type: 'chat'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['chat', eventId, teamId]);
      setMessage('');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    sendMessage.mutate(message.trim());
  };

  const getMessageStyle = (msg) => {
    if (msg.message_type === 'system') return 'bg-blue-900/30 border-blue-500/30 text-blue-300 text-center italic';
    if (msg.message_type === 'tile_complete') return 'bg-green-900/30 border-green-500/30 text-green-300';
    if (msg.message_type === 'event_update') return 'bg-yellow-900/30 border-yellow-500/30 text-yellow-300';
    if (msg.sender_email === user?.email) return 'bg-[#ff981f]/20 border-[#ff981f]/30';
    return 'bg-black/30 border-[#5c4833]/50';
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-gradient-to-b from-[#5c4833] to-[#3d2e1f] rounded-full border-2 border-[#ff981f] shadow-lg flex items-center justify-center"
      >
        <MessageSquare className="w-6 h-6 text-[#ff981f]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.8 }}
      className="fixed bottom-4 right-4 z-50 w-80 md:w-96 bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] shadow-2xl overflow-hidden"
      style={{ fontFamily: "'RuneScape UF', sans-serif" }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5c4833] to-[#4a3a28] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#ff981f]" />
          <span className="text-[#ff981f] font-bold">
            {teamId ? 'Team Chat' : 'Event Chat'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setNotifications(!notifications)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            {notifications ? (
              <Bell className="w-4 h-4 text-[#c0a875]" />
            ) : (
              <BellOff className="w-4 h-4 text-[#8a7a5a]" />
            )}
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-[#c0a875]" />
            ) : (
              <Minimize2 className="w-4 h-4 text-[#c0a875]" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-[#c0a875]" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
          >
            {/* Messages */}
            <div className="h-72 overflow-y-auto p-3 space-y-2">
              {sortedMessages.length === 0 ? (
                <p className="text-[#8a7a5a] text-center text-sm py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                sortedMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2 rounded-lg border ${getMessageStyle(msg)}`}
                  >
                    {msg.message_type === 'chat' && (
                      <div className="flex items-center justify-between mb-1">
                        <PlayerLink playerName={msg.sender_name} />
                        <span className="text-[#8a7a5a] text-xs">
                          {formatTime(msg.created_date)}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-white break-words">{msg.message}</p>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-[#5c4833]">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={user ? "Type a message..." : "Login to chat"}
                  disabled={!user}
                  className="bg-black/40 border-[#5c4833] text-white placeholder:text-[#8a7a5a]"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || !user}
                  className="px-3 bg-gradient-to-b from-[#5c4833] to-[#3d2e1f] border-2 border-[#ff981f] rounded-lg text-[#ff981f] hover:from-[#6d5a40] hover:to-[#4a3827] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}