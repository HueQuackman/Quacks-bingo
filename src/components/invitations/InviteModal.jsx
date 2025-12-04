import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UserPlus, Send, Loader2 } from 'lucide-react';
import OSRSButton from '@/components/bingo/OSRSButton';

export default function InviteModal({ isOpen, onClose, event, team, user }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  const sendInvite = useMutation({
    mutationFn: async () => {
      // Check if already invited
      const existing = await base44.entities.EventInvitation.filter({
        event_id: event.id,
        team_id: team.id,
        invitee_email: email.toLowerCase(),
        status: 'pending'
      });
      
      if (existing.length > 0) {
        throw new Error('This user already has a pending invitation');
      }

      // Check if already on a team
      const membership = await base44.entities.TeamMembership.filter({
        event_id: event.id,
        user_email: email.toLowerCase()
      });

      if (membership.length > 0) {
        throw new Error('This user is already on a team for this event');
      }

      return base44.entities.EventInvitation.create({
        event_id: event.id,
        team_id: team.id,
        team_name: team.name,
        event_name: event.name,
        inviter_email: user.email,
        inviter_name: user.display_name || user.full_name,
        invitee_email: email.toLowerCase(),
        status: 'pending'
      });
    },
    onSuccess: () => {
      setSuccess('Invitation sent!');
      setEmail('');
      setError('');
      queryClient.invalidateQueries(['invitations']);
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    },
    onError: (err) => {
      setError(err.message || 'Failed to send invitation');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }
    if (email.toLowerCase() === user.email.toLowerCase()) {
      setError('You cannot invite yourself');
      return;
    }
    sendInvite.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] border-4 border-[#5c4833] text-white max-w-md"
        style={{ fontFamily: "'RuneScape UF', sans-serif" }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#ff981f] flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite to {team?.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-[#c0a875] text-sm">
            Invite a player to join your team for {event?.name}
          </p>

          <div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter player's email"
              className="bg-black/40 border-[#5c4833] text-white"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-sm">{success}</p>
          )}

          <div className="flex gap-3">
            <OSRSButton variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </OSRSButton>
            <OSRSButton 
              onClick={handleSubmit}
              disabled={sendInvite.isPending}
              className="flex-1"
            >
              {sendInvite.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              ) : (
                <Send className="w-4 h-4 inline mr-2" />
              )}
              Send Invite
            </OSRSButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}