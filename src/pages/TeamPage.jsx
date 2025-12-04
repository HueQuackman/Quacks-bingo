import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Star, CheckSquare, Trophy, Pin, Image, Upload, X, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import OSRSButton from '@/components/bingo/OSRSButton';
import PlayerLink from '@/components/bingo/PlayerLink';
import TeamChat from '@/components/chat/TeamChat';

export default function TeamPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('id');
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [pinnedMessage, setPinnedMessage] = useState('');
  const [teamName, setTeamName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => base44.entities.Team.filter({ id: teamId }),
    enabled: !!teamId,
    select: (data) => data[0]
  });

  const { data: event } = useQuery({
    queryKey: ['event', team?.event_id],
    queryFn: () => base44.entities.BingoEvent.filter({ id: team.event_id }),
    enabled: !!team?.event_id,
    select: (data) => data[0]
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['team-completions', teamId],
    queryFn: () => base44.entities.TileCompletion.filter({ team_id: teamId }),
    enabled: !!teamId
  });

  const { data: membership } = useQuery({
    queryKey: ['team-membership', teamId, user?.email],
    queryFn: () => base44.entities.TeamMembership.filter({ team_id: teamId, user_email: user.email }),
    enabled: !!teamId && !!user?.email,
    select: (data) => data[0]
  });

  const { data: allMemberships = [] } = useQuery({
    queryKey: ['team-all-memberships', teamId],
    queryFn: () => base44.entities.TeamMembership.filter({ team_id: teamId }),
    enabled: !!teamId
  });

  const memberNames = allMemberships.map(m => m.display_name);

  const isCaptain = team?.captain_email === user?.email;
  const isMember = !!membership;
  const isAdmin = user?.role === 'admin';

  const updateTeam = useMutation({
    mutationFn: (data) => base44.entities.Team.update(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['team', teamId]);
      setShowEditModal(false);
      setShowPinModal(false);
    }
  });

  const handleUploadBanner = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setBannerUrl(file_url);
    setUploading(false);
  };

  const handleUploadIcon = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setIconUrl(file_url);
    setUploading(false);
  };

  const handleSaveCustomization = () => {
    updateTeam.mutate({
      name: teamName || team?.name,
      banner_url: bannerUrl || team?.banner_url,
      icon_url: iconUrl || team?.icon_url
    });
  };

  const handleSavePinnedMessage = () => {
    updateTeam.mutate({ pinned_message: pinnedMessage });
  };

  useEffect(() => {
    if (team) {
      setBannerUrl(team.banner_url || '');
      setIconUrl(team.icon_url || '');
      setPinnedMessage(team.pinned_message || '');
      setTeamName(team.name || '');
    }
  }, [team]);

  const approvedCompletions = completions.filter(c => c.status === 'approved');
  const pendingCompletions = completions.filter(c => c.status === 'pending');
  const totalPoints = approvedCompletions.reduce((sum, c) => sum + (c.points_awarded || 0), 0);

  const getTileTask = (tileId) => {
    return event?.tiles?.find(t => t.id === tileId)?.task || 'Unknown tile';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a2744] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#ff981f] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#1a2744] flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-[#ff981f] text-xl" style={{ fontFamily: "'RuneScape UF', sans-serif" }}>
          Team not found
        </p>
        <Link to={createPageUrl('Home')}>
          <OSRSButton>Back to Home</OSRSButton>
        </Link>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#1a2744] p-4 md:p-6"
      style={{ 
        fontFamily: "'RuneScape UF', sans-serif",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23ffffff' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E")` 
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-4 mb-6"
        >
          <Link to={createPageUrl('BingoEvent') + `?id=${team.event_id}`}>
            <OSRSButton variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2 inline" />
              Back to Event
            </OSRSButton>
          </Link>
        </motion.div>

        {/* Team Banner */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative rounded-xl overflow-hidden border-4 border-[#5c4833] mb-6"
        >
          <div 
            className="h-40 md:h-56 bg-gradient-to-br from-[#3d3224] to-[#2a2218]"
            style={team.banner_url ? { 
              backgroundImage: `url(${team.banner_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {}}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          </div>
          
          {/* Team Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="flex items-end gap-4">
              {/* Team Icon */}
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-4 flex items-center justify-center shrink-0"
                style={{ 
                  backgroundColor: team.color,
                  borderColor: team.color,
                  backgroundImage: team.icon_url ? `url(${team.icon_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!team.icon_url && <Users className="w-8 h-8 text-white/80" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl text-white font-bold truncate">{team.name}</h1>
                <p className="text-[#8a7a5a]">{event?.name || 'Event'}</p>
              </div>
              
              {(isCaptain || isAdmin) && (
                <OSRSButton variant="secondary" onClick={() => setShowEditModal(true)}>
                  <Image className="w-4 h-4 mr-2 inline" />
                  Customize
                </OSRSButton>
              )}
            </div>
          </div>
        </motion.div>

        {/* Pinned Message */}
        {team.pinned_message && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-r from-[#ff981f]/20 to-[#ff981f]/10 rounded-xl border-2 border-[#ff981f]/50 p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <Pin className="w-5 h-5 text-[#ff981f] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-[#ff981f] mb-1">Pinned by Captain</p>
                <p className="text-white">{team.pinned_message}</p>
              </div>
              {(isCaptain || isAdmin) && (
                <button onClick={() => setShowPinModal(true)} className="text-[#8a7a5a] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Captain Pin Button */}
        {(isCaptain || isAdmin) && !team.pinned_message && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <OSRSButton variant="secondary" onClick={() => setShowPinModal(true)}>
              <Pin className="w-4 h-4 mr-2 inline" />
              Pin Announcement
            </OSRSButton>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats & Members */}
          <div className="lg:col-span-1 space-y-4">
            {/* Stats */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] p-4"
            >
              <h3 className="text-[#ff981f] font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Team Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#8a7a5a]">Total Points</span>
                  <span className="text-yellow-400 font-bold text-lg">{totalPoints}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8a7a5a]">Tiles Completed</span>
                  <span className="text-green-400 font-bold">{approvedCompletions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8a7a5a]">Pending Submissions</span>
                  <span className="text-yellow-400">{pendingCompletions.length}</span>
                </div>
              </div>
            </motion.div>

            {/* Members */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] p-4"
            >
              <h3 className="text-[#ff981f] font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members ({memberNames.length})
              </h3>
              <div className="space-y-2">
                {memberNames.length > 0 ? (
                  memberNames.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <PlayerLink playerName={member} />
                    </div>
                  ))
                ) : (
                  <p className="text-[#8a7a5a] text-sm">No members yet</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Middle Column - Progress */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] p-4">
              <h3 className="text-[#ff981f] font-bold mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Completed Tiles
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {approvedCompletions.length === 0 ? (
                  <p className="text-[#8a7a5a] text-sm text-center py-4">No completed tiles yet</p>
                ) : (
                  approvedCompletions.map((completion) => (
                    <div 
                      key={completion.id}
                      className="p-3 bg-black/30 rounded-lg border border-[#5c4833]/50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{getTileTask(completion.tile_id)}</p>
                          <p className="text-[#8a7a5a] text-xs mt-1">
                            by <PlayerLink playerName={completion.player_name} />
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400 text-sm ml-2">
                          <Star className="w-4 h-4 fill-yellow-400" />
                          {completion.points_awarded}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {pendingCompletions.length > 0 && (
                <>
                  <h4 className="text-[#ff981f] font-bold mt-6 mb-3 text-sm">Pending ({pendingCompletions.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pendingCompletions.map((completion) => (
                      <div 
                        key={completion.id}
                        className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-600/30"
                      >
                        <p className="text-white text-sm truncate">{getTileTask(completion.tile_id)}</p>
                        <p className="text-[#8a7a5a] text-xs mt-1">
                          by <PlayerLink playerName={completion.player_name} />
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Right Column - Team Chat */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-1"
          >
            <TeamChat 
              eventId={team.event_id} 
              teamId={teamId} 
              user={user}
              teamColor={team.color}
            />
          </motion.div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-[#2a2218] border-[#5c4833] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#ff981f]">Customize Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[#8a7a5a] text-sm mb-2 block">Team Name</label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                className="bg-black/40 border-[#5c4833] text-white"
              />
            </div>
            <div>
              <label className="text-[#8a7a5a] text-sm mb-2 block">Team Banner</label>
              <div className="flex gap-2">
                <Input
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="Banner URL"
                  className="bg-black/40 border-[#5c4833] text-white"
                />
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={handleUploadBanner} />
                  <div className="px-3 py-2 bg-[#5c4833] hover:bg-[#6d5a40] rounded-md">
                    <Upload className="w-4 h-4" />
                  </div>
                </label>
              </div>
            </div>
            <div>
              <label className="text-[#8a7a5a] text-sm mb-2 block">Team Icon</label>
              <div className="flex gap-2">
                <Input
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="Icon URL"
                  className="bg-black/40 border-[#5c4833] text-white"
                />
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={handleUploadIcon} />
                  <div className="px-3 py-2 bg-[#5c4833] hover:bg-[#6d5a40] rounded-md">
                    <Upload className="w-4 h-4" />
                  </div>
                </label>
              </div>
            </div>
            {uploading && <p className="text-[#ff981f] text-sm">Uploading...</p>}
            <div className="flex gap-2 justify-end">
              <OSRSButton variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</OSRSButton>
              <OSRSButton onClick={handleSaveCustomization} disabled={uploading}>Save</OSRSButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pin Modal */}
      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="bg-[#2a2218] border-[#5c4833] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#ff981f]">Pin Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={pinnedMessage}
              onChange={(e) => setPinnedMessage(e.target.value)}
              placeholder="Enter announcement for your team..."
              className="bg-black/40 border-[#5c4833] text-white min-h-24"
            />
            <div className="flex gap-2 justify-end">
              <OSRSButton variant="secondary" onClick={() => setShowPinModal(false)}>Cancel</OSRSButton>
              <OSRSButton variant="danger" onClick={() => { setPinnedMessage(''); handleSavePinnedMessage(); }}>
                Remove Pin
              </OSRSButton>
              <OSRSButton onClick={handleSavePinnedMessage}>Save</OSRSButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}