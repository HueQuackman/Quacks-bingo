import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Eye, HelpCircle } from 'lucide-react';
import OSRSButton from './OSRSButton';
import { motion } from 'framer-motion';

export default function RevealMysteryModal({ 
  isOpen, 
  onClose, 
  tiles,
  onReveal
}) {
  const [selectedTile, setSelectedTile] = useState(null);

  // Get mystery tiles that haven't been revealed yet
  const mysteryTiles = tiles.filter(t => t.is_mystery && !t.revealed);

  const handleReveal = () => {
    if (selectedTile) {
      onReveal(selectedTile);
      setSelectedTile(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] border-4 border-[#5c4833] text-white max-w-md"
        style={{ fontFamily: "'RuneScape UF', sans-serif" }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#ff981f] text-xl flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Reveal Mystery Tile
          </DialogTitle>
          <DialogDescription className="text-[#c0a875]">
            Select a mystery tile to reveal its hidden task
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto py-2">
          {mysteryTiles.length === 0 ? (
            <p className="text-[#8a7a5a] text-center py-8 col-span-3">
              No mystery tiles to reveal
            </p>
          ) : (
            mysteryTiles.map((tile) => {
              const isSelected = selectedTile?.id === tile.id;

              return (
                <motion.button
                  key={tile.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTile(tile)}
                  className={`aspect-square p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                    isSelected 
                      ? 'border-[#ff981f] bg-[#ff981f]/20' 
                      : 'border-[#5c4833] bg-black/30 hover:border-[#8a7a5a]'
                  }`}
                >
                  <HelpCircle className="w-8 h-8 text-purple-400 mb-1" />
                  <span className="text-[#8a7a5a] text-xs">Tile #{Number(tile.id) + 1}</span>
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
            onClick={handleReveal}
            disabled={!selectedTile}
            className="flex-1"
          >
            Reveal Tile
          </OSRSButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}