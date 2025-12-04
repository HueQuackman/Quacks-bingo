import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Ban } from 'lucide-react';
import OSRSButton from './OSRSButton';

export default function BlockTileModal({ isOpen, onClose, teams, currentTeamId, onBlock }) {
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  
  const otherTeams = teams.filter(t => t.id !== currentTeamId);

  const handleConfirm = () => {
    if (selectedTeamId) {
      onBlock(selectedTeamId);
      setSelectedTeamId(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] border-4 border-[#5c4833] text-white max-w-sm"
        style={{ fontFamily: "'RuneScape UF', sans-serif" }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#ff981f] flex items-center gap-2">
            <Ban className="w-5 h-5" />
            Block Tile - Select Team
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-[#c0a875] text-sm">Which team do you want to block from this tile?</p>
          
          <div className="space-y-2">
            {otherTeams.map(team => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  selectedTeamId === team.id 
                    ? 'border-[#ff981f] bg-[#ff981f]/20' 
                    : 'border-[#5c4833] bg-black/30 hover:border-[#8a7a5a]'
                }`}
              >
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white/30"
                  style={{ backgroundColor: team.color }}
                />
                <span className="text-white font-medium">{team.name}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <OSRSButton variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </OSRSButton>
            <OSRSButton 
              onClick={handleConfirm} 
              disabled={!selectedTeamId}
              className="flex-1"
            >
              Block Team
            </OSRSButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}