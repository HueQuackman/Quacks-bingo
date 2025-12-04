import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import PlayerLink from './PlayerLink';

export default function TeamSelector({ teams, selectedTeam, onSelectTeam, lockedTeamId }) {
  const [expandedTeam, setExpandedTeam] = useState(null);
  const isLocked = !!lockedTeamId;

  return (
    <div 
      className="bg-gradient-to-b from-[#5b9bd5] to-[#4a8bc4] p-4 rounded-xl border-4 border-[#3a7bb4] shadow-2xl"
      style={{ fontFamily: "'RuneScape UF', sans-serif" }}
    >
      <div className="flex items-center justify-between mb-3">
                <h3 className="text-black font-bold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {isLocked ? 'Your Team' : 'Select Your Team'}
                </h3>
              </div>
              {isLocked && (
                <p className="text-gray-700 text-xs mb-3">Team locked for this event</p>
              )}
      
      <div className="space-y-2">
        {teams.map((team) => (
          <div key={team.id}>
            <motion.button
              whileHover={!isLocked ? { scale: 1.01 } : {}}
              whileTap={!isLocked ? { scale: 0.99 } : {}}
              onClick={() => !isLocked && onSelectTeam(team)}
              disabled={isLocked && team.id !== lockedTeamId}
              className={`relative w-full p-3 rounded-lg border-2 transition-all ${
                selectedTeam?.id === team.id 
                  ? 'border-white bg-black/40' 
                  : isLocked && team.id !== lockedTeamId
                    ? 'border-[#3a7bb4]/30 bg-black/10 opacity-50 cursor-not-allowed'
                    : 'border-[#3a7bb4]/50 bg-black/20 hover:bg-black/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white/30"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="text-white font-bold truncate">{team.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                        {selectedTeam?.id === team.id && (
                          <Check className="w-4 h-4 text-green-400" />
                        )}
                        <Link
                          to={createPageUrl('TeamPage') + `?id=${team.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-white/10 rounded"
                          title="View Team Page"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-700 hover:text-black" />
                        </Link>
                        {team.members?.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTeam(expandedTeam === team.id ? null : team.id);
                            }}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            {expandedTeam === team.id ? (
                              <ChevronUp className="w-4 h-4 text-gray-700" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-700" />
                            )}
                          </button>
                        )}
                      </div>
              </div>
            </motion.button>
            
            <AnimatePresence>
              {expandedTeam === team.id && team.members?.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 py-2 space-y-1">
                    {team.members.map((member, idx) => (
                      <div key={idx} className="text-sm">
                        <PlayerLink playerName={member} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
            ))}
            </div>


            </div>
            );
            }