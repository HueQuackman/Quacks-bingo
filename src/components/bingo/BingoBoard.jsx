import React from 'react';
import { motion } from 'framer-motion';
import BingoTile from './BingoTile';

export default function BingoBoard({ 
  tiles, 
  teams, 
  completions, 
  currentTeam,
  onTileClick 
}) {
  const getCompletionForTile = (tileId) => {
    return completions.find(c => Number(c.tile_id) === Number(tileId) && c.status === 'approved');
  };

  const getTeamColor = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team?.color || '#888888';
  };

  const getBlockedInfo = (tileId) => {
    const blockedTiles = currentTeam?.blocked_tiles || [];
    // Support both old format (array of numbers) and new format (array of objects)
    for (const blocked of blockedTiles) {
      if (typeof blocked === 'number' && blocked === tileId) {
        return { isBlocked: true, blockerColor: '#ef4444' };
      }
      if (typeof blocked === 'object' && blocked.tile_id === tileId) {
        return { isBlocked: true, blockerColor: blocked.blocker_color };
      }
    }
    return { isBlocked: false, blockerColor: null };
  };

  const canRevealMystery = (tile) => {
    if (!tile.is_mystery || tile.revealed) return false;
    const adjacentIds = getAdjacentTileIds(tile.id);
    return adjacentIds.some(id => {
      const completion = getCompletionForTile(id);
      return completion && completion.team_id === currentTeam?.id;
    });
  };

  const boardSize = Math.ceil(Math.sqrt(tiles.length)) || 5;

  const getAdjacentTileIds = (tileId) => {
    const row = Math.floor(tileId / boardSize);
    const col = tileId % boardSize;
    const adjacent = [];
    
    if (row > 0) adjacent.push(tileId - boardSize);
    if (row < boardSize - 1) adjacent.push(tileId + boardSize);
    if (col > 0) adjacent.push(tileId - 1);
    if (col < boardSize - 1) adjacent.push(tileId + 1);
    
    return adjacent;
  };

  return (
    <div 
      className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] p-4 rounded-xl border-4 border-[#5c4833] shadow-2xl"
      style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
      >
        {tiles.map((tile, index) => {
          const completion = getCompletionForTile(tile.id);
          const blockedInfo = getBlockedInfo(tile.id);
          return (
            <BingoTile
              key={tile.id}
              tile={tile}
              teamColor={completion ? getTeamColor(completion.team_id) : null}
              isCompleted={!!completion}
              isBlocked={blockedInfo.isBlocked}
              blockerColor={blockedInfo.blockerColor}
              canReveal={canRevealMystery(tile)}
              onClick={onTileClick}
            />
          );
        })}
      </motion.div>
    </div>
  );
}