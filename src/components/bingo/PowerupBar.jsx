import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Eye, Copy } from 'lucide-react';

const powerups = [
  { 
    id: 'double_points', 
    icon: Zap, 
    name: '2x Points', 
    description: 'Double the points for your next tile completion',
    color: 'from-yellow-500 to-orange-600'
  },
  { 
    id: 'reveal_mystery', 
    icon: Eye, 
    name: 'Reveal Mystery', 
    description: 'Reveal any mystery tile on the board',
    color: 'from-blue-500 to-cyan-600'
  },
  { 
    id: 'steal_completion', 
    icon: Copy, 
    name: 'Steal Completion', 
    description: "Copy an opponent's completed tile for your team",
    color: 'from-purple-500 to-pink-600'
  },
  { 
    id: 'block_tile', 
    icon: Shield, 
    name: 'Block Tile', 
    description: 'Block a tile from being completed by opponents',
    color: 'from-red-500 to-red-700'
  }
];

export default function PowerupBar({ teamPowerups, onUsePowerup, disabled }) {
  const handleUsePowerup = (powerupId) => {
    const count = teamPowerups?.[powerupId] || 0;
    if (count > 0 && !disabled) {
      onUsePowerup(powerupId);
    }
  };

  return (
    <div 
        className="bg-gradient-to-b from-[#5b9bd5] to-[#4a8bc4] p-4 rounded-xl border-4 border-[#3a7bb4] shadow-2xl"
        style={{ fontFamily: "'RuneScape UF', sans-serif" }}
      >
        <h3 className="text-black font-bold mb-3 text-center">Powerups</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {powerups.map((powerup) => {
            const count = teamPowerups?.[powerup.id] || 0;
            const Icon = powerup.icon;
            
            return (
              <motion.button
                key={powerup.id}
                whileHover={{ scale: count === 0 ? 1 : 1.05 }}
                whileTap={{ scale: count === 0 ? 1 : 0.95 }}
                onClick={() => count > 0 && handleUsePowerup(powerup.id)}
                disabled={count === 0 || disabled}
                className={`relative p-3 rounded-xl bg-gradient-to-b ${powerup.color} border-2 border-black/30 shadow-lg transition-all ${count === 0 ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-white drop-shadow-lg" />
                  <span className="text-white text-xs truncate">{powerup.name}</span>
                </div>
                
                <div className="absolute -top-2 -right-2 bg-black rounded-full w-6 h-6 flex items-center justify-center border-2 border-[#3a7bb4]">
                  <span className="text-xs font-bold text-white">{count}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
  );
}