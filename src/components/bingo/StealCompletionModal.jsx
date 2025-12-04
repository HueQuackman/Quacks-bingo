import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy, Star } from 'lucide-react';
import OSRSButton from './OSRSButton';
import { motion } from 'framer-motion';

export default function StealCompletionModal({ 
  isOpen, 
  onClose, 
  completions,
  tiles,
  teams,
  currentTeamId,
  onSteal
}) {
  const [selectedCompletion, setSelectedCompletion] = useState(null);

  // Get completions from OTHER teams only
  const stealableCompletions = completions.filter(c => 
    c.status === 'approved' && c.team_id !== currentTeamId
  );

  const getTile = (tileId) => tiles.find(t => Number(t.id) === Number(tileId));
  const getTeam = (teamId) => teams.find(t => t.id === teamId);

  const handleSteal = () => {
    if (selectedCompletion) {
      onSteal(selectedCompletion);
      setSelectedCompletion(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] border-4 border-[#5c4833] text-white max-w-lg max-h-[80vh]"
        style={{ fontFamily: "'RuneScape UF', sans-serif" }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#ff981f] text-xl flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Steal Completion
          </DialogTitle>
          <DialogDescription className="text-[#c0a875]">
            Select a completed tile from another team to copy for your team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {stealableCompletions.length === 0 ? (
            <p className="text-[#8a7a5a] text-center py-8">
              No completions available to steal
            </p>
          ) : (
            stealableCompletions.map((completion) => {
              const tile = getTile(completion.tile_id);
              const team = getTeam(completion.team_id);
              const isSelected = selectedCompletion?.id === completion.id;

              return (
                <motion.button
                  key={completion.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCompletion(completion)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected 
                      ? 'border-[#ff981f] bg-[#ff981f]/20' 
                      : 'border-[#5c4833] bg-black/30 hover:border-[#8a7a5a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{tile?.task || 'Unknown tile'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: team?.color || '#888' }}
                        />
                        <span className="text-[#8a7a5a] text-sm">{team?.name || 'Unknown team'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-yellow-400" />
                      <span>{completion.points_awarded}</span>
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-[#5c4833]">
          <OSRSButton variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </OSRSButton>
          <OSRSButton 
            variant="success" 
            onClick={handleSteal}
            disabled={!selectedCompletion}
            className="flex-1"
          >
            Steal Completion
          </OSRSButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}