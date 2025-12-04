import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Star, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import OSRSButton from './OSRSButton';
import { motion } from 'framer-motion';

export default function TileSubmitModal({ 
  isOpen, 
  onClose, 
  tile, 
  team, 
  onSubmit,
  useDoublePowerup,
  setUseDoublePowerup
}) {
  const [playerName, setPlayerName] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setScreenshotUrl(file_url);
      setScreenshot(file);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleSubmit = () => {
    console.log('handleSubmit called', { playerName, screenshotUrl, useDoublePowerup, tile });
    if (!playerName || !screenshotUrl || !tile) {
      console.log('Missing required fields');
      return;
    }
    
    onSubmit({
      tileId: Number(tile.id),
      points: tile.points,
      player_name: playerName,
      screenshot_url: screenshotUrl,
      used_double_points: useDoublePowerup
    });
    
    setPlayerName('');
    setScreenshot(null);
    setScreenshotUrl('');
    setUseDoublePowerup(false);
    onClose();
  };

  const hasDoublePowerup = team?.powerups?.double_points > 0;
  const finalPoints = useDoublePowerup ? tile?.points * 2 : tile?.points;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] border-4 border-[#5c4833] text-white max-w-md"
        style={{ fontFamily: "'RuneScape UF', sans-serif" }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#ff981f] text-xl">Submit Completion</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-black/30 rounded-lg p-4 border border-[#5c4833]">
            <h3 className="text-[#ff981f] font-bold mb-2">Task:</h3>
            <p className="text-white">{tile?.task}</p>
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-300">{finalPoints} points</span>
              {useDoublePowerup && (
                <span className="text-green-400 text-sm">(2x bonus!)</span>
              )}
            </div>
          </div>

          {hasDoublePowerup && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-lg border border-yellow-600/50"
            >
              <input
                type="checkbox"
                id="doublePoints"
                checked={useDoublePowerup}
                onChange={(e) => setUseDoublePowerup(e.target.checked)}
                className="w-5 h-5 accent-yellow-500"
              />
              <label htmlFor="doublePoints" className="flex items-center gap-2 cursor-pointer">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300">Use 2x Points Powerup</span>
              </label>
            </motion.div>
          )}

          <div className="space-y-2">
            <Label className="text-[#ff981f]">Player Name (RSN)</Label>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your RuneScape name"
              className="bg-black/40 border-[#5c4833] text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#ff981f]">Screenshot Proof</Label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="screenshot-upload"
              />
              <label
                htmlFor="screenshot-upload"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#5c4833] rounded-lg cursor-pointer hover:bg-black/20 transition-colors"
              >
                {uploading ? (
                  <div className="animate-spin w-8 h-8 border-2 border-[#ff981f] border-t-transparent rounded-full" />
                ) : screenshot ? (
                  <div className="text-center">
                    <img 
                      src={screenshotUrl} 
                      alt="Preview" 
                      className="max-h-32 rounded-lg mb-2"
                    />
                    <p className="text-green-400 text-sm">✓ {screenshot.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#ff981f] mb-2" />
                    <p className="text-gray-400 text-sm">Click to upload screenshot</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <OSRSButton variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </OSRSButton>
            <OSRSButton 
              variant="success" 
              onClick={handleSubmit}
              disabled={!playerName || !screenshotUrl}
              className="flex-1"
            >
              Submit
            </OSRSButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}