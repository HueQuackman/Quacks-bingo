import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar, Users, Trophy, Plus, Clock, CheckCircle, Play, Trash2, User, BarChart3, ExternalLink, Crown, X } from 'lucide-react';
import AdminRoleModal from '@/components/admin/AdminRoleModal';
import OSRSButton from '@/components/bingo/OSRSButton';
import PendingInvitations from '@/components/invitations/PendingInvitations';
import ProfileSetupModal from '@/components/profile/ProfileSetupModal';

export default function Home() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  
  const [showAdminRoleModal, setShowAdminRoleModal] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('bingo_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('bingo_session_id', sid);
    }
    return sid;
  });
  const isAdmin = profile?.is_admin;

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Check for existing profile
  const { data: existingProfiles = [], isLoading: profileLoading } = useQuery({
    queryKey: ['profile', sessionId, user?.email],
    queryFn: async () => {
      // First check by session_id
      let profiles = await base44.entities.Profile.filter({ session_id: sessionId });
      if (profiles.length > 0) return profiles;
      
      // If logged in, also check by email
      if (user?.email) {
        profiles = await base44.entities.Profile.filter({ user_email: user.email });
      }
      return profiles;
    }
  });

  useEffect(() => {
    if (!profileLoading) {
      if (existingProfiles.length > 0) {
        setProfile(existingProfiles[0]);
        localStorage.setItem('bingo_profile_id', existingProfiles[0].id);
        localStorage.setItem('bingo_username', existingProfiles[0].username);
      } else {
        setShowProfileSetup(true);
      }
    }
  }, [existingProfiles, profileLoading]);
  
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.BingoEvent.list('-created_date')
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId) => {
      // Delete associated teams and completions first
      const teams = await base44.entities.Team.filter({ event_id: eventId });
      const completions = await base44.entities.TileCompletion.filter({ event_id: eventId });
      
      for (const team of teams) {
        await base44.entities.Team.delete(team.id);
      }
      for (const completion of completions) {
        await base44.entities.TileCompletion.delete(completion.id);
      }
      
      await base44.entities.BingoEvent.delete(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
    }
  });

  const statusColors = {
    upcoming: 'from-yellow-600 to-yellow-800 border-yellow-500',
    active: 'from-green-600 to-green-800 border-green-500',
    completed: 'from-gray-600 to-gray-800 border-gray-500'
  };

  const statusIcons = {
    upcoming: Clock,
    active: Play,
    completed: CheckCircle
  };

  return (
    <div 
      className="min-h-screen bg-[#1a2744] p-3 md:p-4"
      style={{ 
        fontFamily: "'RuneScape UF', sans-serif",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E")` 
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Compact Header/Tabs */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4 p-3 bg-gradient-to-b from-[#5b9bd5] to-[#4a8bc4] rounded-xl border-2 border-[#3a7bb4]"
        >
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692ffafe152c6ed60d7efc47/5d98ad5c7_Screenshot_20251122_221829_Google.jpg"
              alt="Clan Logo"
              className="w-12 h-12 rounded-full object-cover border-2 border-[#ff981f]"
            />
            <div>
              <h1 className="text-2xl text-black font-bold">Clan Bingo</h1>
                                  <p className="text-gray-800 text-xs hidden md:block">OSRS clan competition tracker</p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap justify-center">
            {profile && (
              <Link to={createPageUrl('UserProfile') + `?name=${encodeURIComponent(profile.username)}`}>
                <OSRSButton variant="secondary" className="text-sm px-3 py-1.5">
                  <User className="w-3 h-3 mr-1 inline" />
                  Profile
                </OSRSButton>
              </Link>
            )}
            <Link to={createPageUrl('PlayerStats')}>
              <OSRSButton variant="secondary" className="text-sm px-3 py-1.5">
                <BarChart3 className="w-3 h-3 mr-1 inline" />
                Leaderboard
              </OSRSButton>
            </Link>
            <a href="https://wiseoldman.net/" target="_blank" rel="noopener noreferrer">
              <OSRSButton variant="secondary" className="text-sm px-3 py-1.5">
                <ExternalLink className="w-3 h-3 mr-1 inline" />
                WOM
              </OSRSButton>
            </a>
            {isAdmin && (
              <>
                <OSRSButton variant="secondary" className="text-sm px-3 py-1.5" onClick={() => setShowAdminRoleModal(true)}>
                  <Crown className="w-3 h-3 mr-1 inline" />
                  Users
                </OSRSButton>
                <Link to={createPageUrl('CreateEvent')}>
                  <OSRSButton className="text-sm px-3 py-1.5">
                    <Plus className="w-3 h-3 mr-1 inline" />
                    New Event
                  </OSRSButton>
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Main Content: Video + Events side by side */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Column: Events List */}
          <div className="lg:w-1/3 space-y-3">
            <PendingInvitations user={user} />

        {/* Events List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-10 h-10 border-4 border-[#ff981f] border-t-transparent rounded-full" />
              </div>
            ) : events.length === 0 ? (
              <div className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] p-6 rounded-xl border-2 border-[#5c4833]">
                <Trophy className="w-12 h-12 text-[#ff981f] mx-auto mb-3 opacity-50" />
                <p className="text-[#c0a875] mb-2 text-center">No events yet</p>
                <p className="text-[#8a7a5a] text-sm text-center">Create your first bingo event!</p>
              </div>
            ) : (
              events.map((event, index) => {
                const StatusIcon = statusIcons[event.status];
                return (
                  <motion.div
                    key={event.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative"
                  >
                    <Link to={createPageUrl('BingoEvent') + `?id=${event.id}`}>
                      <div className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-lg border-2 border-[#5c4833] overflow-hidden hover:border-[#ff981f] transition-all hover:shadow-lg hover:shadow-[#ff981f]/10 group">
                        <div className={`bg-gradient-to-r ${statusColors[event.status]} px-3 py-1.5 flex items-center justify-between`}>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className="w-3 h-3 text-white" />
                            <span className="text-white text-xs capitalize">{event.status}</span>
                          </div>
                          <span className="text-white/70 text-xs capitalize">{event.template}</span>
                        </div>
                        <div className="p-3">
                          <h3 className="text-base text-[#ff981f] font-bold mb-1 group-hover:text-yellow-400 transition-colors truncate">
                            {event.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#c0a875]">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(event.start_time).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    {isAdmin && event.status === 'completed' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm('Delete this completed event? This cannot be undone.')) {
                            deleteEvent.mutate(event.id);
                          }
                        }}
                        className="absolute top-8 right-1 p-1.5 bg-red-900/80 hover:bg-red-800 rounded text-red-300 transition-colors z-10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Right Column: Video */}
          {showVideo && (
            <div className="lg:w-2/3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative"
              >
                <div className="relative rounded-lg overflow-hidden border-2 border-[#5c4833] shadow-lg w-full aspect-video">
                  <video
                    src="https://res.cloudinary.com/dbyzapimq/video/upload/v1764811771/Community_RS_new_aldi2y.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setShowVideo(false)}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded text-white transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Role Modal */}
      <AdminRoleModal
        isOpen={showAdminRoleModal}
        onClose={() => setShowAdminRoleModal(false)}
      />

      {/* Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={showProfileSetup}
        onComplete={(newProfile) => {
          setProfile(newProfile);
          setShowProfileSetup(false);
        }}
        sessionId={sessionId}
        userEmail={user?.email}
      />
    </div>
  );
}