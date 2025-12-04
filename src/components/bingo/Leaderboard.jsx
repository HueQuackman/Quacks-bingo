import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Users, RotateCcw, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import OSRSButton from './OSRSButton';

export default function Leaderboard({ teams, isAdmin, onReset, onResetTeam }) {
  const sortedTeams = [...teams].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  const maxPoints = sortedTeams[0]?.total_points || 1;

  const trophyColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

  return (
    <div 
      className="bg-gradient-to-b from-[#5b9bd5] to-[#4a8bc4] p-4 rounded-xl border-4 border-[#3a7bb4] shadow-2xl"
      style={{ fontFamily: "'RuneScape UF', sans-serif" }}
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#3a7bb4]">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl text-black font-bold">Leaderboard</h2>
        </div>
        {isAdmin && onReset && (
          <button
            onClick={() => {
              if (confirm('Reset all team points and completed tiles? This cannot be undone.')) {
                onReset();
              }
            }}
            className="p-1.5 rounded bg-red-900/50 hover:bg-red-800 text-red-400 transition-colors"
            title="Reset Leaderboard"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTeams.map((team, index) => (
            <motion.div
              key={team.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-[#3a7bb4]/50">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  {index < 3 ? (
                    <Trophy 
                      className="w-6 h-6" 
                      style={{ color: trophyColors[index] }}
                    />
                  ) : (
                    <span className="text-[#c0c0c0] font-bold">{index + 1}</span>
                  )}
                </div>

                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white/30"
                  style={{ backgroundColor: team.color }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold truncate">{team.name}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-300 font-bold">{team.total_points || 0}</span>
                    </div>
                  </div>
                  
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((team.total_points || 0) / maxPoints) * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 ml-11">
                <div className="flex items-center gap-1 text-xs text-[#a0a0a0]">
                  <Users className="w-3 h-3" />
                  <span>{team.members?.length || 0} members</span>
                  <span className="mx-1">•</span>
                  <span>{team.completed_tiles?.length || 0} tiles</span>
                </div>
                {isAdmin && onResetTeam && (
                  <button
                    onClick={() => {
                      if (confirm(`Reset "${team.name}" points and tiles?`)) {
                        onResetTeam(team.id);
                      }
                    }}
                    className="p-1 rounded bg-red-900/50 hover:bg-red-800 text-red-400 transition-colors"
                    title={`Reset ${team.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}