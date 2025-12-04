import React from 'react';
import { motion } from 'framer-motion';
import { Ban, HelpCircle, Star, Zap, Shield, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

const difficultyColors = {
  easy: 'from-green-700 to-green-900 border-green-600',
  medium: 'from-yellow-600 to-yellow-800 border-yellow-500',
  hard: 'from-orange-600 to-orange-800 border-orange-500',
  elite: 'from-red-700 to-red-900 border-red-500',
  master: 'from-purple-700 to-purple-900 border-purple-500'
};

const typeIcons = {
  normal: null,
  double_points: Zap,
  mystery: HelpCircle,
  boss: Skull
};

export default function BingoTile({ 
  tile, 
  teamColor, 
  isCompleted, 
  isBlocked,
  blockerColor,
  onClick,
  canReveal 
}) {
  const Icon = typeIcons[tile.type];
  const isMystery = tile.is_mystery && !tile.revealed;

  return (
    <motion.div
      whileHover={{ scale: isBlocked ? 1 : 1.05 }}
      whileTap={{ scale: isBlocked ? 1 : 0.95 }}
      onClick={() => !isBlocked && onClick({ ...tile, id: Number(tile.id) })}
      className={cn(
        "relative aspect-square cursor-pointer rounded-lg border-2 p-2 flex flex-col items-center justify-center text-center transition-all",
        "bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_8px_rgba(0,0,0,0.4)]",
        isMystery ? 'from-[#2a2a3a] to-[#1a1a2a] border-[#4a4a6a]' : difficultyColors[tile.difficulty],
        isCompleted && "ring-4 ring-offset-2 ring-offset-[#3d3224]",
        isBlocked && "opacity-50 cursor-not-allowed"
      )}
      style={{ 
        ringColor: teamColor,
        fontFamily: "'RuneScape UF', sans-serif"
      }}
    >
      {isBlocked && (
        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center z-10">
          <Ban className="w-10 h-10" style={{ color: blockerColor || '#ef4444' }} />
        </div>
      )}
      
      {isMystery ? (
        <div className="flex flex-col items-center gap-2">
          <HelpCircle className="w-8 h-8 text-purple-400 animate-pulse" />
          <span className="text-purple-300 text-xs">Mystery</span>
          {canReveal && (
            <span className="text-[10px] text-purple-400">Click to reveal</span>
          )}
        </div>
      ) : (
        <>
          {Icon && (
            <Icon className={cn(
              "w-4 h-4 absolute top-1 right-1",
              tile.type === 'double_points' && "text-yellow-300",
              tile.type === 'boss' && "text-red-400"
            )} />
          )}
          <span className="text-[11px] leading-tight text-white drop-shadow-lg line-clamp-3">
            {tile.task}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-300 text-xs font-bold">{tile.points}</span>
          </div>
        </>
      )}
      
      {isCompleted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center"
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: teamColor }}
          >
            <span className="text-white text-xl">✓</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}