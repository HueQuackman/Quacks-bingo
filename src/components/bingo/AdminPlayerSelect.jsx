import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OSRSButton from './OSRSButton';
import { UserCheck } from 'lucide-react';

export default function AdminPlayerSelect({ isOpen, onClose, playerName, teams, onSelectTeam }) {
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const handleConfirm = () => {
    if (selectedTeamId) {
      onSelectTeam(selectedTeamId, playerName);
      onClose();
      setSelectedTeamId('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] border-4 border-[#5c4833] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#ff981f] text-xl flex items-center gap-2" style={{ fontFamily: "'RuneScape UF', sans-serif" }}>
            <UserCheck className="w-5 h-5" />
            Assign Player to Team
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-[#c0a875]">
            Assign <span className="text-[#ff981f] font-bold">{playerName}</span> to a team:
          </p>
          
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="bg-black/30 border-[#5c4833] text-white">
              <SelectValue placeholder="Select a team..." />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2218] border-[#5c4833]">
              {teams.map((team) => (
                <SelectItem 
                  key={team.id} 
                  value={team.id}
                  className="text-white hover:bg-[#ff981f]/20"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    {team.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-3 pt-2">
            <OSRSButton variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </OSRSButton>
            <OSRSButton 
              onClick={handleConfirm} 
              disabled={!selectedTeamId}
              className="flex-1"
            >
              Assign
            </OSRSButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}