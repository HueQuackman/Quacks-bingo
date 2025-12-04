import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import moment from 'moment';
import PlayerLink from '@/components/bingo/PlayerLink';

export default function TeamChat({ eventId, teamId, user, teamColor }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['team-chat', eventId, teamId],
    queryFn: () => base44.entities.ChatMessage.filter({ event_id: eventId, team_id: teamId }),
    enabled: !!eventId && !!teamId,
    refetchInterval: 3000
  });

  const sendMessage = useMutation({
    mutationFn: (content) => base44.entities.ChatMessage.create({
      event_id: eventId,
      team_id: teamId,
      sender_name: user?.display_name || user?.full_name || 'Player',
      sender_email: user?.email,
      message: content,
      message_type: 'chat'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-chat', eventId, teamId]);
      setMessage('');
    }
  });

  const handleSend = () => {
    if (!message.trim() || !user) return;
    sendMessage.mutate(message.trim());
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  return (
    <div 
      className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] overflow-hidden h-[500px] flex flex-col"
      style={{ fontFamily: "'RuneScape UF', sans-serif" }}
    >
      <div 
        className="p-4 border-b border-[#5c4833] flex items-center gap-2"
        style={{ borderLeftColor: teamColor, borderLeftWidth: '4px' }}
      >
        <MessageSquare className="w-5 h-5 text-[#ff981f]" />
        <h3 className="text-[#ff981f] font-bold">Team Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedMessages.length === 0 ? (
          <p className="text-[#8a7a5a] text-sm text-center py-8">No messages yet. Start the conversation!</p>
        ) : (
          sortedMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${msg.sender_email === user?.email ? 'ml-8' : 'mr-8'}`}
            >
              <div className={`p-3 rounded-lg ${
                msg.sender_email === user?.email 
                  ? 'bg-[#5c4833] ml-auto' 
                  : 'bg-black/30'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">
                    <PlayerLink playerName={msg.sender_name} />
                  </span>
                  <span className="text-[#8a7a5a] text-xs">
                    {moment(msg.created_date).fromNow()}
                  </span>
                </div>
                <p className="text-white text-sm">{msg.message}</p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[#5c4833]">
        {user ? (
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="bg-black/40 border-[#5c4833] text-white"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2 bg-[#ff981f] hover:bg-[#e88a1a] rounded-lg disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5 text-[#1a1510]" />
            </button>
          </div>
        ) : (
          <p className="text-[#8a7a5a] text-sm text-center">Log in to chat</p>
        )}
      </div>
    </div>
  );
}