import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, X, Users, Calendar } from 'lucide-react';
import OSRSButton from '@/components/bingo/OSRSButton';

export default function PendingInvitations({ user }) {
  const queryClient = useQueryClient();

  const { data: invitations = [] } = useQuery({
    queryKey: ['my-invitations', user?.email],
    queryFn: () => base44.entities.EventInvitation.filter({ 
      invitee_email: user.email, 
      status: 'pending' 
    }),
    enabled: !!user?.email,
    refetchInterval: 10000
  });

  const respondToInvite = useMutation({
    mutationFn: async ({ inviteId, accept, invite }) => {
      if (accept) {
        // Join the team
        await base44.entities.TeamMembership.create({
          event_id: invite.event_id,
          team_id: invite.team_id,
          user_email: user.email,
          display_name: user.display_name || user.full_name || 'Player'
        });
      }
      
      await base44.entities.EventInvitation.update(inviteId, {
        status: accept ? 'accepted' : 'declined'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-invitations']);
      queryClient.invalidateQueries(['membership']);
      queryClient.invalidateQueries(['teams']);
    }
  });

  if (!user || invitations.length === 0) return null;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#ff981f] p-4 mb-6"
      style={{ fontFamily: "'RuneScape UF', sans-serif" }}
    >
      <h3 className="text-[#ff981f] font-bold mb-3 flex items-center gap-2">
        <Mail className="w-5 h-5" />
        Pending Invitations ({invitations.length})
      </h3>

      <div className="space-y-3">
        <AnimatePresence>
          {invitations.map((invite) => (
            <motion.div
              key={invite.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-black/30 rounded-lg border border-[#5c4833] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-[#ff981f]" />
                    <span className="text-white font-bold truncate">{invite.team_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#8a7a5a]">
                    <Calendar className="w-3 h-3" />
                    <span className="truncate">{invite.event_name}</span>
                  </div>
                  <p className="text-xs text-[#c0a875] mt-1">
                    Invited by {invite.inviter_name}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => respondToInvite.mutate({ 
                      inviteId: invite.id, 
                      accept: true, 
                      invite 
                    })}
                    disabled={respondToInvite.isPending}
                    className="p-2 bg-green-600/20 rounded-lg text-green-400 hover:bg-green-600/30 transition-colors"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => respondToInvite.mutate({ 
                      inviteId: invite.id, 
                      accept: false, 
                      invite 
                    })}
                    disabled={respondToInvite.isPending}
                    className="p-2 bg-red-600/20 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}