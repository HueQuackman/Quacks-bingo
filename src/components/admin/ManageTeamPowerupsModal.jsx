import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OSRSButton from '@/components/bingo/OSRSButton';
import { Zap, Shield, Eye, Copy } from 'lucide-react';

const POWERUP_CONFIG = [
  { id: 'double_points', name: '2x Points', icon: Zap, color: 'text-yellow-400' },
  { id: 'block_tile', name: 'Block Tile', icon: Shield, color: 'text-red-400' },
  { id: 'reveal_mystery', name: 'Reveal Mystery', icon: Eye, color: 'text-purple-400' },
  { id: 'steal_completion', name: 'Steal Completion', icon: Copy, color: 'text-blue-400' },
];

export default function ManageTeamPowerupsModal({ isOpen, onClose, teams, eventId }) {
  const queryClient = useQueryClient();
  const [teamPowerups, setTeamPowerups] = useState({});

  // Initialize state when modal opens
  React.useEffect(() => {
    if (isOpen && teams.length > 0) {
      const initial = {};
      teams.forEach(team => {
        initial[team.id] = {
          double_points: team.powerups?.double_points || 0,
          block_tile: team.powerups?.block_tile || 0,
          reveal_mystery: team.powerups?.reveal_mystery || 0,
          steal_completion: team.powerups?.steal_completion || 0,
        };
      });
      setTeamPowerups(initial);
    }
  }, [isOpen, teams]);

  const updatePowerups = useMutation({
    mutationFn: async () => {
      for (const team of teams) {
        await base44.entities.Team.update(team.id, {
          powerups: teamPowerups[team.id]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teams', eventId]);
      onClose();
    }
  });

  const handleChange = (teamId, powerupId, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setTeamPowerups(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [powerupId]: numValue
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] border-4 border-[#5c4833] text-white max-w-2xl max-h-[80vh] overflow-y-auto"
        style={{ fontFamily: "'RuneScape UF', sans-serif" }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#ff981f] text-xl flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Manage Team Powerups
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {teams.map(team => (
            <div key={team.id} className="bg-black/30 rounded-lg p-4 border border-[#5c4833]">
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: team.color }}
                />
                <h3 className="text-[#ff981f] font-bold">{team.name}</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {POWERUP_CONFIG.map(powerup => {
                  const Icon = powerup.icon;
                  return (
                    <div key={powerup.id} className="space-y-1">
                      <Label className="text-xs text-[#8a7a5a] flex items-center gap-1">
                        <Icon className={`w-3 h-3 ${powerup.color}`} />
                        {powerup.name}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={teamPowerups[team.id]?.[powerup.id] || 0}
                        onChange={(e) => handleChange(team.id, powerup.id, e.target.value)}
                        className="bg-black/40 border-[#5c4833] text-white h-8 text-center"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t border-[#5c4833]">
          <OSRSButton variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </OSRSButton>
          <OSRSButton 
            variant="success" 
            onClick={() => updatePowerups.mutate()}
            disabled={updatePowerups.isPending}
            className="flex-1"
          >
            {updatePowerups.isPending ? 'Saving...' : 'Save Changes'}
          </OSRSButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}