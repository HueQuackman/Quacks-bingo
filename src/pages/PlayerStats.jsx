import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Star, CheckSquare, Calendar, Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, RotateCcw, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OSRSButton from '@/components/bingo/OSRSButton';
import PlayerLink from '@/components/bingo/PlayerLink';

const BADGES = [
  { id: 'first_tile', name: 'First Blood', icon: '⚔️', threshold: (stats) => stats.tiles >= 1 },
  { id: 'ten_tiles', name: 'Tile Hunter', icon: '🎯', threshold: (stats) => stats.tiles >= 10 },
  { id: 'fifty_tiles', name: 'Tile Master', icon: '👑', threshold: (stats) => stats.tiles >= 50 },
  { id: 'hundred_points', name: 'Point Collector', icon: '💰', threshold: (stats) => stats.points >= 100 },
  { id: 'five_hundred_points', name: 'Point Hoarder', icon: '💎', threshold: (stats) => stats.points >= 500 },
  { id: 'first_event', name: 'Event Rookie', icon: '🎪', threshold: (stats) => stats.events >= 1 },
  { id: 'five_events', name: 'Event Veteran', icon: '🏆', threshold: (stats) => stats.events >= 5 }
];

export default function PlayerStats() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('points');
  const [sortDir, setSortDir] = useState('desc');
  const [filterBadge, setFilterBadge] = useState('all');
  const [profile, setProfile] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const profileId = localStorage.getItem('bingo_profile_id');
    if (profileId) {
      base44.entities.Profile.filter({ id: profileId }).then(profiles => {
        if (profiles.length > 0) setProfile(profiles[0]);
      });
    }
  }, []);

  const isAdmin = profile?.is_admin;

  const handleResetLeaderboard = async () => {
    if (!confirm('Reset ALL player stats? This will delete all approved completions and reset all team scores. This cannot be undone.')) return;
    
    // Get all completions and teams
    const allCompletions = await base44.entities.TileCompletion.list();
    const allTeams = await base44.entities.Team.list();
    
    // Delete all completions
    for (const completion of allCompletions) {
      await base44.entities.TileCompletion.delete(completion.id);
    }
    
    // Reset all teams
    for (const team of allTeams) {
      await base44.entities.Team.update(team.id, {
        total_points: 0,
        completed_tiles: []
      });
    }
    
    queryClient.invalidateQueries(['all-completions']);
  };

  const handleResetPlayer = async (playerName) => {
    if (!confirm(`Reset all stats for "${playerName}"? This will delete all their completions.`)) return;
    
    const playerCompletions = await base44.entities.TileCompletion.filter({ player_name: playerName });
    for (const completion of playerCompletions) {
      await base44.entities.TileCompletion.delete(completion.id);
    }
    
    queryClient.invalidateQueries(['all-completions']);
  };

  const { data: completions = [], isLoading } = useQuery({
    queryKey: ['all-completions'],
    queryFn: () => base44.entities.TileCompletion.filter({ status: 'approved' })
  });

  // Aggregate player stats
  const playerStats = React.useMemo(() => {
    const stats = {};
    
    completions.forEach(completion => {
      const name = completion.player_name;
      if (!stats[name]) {
        stats[name] = {
          name,
          points: 0,
          tiles: 0,
          events: new Set()
        };
      }
      stats[name].points += completion.points_awarded || 0;
      stats[name].tiles += 1;
      stats[name].events.add(completion.event_id);
    });

    return Object.values(stats).map(player => ({
      ...player,
      events: player.events.size,
      badges: BADGES.filter(b => b.threshold(player)).map(b => ({ id: b.id, icon: b.icon, name: b.name }))
    }));
  }, [completions]);

  // Filter and sort
  const filteredStats = React.useMemo(() => {
    let result = [...playerStats];

    // Search filter
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Badge filter
    if (filterBadge !== 'all') {
      result = result.filter(p => p.badges.some(b => b.id === filterBadge));
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [playerStats, searchQuery, sortBy, sortDir, filterBadge]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4 text-[#8a7a5a]" />;
    return sortDir === 'desc' 
      ? <ArrowDown className="w-4 h-4 text-[#ff981f]" />
      : <ArrowUp className="w-4 h-4 text-[#ff981f]" />;
  };

  return (
    <div 
      className="min-h-screen bg-[#1a2744] p-4 md:p-8"
      style={{ 
        fontFamily: "'RuneScape UF', sans-serif",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23ffffff' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E")` 
      }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <Link to={createPageUrl('Home')}>
            <OSRSButton variant="secondary" className="text-xs px-3 py-1">
              <ArrowLeft className="w-3 h-3 mr-1 inline" />
              Back
            </OSRSButton>
          </Link>
          <h1 className="text-2xl md:text-3xl text-[#ff981f] font-bold">
            <Trophy className="w-8 h-8 inline mr-2" />
            Player Statistics
          </h1>
          <div className="w-24">
            {isAdmin && (
              <button
                onClick={handleResetLeaderboard}
                className="p-2 rounded bg-red-900/50 hover:bg-red-800 text-red-400 transition-colors"
                title="Reset All Stats"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7a5a]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="bg-black/40 border-[#5c4833] text-white pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#8a7a5a]" />
              <Select value={filterBadge} onValueChange={setFilterBadge}>
                <SelectTrigger className="w-48 bg-black/40 border-[#5c4833] text-white">
                  <SelectValue placeholder="Filter by badge" />
                </SelectTrigger>
                <SelectContent className="bg-[#3d3224] border-[#5c4833]">
                  <SelectItem value="all" className="text-white">All Players</SelectItem>
                  {BADGES.map(badge => (
                    <SelectItem key={badge.id} value={badge.id} className="text-white">
                      {badge.icon} {badge.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Stats Table */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] overflow-hidden"
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-[#ff981f] border-t-transparent rounded-full" />
            </div>
          ) : filteredStats.length === 0 ? (
            <div className="text-center py-12 text-[#8a7a5a]">
              {searchQuery || filterBadge !== 'all' ? 'No players match your filters' : 'No player data yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#5c4833] bg-black/30">
                    <th className="text-left p-4 text-[#ff981f]">#</th>
                    <th className="text-left p-4 text-[#ff981f]">Player</th>
                    <th className="p-4">
                      <button 
                        onClick={() => toggleSort('points')}
                        className="flex items-center gap-1 text-[#ff981f] hover:text-yellow-400 mx-auto"
                      >
                        <Star className="w-4 h-4" />
                        Points
                        <SortIcon field="points" />
                      </button>
                    </th>
                    <th className="p-4">
                      <button 
                        onClick={() => toggleSort('tiles')}
                        className="flex items-center gap-1 text-[#ff981f] hover:text-yellow-400 mx-auto"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Tiles
                        <SortIcon field="tiles" />
                      </button>
                    </th>
                    <th className="p-4">
                      <button 
                        onClick={() => toggleSort('events')}
                        className="flex items-center gap-1 text-[#ff981f] hover:text-yellow-400 mx-auto"
                      >
                        <Calendar className="w-4 h-4" />
                        Events
                        <SortIcon field="events" />
                      </button>
                    </th>
                    <th className="text-left p-4 text-[#ff981f]">Badges</th>
                    {isAdmin && <th className="p-4 text-[#ff981f]"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.map((player, index) => (
                    <motion.tr
                      key={player.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-[#5c4833]/50 hover:bg-black/20 transition-colors"
                    >
                      <td className="p-4">
                        {index < 3 ? (
                          <span className={`text-lg ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="text-[#8a7a5a]">{index + 1}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <PlayerLink playerName={player.name} />
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-yellow-400 font-bold">{player.points.toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-green-400">{player.tiles}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-blue-400">{player.events}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {player.badges.slice(0, 5).map(badge => (
                            <span 
                              key={badge.id} 
                              className="text-lg cursor-help"
                              title={badge.name}
                            >
                              {badge.icon}
                            </span>
                          ))}
                          {player.badges.length > 5 && (
                            <span className="text-[#8a7a5a] text-sm">+{player.badges.length - 5}</span>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleResetPlayer(player.name)}
                            className="p-1.5 rounded bg-red-900/50 hover:bg-red-800 text-red-400 transition-colors"
                            title={`Reset ${player.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          {filteredStats.length > 0 && (
            <div className="p-4 bg-black/20 border-t border-[#5c4833] flex justify-between text-sm text-[#8a7a5a]">
              <span>Showing {filteredStats.length} players</span>
              <span>
                Total: {filteredStats.reduce((sum, p) => sum + p.points, 0).toLocaleString()} pts | {filteredStats.reduce((sum, p) => sum + p.tiles, 0)} tiles
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}