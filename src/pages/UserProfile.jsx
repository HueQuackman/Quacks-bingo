import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Star, CheckSquare, Calendar, Award, Shield, Check, Pencil } from 'lucide-react';
import OSRSButton from '@/components/bingo/OSRSButton';
import { Input } from '@/components/ui/input';

const BADGES = [
  { id: 'first_tile', name: 'First Blood', icon: '⚔️', description: 'Complete your first tile' },
  { id: 'ten_tiles', name: 'Tile Hunter', icon: '🎯', description: 'Complete 10 tiles' },
  { id: 'fifty_tiles', name: 'Tile Master', icon: '👑', description: 'Complete 50 tiles' },
  { id: 'hundred_points', name: 'Point Collector', icon: '💰', description: 'Earn 100 points' },
  { id: 'five_hundred_points', name: 'Point Hoarder', icon: '💎', description: 'Earn 500 points' },
  { id: 'first_event', name: 'Event Rookie', icon: '🎪', description: 'Participate in your first event' },
  { id: 'five_events', name: 'Event Veteran', icon: '🏆', description: 'Participate in 5 events' }
];

export default function UserProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const displayName = urlParams.get('name');
  const queryClient = useQueryClient();
  
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');

  // Get current user's profile from localStorage
  useEffect(() => {
    const profileId = localStorage.getItem('bingo_profile_id');
    if (profileId) {
      base44.entities.Profile.filter({ id: profileId }).then(profiles => {
        if (profiles.length > 0) setCurrentProfile(profiles[0]);
      });
    }
  }, []);

  const updateDisplayName = useMutation({
    mutationFn: async (name) => {
      await base44.entities.Profile.update(currentProfile.id, { username: name });
    },
    onSuccess: () => {
      localStorage.setItem('bingo_username', newDisplayName);
      setIsEditingName(false);
      // Redirect to new profile URL
      window.location.href = createPageUrl('UserProfile') + `?name=${encodeURIComponent(newDisplayName)}`;
    }
  });

  const isOwnProfile = currentProfile && currentProfile.username === displayName;

  const updateBadge = useMutation({
    mutationFn: async (badgeId) => {
      await base44.entities.Profile.update(currentProfile.id, { selected_badge: badgeId });
    },
    onSuccess: () => {
      base44.entities.Profile.filter({ id: currentProfile.id }).then(profiles => {
        if (profiles.length > 0) setCurrentProfile(profiles[0]);
      });
      queryClient.invalidateQueries(['user-badge']);
    }
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['user-completions', displayName],
    queryFn: () => base44.entities.TileCompletion.filter({ player_name: displayName, status: 'approved' }),
    enabled: !!displayName
  });

  const { data: events = [] } = useQuery({
    queryKey: ['all-events'],
    queryFn: () => base44.entities.BingoEvent.list()
  });

  // Calculate stats
  const totalPoints = completions.reduce((sum, c) => sum + (c.points_awarded || 0), 0);
  const tilesCompleted = completions.length;
  const eventIds = [...new Set(completions.map(c => c.event_id))];
  const eventsParticipated = eventIds.length;

  // Calculate earned badges
  const earnedBadges = [];
  if (tilesCompleted >= 1) earnedBadges.push('first_tile');
  if (tilesCompleted >= 10) earnedBadges.push('ten_tiles');
  if (tilesCompleted >= 50) earnedBadges.push('fifty_tiles');
  if (totalPoints >= 100) earnedBadges.push('hundred_points');
  if (totalPoints >= 500) earnedBadges.push('five_hundred_points');
  if (eventsParticipated >= 1) earnedBadges.push('first_event');
  if (eventsParticipated >= 5) earnedBadges.push('five_events');

  const getTileTask = (eventId, tileId) => {
    const event = events.find(e => e.id === eventId);
    return event?.tiles?.find(t => t.id === tileId)?.task || 'Unknown task';
  };

  const getEventName = (eventId) => {
    return events.find(e => e.id === eventId)?.name || 'Unknown event';
  };

  if (!displayName) {
    return (
      <div className="min-h-screen bg-[#1a2744] flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] p-8 rounded-xl border-4 border-[#5c4833] text-center">
          <p className="text-[#ff981f] text-xl mb-4" style={{ fontFamily: "'RuneScape UF', sans-serif" }}>
            User Not Found
          </p>
          <Link to={createPageUrl('Home')}>
            <OSRSButton variant="secondary">Back to Home</OSRSButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#1a2744] p-4 md:p-8"
      style={{ 
        fontFamily: "'RuneScape UF', sans-serif",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23ffffff' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E")` 
      }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <Link to={createPageUrl('Home')}>
            <OSRSButton variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2 inline" />
              Back
            </OSRSButton>
          </Link>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
                          <div className="w-20 h-20 bg-gradient-to-br from-[#ff981f] to-[#c77b15] rounded-full flex items-center justify-center">
                            <Shield className="w-10 h-10 text-[#1a1510]" />
                          </div>
                          <div className="flex-1">
                            {isEditingName ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={newDisplayName}
                                  onChange={(e) => setNewDisplayName(e.target.value)}
                                  className="bg-black/30 border-[#5c4833] text-[#ff981f] text-xl"
                                  placeholder="Enter new name"
                                />
                                <OSRSButton 
                                  variant="success" 
                                  onClick={() => updateDisplayName.mutate(newDisplayName)}
                                  disabled={!newDisplayName.trim()}
                                  className="text-xs px-3 py-1"
                                >
                                  Save
                                </OSRSButton>
                                <OSRSButton 
                                  variant="secondary" 
                                  onClick={() => setIsEditingName(false)}
                                  className="text-xs px-3 py-1"
                                >
                                  Cancel
                                </OSRSButton>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <h1 className="text-3xl text-[#ff981f] font-bold">{displayName}</h1>
                                {isOwnProfile && (
                                  <button
                                    onClick={() => {
                                      setNewDisplayName(displayName);
                                      setIsEditingName(true);
                                    }}
                                    className="p-1 text-[#8a7a5a] hover:text-[#ff981f] transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                            <p className="text-[#8a7a5a]">Bingo Competitor</p>
                          </div>
                        </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-lg p-4 text-center border border-[#5c4833]">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl text-[#ff981f] font-bold">{totalPoints}</p>
              <p className="text-[#8a7a5a] text-sm">Total Points</p>
            </div>
            <div className="bg-black/30 rounded-lg p-4 text-center border border-[#5c4833]">
              <CheckSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl text-[#ff981f] font-bold">{tilesCompleted}</p>
              <p className="text-[#8a7a5a] text-sm">Tiles Completed</p>
            </div>
            <div className="bg-black/30 rounded-lg p-4 text-center border border-[#5c4833]">
              <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl text-[#ff981f] font-bold">{eventsParticipated}</p>
              <p className="text-[#8a7a5a] text-sm">Events</p>
            </div>
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] p-6 mb-6"
        >
          <h2 className="text-xl text-[#ff981f] font-bold mb-4 flex items-center gap-2">
                          <Award className="w-6 h-6" />
                          Badges ({earnedBadges.length}/{BADGES.length})
                          {isOwnProfile && <span className="text-xs text-[#8a7a5a] font-normal ml-2">Click to display</span>}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {BADGES.map((badge) => {
                            const isEarned = earnedBadges.includes(badge.id);
                            const isSelected = currentProfile?.selected_badge === badge.id;
                            return (
                              <button
                                key={badge.id}
                                onClick={() => {
                                  if (isOwnProfile && isEarned) {
                                    updateBadge.mutate(isSelected ? null : badge.id);
                                  }
                                }}
                                disabled={!isOwnProfile || !isEarned}
                                className={`p-3 rounded-lg border text-center transition-all relative ${
                                  isEarned 
                                    ? 'bg-[#ff981f]/10 border-[#ff981f]' 
                                    : 'bg-black/20 border-[#5c4833] opacity-40'
                                } ${isOwnProfile && isEarned ? 'cursor-pointer hover:bg-[#ff981f]/20' : ''} ${isSelected ? 'ring-2 ring-green-500' : ''}`}
                              >
                                {isSelected && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                                <span className="text-3xl">{badge.icon}</span>
                                <p className={`text-sm font-bold mt-1 ${isEarned ? 'text-[#ff981f]' : 'text-[#8a7a5a]'}`}>
                                  {badge.name}
                                </p>
                                <p className="text-xs text-[#8a7a5a] mt-1">{badge.description}</p>
                              </button>
                            );
                          })}
                        </div>
        </motion.div>

        {/* Recent Completions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] p-6"
        >
          <h2 className="text-xl text-[#ff981f] font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Recent Completions
          </h2>
          {completions.length === 0 ? (
            <p className="text-[#8a7a5a] text-center py-4">No completed tiles yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {completions.slice(0, 20).map((completion) => (
                <div
                  key={completion.id}
                  className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-[#5c4833]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{getTileTask(completion.event_id, completion.tile_id)}</p>
                    <p className="text-[#8a7a5a] text-xs">{getEventName(completion.event_id)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    {completion.points_awarded}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}