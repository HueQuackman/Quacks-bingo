import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const BADGES = {
  first_tile: '⚔️',
  ten_tiles: '🎯',
  fifty_tiles: '👑',
  hundred_points: '💰',
  five_hundred_points: '💎',
  first_event: '🎪',
  five_events: '🏆'
};

export default function PlayerLink({ playerName, className = '', showBadge = true, onAdminClick, isAdmin = false }) {
  const { data: users = [] } = useQuery({
    queryKey: ['user-badge', playerName],
    queryFn: () => base44.entities.User.filter({ display_name: playerName }),
    enabled: showBadge && !!playerName,
    staleTime: 60000
  });

  const user = users[0];
  const badge = user?.selected_badge ? BADGES[user.selected_badge] : null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isAdmin && onAdminClick) {
      e.preventDefault();
      onAdminClick(playerName);
    }
  };

  return (
    <Link
      to={createPageUrl('UserProfile') + `?name=${encodeURIComponent(playerName)}`}
      className={`text-[#ff981f] hover:text-yellow-400 hover:underline transition-colors ${className} ${isAdmin ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {badge && <span className="mr-1">{badge}</span>}
      {playerName}
    </Link>
  );
}