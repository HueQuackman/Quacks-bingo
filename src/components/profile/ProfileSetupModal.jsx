import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OSRSButton from '@/components/bingo/OSRSButton';
import { User } from 'lucide-react';

export default function ProfileSetupModal({ isOpen, onComplete, sessionId, userEmail }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const createProfile = useMutation({
    mutationFn: async () => {
      // Check if username is taken
      const existing = await base44.entities.Profile.filter({ username });
      if (existing.length > 0) {
        throw new Error('Username already taken');
      }
      
      const profileData = {
        username,
        session_id: sessionId,
        user_email: userEmail || null
      };
      
      return base44.entities.Profile.create(profileData);
    },
    onSuccess: (profile) => {
      localStorage.setItem('bingo_profile_id', profile.id);
      localStorage.setItem('bingo_username', profile.username);
      queryClient.invalidateQueries(['profile']);
      onComplete(profile);
    },
    onError: (err) => {
      setError(err.message || 'Failed to create profile');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (username.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }
    
    createProfile.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] border-4 border-[#5c4833] text-white max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[#ff981f] text-xl flex items-center gap-2" style={{ fontFamily: "'RuneScape UF', sans-serif" }}>
            <User className="w-5 h-5" />
            Create Your Profile
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-[#c0a875]">Choose a Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="bg-black/30 border-[#5c4833] text-white placeholder:text-[#8a7a5a] mt-1"
              maxLength={20}
            />
            <p className="text-[#8a7a5a] text-xs mt-1">This will be your display name in events</p>
          </div>
          
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          
          <OSRSButton 
            type="submit" 
            className="w-full"
            disabled={createProfile.isPending}
          >
            {createProfile.isPending ? 'Creating...' : 'Create Profile'}
          </OSRSButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}