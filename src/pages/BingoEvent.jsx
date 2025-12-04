import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import BingoBoard from '@/components/bingo/BingoBoard';
import Leaderboard from '@/components/bingo/Leaderboard';
import EventTimer from '@/components/bingo/EventTimer';
import PowerupBar from '@/components/bingo/PowerupBar';
import TileSubmitModal from '@/components/bingo/TileSubmitModal';
import TeamSelector from '@/components/bingo/TeamSelector';
import OSRSButton from '@/components/bingo/OSRSButton';
import ClanChat from '@/components/chat/ClanChat';
import EventRules from '@/components/bingo/EventRules';
import ActivityFeed from '@/components/bingo/ActivityFeed';
import AdminPlayerSelect from '@/components/bingo/AdminPlayerSelect';
import AdminRoleModal from '@/components/admin/AdminRoleModal';
import ManageTeamPlayersModal from '@/components/admin/ManageTeamPlayersModal';
import ManageTeamPowerupsModal from '@/components/admin/ManageTeamPowerupsModal';
import StealCompletionModal from '@/components/bingo/StealCompletionModal';
import RevealMysteryModal from '@/components/bingo/RevealMysteryModal';
import BlockTileModal from '@/components/bingo/BlockTileModal';
import SubmissionsViewer from '@/components/bingo/SubmissionsViewer';
import { ArrowLeft, Settings, Crown, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BingoEventPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  // Redirect to Home if no event ID
  if (!eventId) {
    window.location.href = createPageUrl('Home');
    return null;
  }
  
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [useDoublePowerup, setUseDoublePowerup] = useState(false);
  const [activePowerup, setActivePowerup] = useState(null);
  const [user, setUser] = useState(null);
  const [lockedTeamId, setLockedTeamId] = useState(null);
  const [adminSelectPlayer, setAdminSelectPlayer] = useState(null);
  const [showAdminRoleModal, setShowAdminRoleModal] = useState(false);
  const [showManagePlayersModal, setShowManagePlayersModal] = useState(false);
  const [showStealModal, setShowStealModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [tileToBlock, setTileToBlock] = useState(null);
  const [showPowerupsModal, setShowPowerupsModal] = useState(false);
  const [profile, setProfile] = useState(null);

  // Get current user's profile for admin check
  useEffect(() => {
    const profileId = localStorage.getItem('bingo_profile_id');
    if (profileId) {
      base44.entities.Profile.filter({ id: profileId }).then(profiles => {
        if (profiles.length > 0) setProfile(profiles[0]);
      });
    }
  }, []);

  const isAdmin = profile?.is_admin;

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => base44.entities.BingoEvent.filter({ id: eventId }),
    enabled: !!eventId,
    select: (data) => data[0]
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', eventId],
    queryFn: () => base44.entities.Team.filter({ event_id: eventId }),
    enabled: !!eventId
  });

  // Check if user has already joined a team for this event
  const sessionId = localStorage.getItem('bingo_session_id');
  const userIdentifier = user?.email || sessionId;
  
  const { data: membership } = useQuery({
    queryKey: ['membership', eventId, userIdentifier],
    queryFn: async () => {
      const identifier = user?.email || localStorage.getItem('bingo_session_id');
      if (!identifier) return [];
      return base44.entities.TeamMembership.filter({ event_id: eventId, user_email: identifier });
    },
    enabled: !!eventId,
    select: (data) => data[0]
  });

  // Lock team when membership exists
  useEffect(() => {
    if (membership && teams.length > 0) {
      const lockedTeam = teams.find(t => t.id === membership.team_id);
      if (lockedTeam) {
        setSelectedTeam(lockedTeam);
        setLockedTeamId(membership.team_id);
      }
    }
  }, [membership, teams]);

  const joinTeam = useMutation({
    mutationFn: async (team) => {
      const username = localStorage.getItem('bingo_username') || user?.full_name || 'Player';
      
      // Create membership record
      await base44.entities.TeamMembership.create({
        event_id: eventId,
        team_id: team.id,
        user_email: user?.email || localStorage.getItem('bingo_session_id'),
        display_name: username
      });
      
      // Update team members array
      const currentMembers = team.members || [];
      if (!currentMembers.includes(username)) {
        await base44.entities.Team.update(team.id, {
          members: [...currentMembers, username]
        });
      }
      
      return team;
    },
    onSuccess: (team) => {
      setSelectedTeam(team);
      setLockedTeamId(team.id);
      queryClient.invalidateQueries(['membership', eventId, userIdentifier]);
      queryClient.invalidateQueries(['teams', eventId]);
    }
  });

  const handleSelectTeam = (team) => {
    if (lockedTeamId) return; // Already locked
    if (joinTeam.isPending) return; // Prevent double-click
    const sid = localStorage.getItem('bingo_session_id');
    if (!user && !sid) return;
    joinTeam.mutate(team);
  };

  const { data: completions = [] } = useQuery({
    queryKey: ['completions', eventId],
    queryFn: () => base44.entities.TileCompletion.filter({ event_id: eventId }),
    enabled: !!eventId,
    refetchInterval: 5000
  });

  const submitCompletion = useMutation({
        mutationFn: async ({ tileId, ...data }) => {
          console.log('Submitting completion:', { eventId, teamId: selectedTeam?.id, tileId, data });
          const result = await base44.entities.TileCompletion.create({
            event_id: eventId,
            team_id: selectedTeam.id,
            tile_id: tileId,
        points_awarded: data.used_double_points ? data.points * 2 : data.points,
        status: 'pending',
        player_name: data.player_name,
        screenshot_url: data.screenshot_url,
        used_double_points: data.used_double_points || false
      });
      console.log('Completion created:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['completions', eventId]);
      queryClient.invalidateQueries(['submissions', eventId]);
      if (useDoublePowerup) {
        updateTeamPowerups('double_points');
      }
    }
  });

  const updateTeamPowerups = async (powerupType, setCooldown = true) => {
    const currentCount = selectedTeam.powerups?.[powerupType] || 0;
    if (currentCount > 0) {
      const updates = {
        powerups: {
          ...selectedTeam.powerups,
          [powerupType]: currentCount - 1
        }
      };
      
      // Set cooldown timestamp if needed
      if (setCooldown) {
        updates.powerup_cooldowns = {
          ...selectedTeam.powerup_cooldowns,
          [powerupType]: new Date().toISOString()
        };
      }
      
      await base44.entities.Team.update(selectedTeam.id, updates);
      queryClient.invalidateQueries(['teams', eventId]);
    }
  };

  const handleTileClick = (tile) => {
    console.log('Tile clicked:', tile, 'Selected team:', selectedTeam);
    if (!selectedTeam) {
      alert('Please select a team first');
      return;
    }
    
    if (tile.is_mystery && !tile.revealed) {
      // Check if can reveal
      return;
    }

    if (activePowerup === 'block_tile') {
      setTileToBlock(tile);
      setShowBlockModal(true);
      return;
    }

    const tileWithId = { ...tile, id: Number(tile.id) };
    console.log('Setting selectedTile:', tileWithId);
    setSelectedTile(tileWithId);
    setShowSubmitModal(true);
  };

  const handleUsePowerup = (powerupId) => {
    if (powerupId === 'reveal_mystery') {
      setShowRevealModal(true);
    } else if (powerupId === 'steal_completion') {
      setShowStealModal(true);
    } else if (powerupId === 'block_tile') {
      setActivePowerup(powerupId);
    } else {
      setActivePowerup(powerupId);
    }
  };

  const handleRevealMystery = async (tile) => {
    // Update the tile to be revealed
    const updatedTiles = event.tiles.map(t => 
      Number(t.id) === Number(tile.id) ? { ...t, revealed: true } : t
    );
    
    await base44.entities.BingoEvent.update(eventId, { tiles: updatedTiles });
    await updateTeamPowerups('reveal_mystery');
    queryClient.invalidateQueries(['event', eventId]);
    alert(`Mystery tile revealed: "${tile.task}"`);
  };

  const handleStealCompletion = async (completion) => {
    const username = localStorage.getItem('bingo_username') || user?.full_name || 'Player';
    
    // Create a new completion for our team copying the stolen one
    await base44.entities.TileCompletion.create({
      event_id: eventId,
      team_id: selectedTeam.id,
      tile_id: completion.tile_id,
      points_awarded: completion.points_awarded,
      status: 'approved',
      player_name: username + ' (stolen)',
      screenshot_url: completion.screenshot_url,
      used_double_points: false
    });
    
    await updateTeamPowerups('steal_completion');
    queryClient.invalidateQueries(['completions', eventId]);
    
    const tile = event.tiles.find(t => Number(t.id) === Number(completion.tile_id));
    alert(`Successfully copied "${tile?.task || 'tile'}" completion!`);
  };

  const handleBlockTile = async (targetTeamId) => {
    if (!tileToBlock) return;

    const tileId = Number(tileToBlock.id);
    const targetTeam = teams.find(t => t.id === targetTeamId);

    // Block this tile for the selected team with blocker color
    const currentBlocked = targetTeam.blocked_tiles || [];
    const alreadyBlocked = currentBlocked.some(b => 
      (typeof b === 'number' && b === tileId) || 
      (typeof b === 'object' && b.tile_id === tileId)
    );

    if (!alreadyBlocked) {
      await base44.entities.Team.update(targetTeamId, {
        blocked_tiles: [...currentBlocked, { tile_id: tileId, blocker_color: selectedTeam.color }]
      });
    }

    // Deduct the powerup from current team
    await updateTeamPowerups('block_tile');
    setActivePowerup(null);
    setTileToBlock(null);
    queryClient.invalidateQueries(['teams', eventId]);
  };

  const handleAdminAssignPlayer = async (teamId, playerName) => {
    // Create membership for player
    await base44.entities.TeamMembership.create({
      event_id: eventId,
      team_id: teamId,
      user_email: playerName + '@manual',
      display_name: playerName
    });
    
    // Add player to team members array
    const team = teams.find(t => t.id === teamId);
    if (team) {
      const currentMembers = team.members || [];
      if (!currentMembers.includes(playerName)) {
        await base44.entities.Team.update(teamId, {
          members: [...currentMembers, playerName]
        });
      }
    }
    
    queryClient.invalidateQueries(['teams', eventId]);
  };

  // Only auto-select if not locked
  useEffect(() => {
    if (teams.length > 0 && !selectedTeam && !lockedTeamId && !membership) {
      // Don't auto-select, let user choose
    }
  }, [teams, lockedTeamId, membership]);

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-[#1a2744] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#ff981f] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#1a2744] flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-[#ff981f] text-xl" style={{ fontFamily: "'RuneScape UF', sans-serif" }}>
          Event not found
        </p>
        <Link to={createPageUrl('Home')}>
          <OSRSButton>Back to Events</OSRSButton>
        </Link>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#1a2744] p-2 md:p-4"
      style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E")` 
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
                    <motion.div 
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex items-center justify-between mb-3 p-3 bg-gradient-to-b from-[#5b9bd5] to-[#4a8bc4] rounded-xl border-2 border-[#3a7bb4]"
                    >
                      <Link to={createPageUrl('Home')}>
                        <OSRSButton variant="secondary" className="text-sm px-3 py-1">
                          <ArrowLeft className="w-3 h-3 mr-1 inline" />
                          Back
                        </OSRSButton>
                      </Link>

                      {isAdmin && (
                        <div className="flex gap-2">
                          <OSRSButton variant="secondary" className="px-2 py-1" onClick={() => setShowPowerupsModal(true)} title="Manage Powerups">
                            <Zap className="w-4 h-4" />
                          </OSRSButton>
                          <OSRSButton variant="secondary" className="px-2 py-1" onClick={() => setShowManagePlayersModal(true)} title="Manage Players">
                            <Users className="w-4 h-4" />
                          </OSRSButton>
                          <OSRSButton variant="secondary" className="px-2 py-1" onClick={() => setShowAdminRoleModal(true)} title="Admin Roles">
                            <Crown className="w-4 h-4" />
                          </OSRSButton>
                          <Link to={createPageUrl('AdminPanel') + `?id=${eventId}`}>
                            <OSRSButton variant="secondary" className="px-2 py-1" title="Admin Panel">
                              <Settings className="w-4 h-4" />
                            </OSRSButton>
                          </Link>
                        </div>
                      )}
                    </motion.div>

        {/* Timer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-3"
        >
          <EventTimer 
            startTime={event.start_time} 
            endTime={event.end_time} 
            status={event.status} 
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {/* Left sidebar */}
                      <div className="lg:col-span-1 space-y-3">
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <TeamSelector 
                            teams={teams} 
                            selectedTeam={selectedTeam} 
                            onSelectTeam={handleSelectTeam}
                            lockedTeamId={lockedTeamId}
                            event={event}
                            user={user}
                          />
                        </motion.div>

                        {selectedTeam && (
                          <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <PowerupBar 
                              teamPowerups={selectedTeam.powerups}
                              powerupCooldowns={selectedTeam.powerup_cooldowns}
                              onUsePowerup={handleUsePowerup}
                              disabled={event.status !== 'active'}
                            />
                          </motion.div>
                        )}

                        <SubmissionsViewer 
                          eventId={eventId}
                          teams={teams}
                          tiles={event.tiles}
                          isAdmin={isAdmin}
                          onAdminAction={async (submissionId, status) => {
                            await base44.entities.TileCompletion.update(submissionId, { status });
                            queryClient.invalidateQueries(['submissions', eventId]);
                            queryClient.invalidateQueries(['completions', eventId]);
                          }}
                        />
                      </div>

          {/* Board */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <BingoBoard 
              tiles={event.tiles || []}
              teams={teams}
              completions={completions.filter(c => c.status === 'approved')}
              currentTeam={selectedTeam}
              onTileClick={handleTileClick}
            />
          </motion.div>

          {/* Leaderboard */}
                        <motion.div
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="lg:col-span-1 space-y-3"
                        >
                          <Leaderboard 
                            teams={teams} 
                            isAdmin={isAdmin}
                            onReset={async () => {
                              for (const team of teams) {
                                await base44.entities.Team.update(team.id, {
                                  total_points: 0,
                                  completed_tiles: []
                                });
                              }
                              const allCompletions = await base44.entities.TileCompletion.filter({ event_id: eventId });
                              for (const completion of allCompletions) {
                                await base44.entities.TileCompletion.delete(completion.id);
                              }
                              queryClient.invalidateQueries(['teams', eventId]);
                              queryClient.invalidateQueries(['completions', eventId]);
                            }}
                            onResetTeam={async (teamId) => {
                              await base44.entities.Team.update(teamId, {
                                total_points: 0,
                                completed_tiles: []
                              });
                              const teamCompletions = await base44.entities.TileCompletion.filter({ event_id: eventId, team_id: teamId });
                              for (const completion of teamCompletions) {
                                await base44.entities.TileCompletion.delete(completion.id);
                              }
                              queryClient.invalidateQueries(['teams', eventId]);
                              queryClient.invalidateQueries(['completions', eventId]);
                            }}
                          />
                          <EventRules rules={event.rules} />
                          <ActivityFeed 
                            eventId={eventId} 
                            teams={teams} 
                            tiles={event.tiles}
                            isAdmin={isAdmin}
                            onAdminPlayerClick={(name) => setAdminSelectPlayer(name)}
                          />
                        </motion.div>
                      </div>
      </div>

      <TileSubmitModal
        isOpen={showSubmitModal}
        onClose={() => {
          setShowSubmitModal(false);
          setSelectedTile(null);
          setUseDoublePowerup(false);
        }}
        tile={selectedTile}
        team={selectedTeam}
        onSubmit={(data) => submitCompletion.mutate(data)}
        useDoublePowerup={useDoublePowerup}
        setUseDoublePowerup={setUseDoublePowerup}
      />

      {/* Clan Chat */}
      <ClanChat 
        eventId={eventId} 
        teamId={selectedTeam?.id}
        user={user}
      />

      {/* Admin Player Select Modal */}
      <AdminPlayerSelect
        isOpen={!!adminSelectPlayer}
        onClose={() => setAdminSelectPlayer(null)}
        playerName={adminSelectPlayer}
        teams={teams}
        onSelectTeam={handleAdminAssignPlayer}
      />

      {/* Admin Role Modal */}
      <AdminRoleModal
        isOpen={showAdminRoleModal}
        onClose={() => setShowAdminRoleModal(false)}
      />

      {/* Manage Team Players Modal */}
      <ManageTeamPlayersModal
        isOpen={showManagePlayersModal}
        onClose={() => setShowManagePlayersModal(false)}
        eventId={eventId}
        teams={teams}
      />

      {/* Reveal Mystery Modal */}
      <RevealMysteryModal
        isOpen={showRevealModal}
        onClose={() => setShowRevealModal(false)}
        tiles={event?.tiles || []}
        onReveal={handleRevealMystery}
      />

      {/* Steal Completion Modal */}
      <StealCompletionModal
        isOpen={showStealModal}
        onClose={() => setShowStealModal(false)}
        completions={completions}
        tiles={event?.tiles || []}
        teams={teams}
        currentTeamId={selectedTeam?.id}
        onSteal={handleStealCompletion}
      />

      {/* Block Tile Modal */}
      <BlockTileModal
        isOpen={showBlockModal}
        onClose={() => {
          setShowBlockModal(false);
          setTileToBlock(null);
          setActivePowerup(null);
        }}
        teams={teams}
        currentTeamId={selectedTeam?.id}
        onBlock={handleBlockTile}
      />

      {/* Manage Team Powerups Modal */}
      <ManageTeamPowerupsModal
        isOpen={showPowerupsModal}
        onClose={() => setShowPowerupsModal(false)}
        teams={teams}
        eventId={eventId}
      />
    </div>
  );
}