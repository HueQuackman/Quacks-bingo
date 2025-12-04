import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Skull, Pickaxe, Shuffle, Scroll, Sparkles, Star, HelpCircle, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import OSRSButton from '@/components/bingo/OSRSButton';

const templates = [
  { id: 'boss', name: 'Boss Hunting', icon: Skull },
  { id: 'skilling', name: 'Skilling', icon: Pickaxe },
  { id: 'mixed', name: 'Mixed', icon: Shuffle },
  { id: 'clues', name: 'Clue Scrolls', icon: Scroll },
  { id: 'pvm', name: 'PvM Challenge', icon: Sparkles }
];

const teamColors = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e91e63', '#00bcd4'
];

const difficultyOptions = [
  { value: 'easy', label: 'Easy', color: 'text-green-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'hard', label: 'Hard', color: 'text-orange-400' },
  { value: 'elite', label: 'Elite', color: 'text-red-400' },
  { value: 'master', label: 'Master', color: 'text-purple-400' }
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const isAdmin = user?.role === 'admin';
  
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('mixed');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [teams, setTeams] = useState([
    { name: 'Team 1', color: teamColors[0], members: [] },
    { name: 'Team 2', color: teamColors[1], members: [] }
  ]);
  
  const [tiles, setTiles] = useState([]);
  const [boardSize, setBoardSize] = useState(5); // 5x5 = 25 tiles
  const maxTiles = boardSize * boardSize;
  const [newTile, setNewTile] = useState({
    task: '',
    points: 10,
    difficulty: 'medium',
    is_mystery: false,
    is_double_points: false
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#1a2744] flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] p-8 rounded-xl border-4 border-[#5c4833] text-center">
          <p className="text-[#ff981f] text-xl mb-4" style={{ fontFamily: "'RuneScape UF', sans-serif" }}>
            Access Denied
          </p>
          <p className="text-[#c0a875]">Only admins can create events.</p>
          <Link to={createPageUrl('Home')} className="mt-4 inline-block">
            <OSRSButton variant="secondary">Back to Home</OSRSButton>
          </Link>
        </div>
      </div>
    );
  }

  const addTile = () => {
    if (!newTile.task.trim()) return;
    if (tiles.length >= maxTiles) return;
    
    setTiles([...tiles, {
      id: tiles.length,
      task: newTile.task,
      points: newTile.points,
      difficulty: newTile.difficulty,
      type: newTile.is_double_points ? 'double_points' : (newTile.is_mystery ? 'mystery' : 'normal'),
      is_mystery: newTile.is_mystery,
      revealed: !newTile.is_mystery
    }]);
    
    setNewTile({
      task: '',
      points: 10,
      difficulty: 'medium',
      is_mystery: false,
      is_double_points: false
    });
  };

  const removeTile = (index) => {
    const updated = tiles.filter((_, i) => i !== index);
    // Re-index tiles
    setTiles(updated.map((tile, i) => ({ ...tile, id: i })));
  };

  const createEvent = useMutation({
    mutationFn: async () => {
      if (tiles.length !== maxTiles) {
        throw new Error(`You need exactly ${maxTiles} tiles for a ${boardSize}x${boardSize} board`);
      }

      const event = await base44.entities.BingoEvent.create({
        name: eventName,
        description: eventDescription,
        template: selectedTemplate,
        start_time: new Date(startDate).toISOString(),
        end_time: new Date(endDate).toISOString(),
        status: new Date(startDate) > new Date() ? 'upcoming' : 'active',
        tiles
      });

      // Create teams
      for (const team of teams) {
        await base44.entities.Team.create({
          name: team.name,
          color: team.color,
          event_id: event.id,
          members: team.members,
          total_points: 0,
          completed_tiles: [],
          powerups: {
            double_points: 2,
            steal_tile: 1,
            block_tile: 1
          },
          blocked_tiles: []
        });
      }

      return event;
    },
    onSuccess: (event) => {
      navigate(createPageUrl('BingoEvent') + `?id=${event.id}`);
    }
  });

  const addTeam = () => {
    if (teams.length >= 8) return;
    setTeams([...teams, { 
      name: `Team ${teams.length + 1}`, 
      color: teamColors[teams.length % teamColors.length],
      members: []
    }]);
  };

  const removeTeam = (index) => {
    if (teams.length <= 2) return;
    setTeams(teams.filter((_, i) => i !== index));
  };

  const updateTeam = (index, field, value) => {
    const updated = [...teams];
    updated[index][field] = value;
    setTeams(updated);
  };

  const getDifficultyColor = (difficulty) => {
    return difficultyOptions.find(d => d.value === difficulty)?.color || 'text-white';
  };

  return (
    <div 
      className="min-h-screen bg-[#1a2744] p-4 md:p-8"
      style={{ 
        fontFamily: "'RuneScape UF', sans-serif",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23ffffff' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E")` 
      }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <Link to={createPageUrl('Home')}>
            <OSRSButton variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2 inline" />
              Back
            </OSRSButton>
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] p-6 space-y-6"
        >
          <h1 className="text-2xl text-[#ff981f] font-bold text-center">Create New Bingo Event</h1>

          {/* Event Details */}
          <div className="space-y-4">
            <div>
              <Label className="text-[#ff981f]">Event Name</Label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Weekly Clan Bingo"
                className="bg-black/40 border-[#5c4833] text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-[#ff981f]">Description (optional)</Label>
              <Textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Event rules and details..."
                className="bg-black/40 border-[#5c4833] text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#ff981f]">Start Date</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-black/40 border-[#5c4833] text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[#ff981f]">End Date</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-black/40 border-[#5c4833] text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <Label className="text-[#ff981f] mb-3 block">Board Theme (visual only)</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-[#ff981f] bg-[#ff981f]/10'
                        : 'border-[#5c4833] bg-black/20 hover:bg-black/30'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-1 ${
                      selectedTemplate === template.id ? 'text-[#ff981f]' : 'text-[#c0a875]'
                    }`} />
                    <p className={`font-bold text-xs ${
                      selectedTemplate === template.id ? 'text-[#ff981f]' : 'text-white'
                    }`}>{template.name}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Custom Tiles */}
          <div className="border-t border-[#5c4833] pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Label className="text-[#ff981f] text-lg">Board Tiles ({tiles.length}/{maxTiles})</Label>
                <div className="flex items-center gap-2">
                  <Label className="text-[#8a7a5a] text-sm">Size:</Label>
                  <Select value={boardSize.toString()} onValueChange={(v) => setBoardSize(parseInt(v))}>
                    <SelectTrigger className="w-24 bg-black/40 border-[#5c4833] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#3d3224] border-[#5c4833]">
                      <SelectItem value="3" className="text-white">3x3</SelectItem>
                      <SelectItem value="4" className="text-white">4x4</SelectItem>
                      <SelectItem value="5" className="text-white">5x5</SelectItem>
                      <SelectItem value="6" className="text-white">6x6</SelectItem>
                      <SelectItem value="7" className="text-white">7x7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-sm text-[#8a7a5a]">
                {maxTiles - tiles.length} more needed
              </div>
            </div>

            {/* Add New Tile Form */}
            <div className="bg-black/30 rounded-lg border border-[#5c4833] p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <Label className="text-[#c0a875] text-sm">Task Description</Label>
                  <Input
                    value={newTile.task}
                    onChange={(e) => setNewTile({ ...newTile, task: e.target.value })}
                    placeholder="e.g. Get a Dragon Warhammer drop"
                    className="bg-black/40 border-[#5c4833] text-white mt-1"
                    onKeyDown={(e) => e.key === 'Enter' && addTile()}
                  />
                </div>
                
                <div>
                  <Label className="text-[#c0a875] text-sm">Points</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newTile.points}
                    onChange={(e) => setNewTile({ ...newTile, points: parseInt(e.target.value) || 0 })}
                    className="bg-black/40 border-[#5c4833] text-white mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-[#c0a875] text-sm">Difficulty</Label>
                  <Select
                    value={newTile.difficulty}
                    onValueChange={(value) => setNewTile({ ...newTile, difficulty: value })}
                  >
                    <SelectTrigger className="bg-black/40 border-[#5c4833] text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#3d3224] border-[#5c4833]">
                      {difficultyOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className={opt.color}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newTile.is_mystery}
                    onCheckedChange={(checked) => setNewTile({ ...newTile, is_mystery: checked })}
                  />
                  <Label className="text-[#c0a875] text-sm flex items-center gap-1">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    Mystery Tile
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newTile.is_double_points}
                    onCheckedChange={(checked) => setNewTile({ ...newTile, is_double_points: checked })}
                  />
                  <Label className="text-[#c0a875] text-sm flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Double Points Tile
                  </Label>
                </div>
              </div>

              <OSRSButton 
                onClick={addTile} 
                disabled={!newTile.task.trim() || tiles.length >= maxTiles}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Add Tile
              </OSRSButton>
            </div>

            {/* Tiles List */}
            {tiles.length > 0 && (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                <AnimatePresence>
                  {tiles.map((tile, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-[#5c4833]"
                    >
                      <span className="text-[#8a7a5a] text-sm w-6">{index + 1}.</span>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{tile.task}</p>
                        <div className="flex items-center gap-3 text-xs mt-1">
                          <span className={getDifficultyColor(tile.difficulty)}>{tile.difficulty}</span>
                          <span className="text-yellow-400 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            {tile.points}
                          </span>
                          {tile.is_mystery && (
                            <span className="text-purple-400 flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" />
                              Mystery
                            </span>
                          )}
                          {tile.type === 'double_points' && (
                            <span className="text-yellow-300 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              2x
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeTile(index)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {tiles.length === 0 && (
              <div className="text-center py-8 text-[#8a7a5a]">
                <p>No tiles added yet. Add {maxTiles} tiles to create your {boardSize}x{boardSize} board.</p>
              </div>
            )}
          </div>

          {/* Teams */}
          <div className="border-t border-[#5c4833] pt-6">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-[#ff981f]">Teams</Label>
              <OSRSButton variant="secondary" onClick={addTeam} disabled={teams.length >= 8}>
                <Plus className="w-4 h-4 mr-1 inline" />
                Add Team
              </OSRSButton>
            </div>

            <div className="space-y-3">
              {teams.map((team, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-[#5c4833]"
                >
                  <input
                    type="color"
                    value={team.color}
                    onChange={(e) => updateTeam(index, 'color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                  />
                  <Input
                    value={team.name}
                    onChange={(e) => updateTeam(index, 'name', e.target.value)}
                    className="bg-black/40 border-[#5c4833] text-white flex-1"
                  />
                  {teams.length > 2 && (
                    <button
                      onClick={() => removeTeam(index)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <OSRSButton
              onClick={() => createEvent.mutate()}
              disabled={!eventName || !startDate || !endDate || tiles.length !== maxTiles || createEvent.isPending}
              className="w-full text-lg py-3"
            >
              {createEvent.isPending ? 'Creating...' : `Create Event ${tiles.length !== maxTiles ? `(Need ${maxTiles - tiles.length} more tiles)` : ''}`}
            </OSRSButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}