import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OSRSButton from '@/components/bingo/OSRSButton';
import { Users, UserMinus, UserPlus, ArrowRight } from 'lucide-react';

export default function ManageTeamPlayersModal({ isOpen, onClose, eventId, teams }) {
  const queryClient = useQueryClient();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [targetTeamId, setTargetTeamId] = useState('');

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['event-memberships', eventId],
    queryFn: () => base44.entities.TeamMembership.filter({ event_id: eventId }),
    enabled: isOpen && !!eventId
  });

  const removeFromTeam = useMutation({
    mutationFn: async (membership) => {
      await base44.entities.TeamMembership.delete(membership.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['event-memberships', eventId]);
      queryClient.invalidateQueries(['teams', eventId]);
      queryClient.invalidateQueries(['team-all-memberships']);
      setSelectedPlayer(null);
    }
  });

  const moveToTeam = useMutation({
    mutationFn: async ({ membership, newTeamId }) => {
      // Delete old membership
      await base44.entities.TeamMembership.delete(membership.id);
      // Create new membership
      await base44.entities.TeamMembership.create({
        event_id: eventId,
        team_id: newTeamId,
        user_email: membership.user_email,
        display_name: membership.display_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['event-memberships', eventId]);
      queryClient.invalidateQueries(['teams', eventId]);
      queryClient.invalidateQueries(['team-all-memberships']);
      setSelectedPlayer(null);
      setTargetTeamId('');
    }
  });

  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name || 'Unknown';
  const getTeamColor = (teamId) => teams.find(t => t.id === teamId)?.color || '#888';

  const groupedByTeam = teams.map(team => ({
    ...team,
    members: memberships.filter(m => m.team_id === team.id)
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] border-4 border-[#5c4833] text-white max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-[#ff981f] text-xl flex items-center gap-2" style={{ fontFamily: "'RuneScape UF', sans-serif" }}>
            <Users className="w-5 h-5" />
            Manage Team Players
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-[#ff981f] border-t-transparent rounded-full" />
            </div>
          ) : (
            groupedByTeam.map((team) => (
              <div key={team.id} className="bg-black/30 rounded-lg border border-[#5c4833] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="text-[#ff981f] font-bold">{team.name}</span>
                  <span className="text-[#8a7a5a] text-xs">({team.members.length})</span>
                </div>
                
                {team.members.length === 0 ? (
                  <p className="text-[#8a7a5a] text-sm pl-5">No players</p>
                ) : (
                  <div className="space-y-1 pl-5">
                    {team.members.map((member) => (
                      <div 
                        key={member.id}
                        className={`flex items-center justify-between p-2 rounded ${
                          selectedPlayer?.id === member.id ? 'bg-[#ff981f]/20 border border-[#ff981f]' : 'bg-black/20'
                        }`}
                      >
                        <span className="text-white text-sm">{member.display_name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setSelectedPlayer(selectedPlayer?.id === member.id ? null : member)}
                            className="p-1 text-blue-400 hover:bg-blue-600/20 rounded"
                            title="Move to another team"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${member.display_name} from ${team.name}?`)) {
                                removeFromTeam.mutate(member);
                              }
                            }}
                            className="p-1 text-red-400 hover:bg-red-600/20 rounded"
                            title="Remove from team"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {selectedPlayer && (
          <div className="border-t border-[#5c4833] pt-4 space-y-3">
            <p className="text-[#c0a875] text-sm">
              Move <span className="text-[#ff981f] font-bold">{selectedPlayer.display_name}</span> to:
            </p>
            <Select value={targetTeamId} onValueChange={setTargetTeamId}>
              <SelectTrigger className="bg-black/30 border-[#5c4833] text-white">
                <SelectValue placeholder="Select team..." />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2218] border-[#5c4833]">
                {teams.filter(t => t.id !== selectedPlayer.team_id).map((team) => (
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
            <div className="flex gap-2">
              <OSRSButton 
                variant="secondary" 
                onClick={() => { setSelectedPlayer(null); setTargetTeamId(''); }}
                className="flex-1 text-xs"
              >
                Cancel
              </OSRSButton>
              <OSRSButton 
                onClick={() => moveToTeam.mutate({ membership: selectedPlayer, newTeamId: targetTeamId })}
                disabled={!targetTeamId}
                className="flex-1 text-xs"
              >
                <UserPlus className="w-3 h-3 mr-1 inline" />
                Move
              </OSRSButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}