import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle, Star, MessageSquare, Clock } from 'lucide-react';
import moment from 'moment';
import PlayerLink from './PlayerLink';

export default function ActivityFeed({ eventId, teams, tiles, isAdmin = false, onAdminPlayerClick }) {
  const { data: completions = [] } = useQuery({
    queryKey: ['completions-feed', eventId],
    queryFn: () => base44.entities.TileCompletion.filter({ event_id: eventId }),
    enabled: !!eventId,
    refetchInterval: 5000
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['chat-feed', eventId],
    queryFn: () => base44.entities.ChatMessage.filter({ event_id: eventId }),
    enabled: !!eventId,
    refetchInterval: 5000
  });

  // Combine and sort activities
  const activities = React.useMemo(() => {
    const items = [];

    // Add completions
    completions.forEach(c => {
      const team = teams.find(t => t.id === c.team_id);
      const tile = tiles?.find(t => t.id === c.tile_id);
      items.push({
        id: `completion-${c.id}`,
        type: 'completion',
        status: c.status,
        player: c.player_name,
        team: team?.name,
        teamColor: team?.color,
        task: tile?.task || 'Unknown tile',
        points: c.points_awarded,
        usedDouble: c.used_double_points,
        timestamp: c.created_date
      });
    });

    // Add system/event chat messages
    chatMessages
      .filter(m => m.message_type !== 'chat')
      .forEach(m => {
        items.push({
          id: `chat-${m.id}`,
          type: 'system',
          messageType: m.message_type,
          sender: m.sender_name,
          message: m.message,
          timestamp: m.created_date
        });
      });

    // Sort by timestamp descending
    return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);
  }, [completions, chatMessages, teams, tiles]);

  const getStatusIcon = (activity) => {
    if (activity.type === 'completion') {
      if (activity.status === 'approved') return <CheckCircle className="w-4 h-4 text-green-400" />;
      if (activity.status === 'pending') return <Clock className="w-4 h-4 text-yellow-400" />;
      return <Clock className="w-4 h-4 text-red-400" />;
    }
    if (activity.type === 'system') {
      if (activity.messageType === 'tile_complete') return <Star className="w-4 h-4 text-yellow-400" />;
      return <MessageSquare className="w-4 h-4 text-blue-400" />;
    }
    return <Activity className="w-4 h-4 text-[#8a7a5a]" />;
  };

  const getActivityText = (activity) => {
    if (activity.type === 'completion') {
      const statusText = activity.status === 'approved' ? 'completed' : 
                         activity.status === 'pending' ? 'submitted' : 'rejected';
      return (
        <span>
          <PlayerLink 
            playerName={activity.player} 
            isAdmin={isAdmin}
            onAdminClick={onAdminPlayerClick}
          /> {statusText}{' '}
          <span className="text-white">"{activity.task}"</span>
          {activity.status === 'approved' && (
            <span className="text-yellow-400 ml-1">
              +{activity.points} pts
              {activity.usedDouble && ' (2x!)'}
            </span>
          )}
        </span>
      );
    }
    return <span className="text-[#c0a875]">{activity.message}</span>;
  };

  return (
    <div 
      className="bg-gradient-to-b from-[#5b9bd5] to-[#4a8bc4] rounded-xl border-4 border-[#3a7bb4] overflow-hidden"
      style={{ fontFamily: "'RuneScape UF', sans-serif" }}
    >
      <div className="p-4 border-b border-[#3a7bb4]/50 flex items-center gap-2">
        <Activity className="w-5 h-5 text-black" />
        <h3 className="text-black font-bold">Recent Activity</h3>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-4 text-center text-gray-700 text-sm">
            No activity yet
          </div>
        ) : (
          <AnimatePresence>
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="px-4 py-3 border-b border-[#3a7bb4]/30 hover:bg-black/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStatusIcon(activity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#c0a875] leading-relaxed">
                      {getActivityText(activity)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-700">
                      {activity.team && (
                        <span className="flex items-center gap-1">
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: activity.teamColor }}
                          />
                          {activity.team}
                        </span>
                      )}
                      <span>{moment(activity.timestamp).fromNow()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}