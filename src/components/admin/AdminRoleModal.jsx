import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import OSRSButton from '@/components/bingo/OSRSButton';
import { Shield, ShieldCheck, Search, Crown, Trash2, Clock } from 'lucide-react';

export default function AdminRoleModal({ isOpen, onClose }) {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.Profile.list(),
    enabled: isOpen
  });

  const updateRole = useMutation({
    mutationFn: async ({ profileId, isAdmin }) => {
      await base44.entities.Profile.update(profileId, { is_admin: isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-profiles']);
      queryClient.invalidateQueries(['profile']);
    }
  });

  const banUser = useMutation({
    mutationFn: async (profileId) => {
      const banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await base44.entities.Profile.update(profileId, { banned_until: banUntil });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-profiles']);
    }
  });

  const unbanUser = useMutation({
    mutationFn: async (profileId) => {
      await base44.entities.Profile.update(profileId, { banned_until: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-profiles']);
    }
  });

  const deleteProfile = useMutation({
    mutationFn: async (profileId) => {
      await base44.entities.Profile.delete(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-profiles']);
    }
  });

  const filteredProfiles = profiles.filter(p => 
    p.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] border-4 border-[#5c4833] text-white max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-[#ff981f] text-xl flex items-center gap-2" style={{ fontFamily: "'RuneScape UF', sans-serif" }}>
            <Crown className="w-5 h-5" />
            Manage Admin Roles
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7a5a]" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-black/30 border-[#5c4833] text-white placeholder:text-[#8a7a5a]"
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-[#ff981f] border-t-transparent rounded-full mx-auto" />
              </div>
            ) : filteredProfiles.length === 0 ? (
              <p className="text-[#8a7a5a] text-center py-4">No profiles found</p>
            ) : (
              filteredProfiles.map((profile) => {
                                    const isBanned = profile.banned_until && new Date(profile.banned_until) > new Date();
                                    return (
                                      <div 
                                        key={profile.id}
                                        className={`flex items-center justify-between p-3 bg-black/30 rounded-lg border ${isBanned ? 'border-orange-500/50' : 'border-[#5c4833]'}`}
                                      >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            isBanned ? 'bg-orange-500/20' : profile.is_admin ? 'bg-[#ff981f]/20' : 'bg-[#5c4833]/50'
                                          }`}>
                                            {isBanned ? (
                                              <Clock className="w-4 h-4 text-orange-400" />
                                            ) : profile.is_admin ? (
                                              <ShieldCheck className="w-4 h-4 text-[#ff981f]" />
                                            ) : (
                                              <Shield className="w-4 h-4 text-[#8a7a5a]" />
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-white font-medium truncate">
                                              {profile.username}
                                            </p>
                                            {isBanned && (
                                              <p className="text-orange-400 text-xs">
                                                Banned until {new Date(profile.banned_until).toLocaleString()}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex gap-2">
                                          {isBanned ? (
                                            <OSRSButton
                                              variant="success"
                                              onClick={() => unbanUser.mutate(profile.id)}
                                              className="text-xs px-3 py-1"
                                            >
                                              Unban
                                            </OSRSButton>
                                          ) : (
                                            <>
                                              <OSRSButton
                                                variant={profile.is_admin ? 'danger' : 'success'}
                                                onClick={() => updateRole.mutate({ 
                                                  profileId: profile.id, 
                                                  isAdmin: !profile.is_admin 
                                                })}
                                                className="text-xs px-3 py-1"
                                              >
                                                {profile.is_admin ? 'Remove Admin' : 'Make Admin'}
                                              </OSRSButton>
                                              <OSRSButton
                                                variant="secondary"
                                                onClick={() => {
                                                  if (confirm(`Ban "${profile.username}" for 24 hours?`)) {
                                                    banUser.mutate(profile.id);
                                                  }
                                                }}
                                                className="text-xs px-2 py-1"
                                                title="Ban for 24 hours"
                                              >
                                                <Clock className="w-3 h-3" />
                                              </OSRSButton>
                                            </>
                                          )}
                                          <OSRSButton
                                            variant="danger"
                                            onClick={() => {
                                              if (confirm(`Delete profile "${profile.username}"?`)) {
                                                deleteProfile.mutate(profile.id);
                                              }
                                            }}
                                            className="text-xs px-2 py-1"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </OSRSButton>
                                        </div>
                                      </div>
                                    );
                                  })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}