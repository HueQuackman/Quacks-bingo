import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, User, Star } from 'lucide-react';
import OSRSButton from './OSRSButton';
import { motion } from 'framer-motion';

export default function SubmissionsViewer({ eventId, teams, tiles, isAdmin, onAdminAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions', eventId],
    queryFn: () => base44.entities.TileCompletion.filter({ event_id: eventId }),
    enabled: isOpen,
    refetchInterval: 10000
  });

  const getTeam = (teamId) => teams.find(t => t.id === teamId);
  const getTile = (tileId) => tiles?.find(t => Number(t.id) === Number(tileId));

  const pending = submissions.filter(s => s.status === 'pending');
  const approved = submissions.filter(s => s.status === 'approved');
  const rejected = submissions.filter(s => s.status === 'rejected');

  const SubmissionCard = ({ submission }) => {
    const team = getTeam(submission.team_id);
    const tile = getTile(submission.tile_id);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/30 rounded-lg p-3 border border-[#5c4833]"
      >
        <div className="flex items-start gap-3">
          {submission.screenshot_url && (
            <button
              onClick={() => setSelectedImage(submission.screenshot_url)}
              className="w-16 h-16 rounded-lg overflow-hidden border border-[#5c4833] hover:border-[#ff981f] transition-colors flex-shrink-0"
            >
              <img 
                src={submission.screenshot_url} 
                alt="Proof" 
                className="w-full h-full object-cover"
              />
            </button>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{tile?.task || 'Unknown tile'}</p>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: team?.color || '#888' }}
              />
              <span className="text-[#8a7a5a] text-xs">{team?.name}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-[#c0a875] flex items-center gap-1">
                <User className="w-3 h-3" />
                {submission.player_name}
              </span>
              <span className="text-yellow-400 flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400" />
                {submission.points_awarded}
              </span>
            </div>
          </div>

          {isAdmin && submission.status === 'pending' && (
            <div className="flex gap-1">
              <button
                onClick={() => onAdminAction(submission.id, 'approved')}
                className="p-1.5 rounded bg-green-900/50 hover:bg-green-800 text-green-400"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAdminAction(submission.id, 'rejected')}
                className="p-1.5 rounded bg-red-900/50 hover:bg-red-800 text-red-400"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <div 
        className="bg-gradient-to-b from-[#5b9bd5] to-[#4a8bc4] p-4 rounded-xl border-4 border-[#3a7bb4] shadow-2xl"
        style={{ fontFamily: "'RuneScape UF', sans-serif" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-black font-bold">Submissions</h3>
          {pending.length > 0 && (
            <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
              {pending.length} pending
            </span>
          )}
        </div>
        <OSRSButton onClick={() => setIsOpen(true)} className="w-full">
          View All Submissions
        </OSRSButton>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] border-4 border-[#5c4833] text-white max-w-lg max-h-[80vh]"
          style={{ fontFamily: "'RuneScape UF', sans-serif" }}
        >
          <DialogHeader>
            <DialogTitle className="text-[#ff981f] text-xl">Tile Submissions</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/30 rounded-xl">
              <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-900/50 data-[state=active]:text-yellow-400">
                <Clock className="w-3 h-3 mr-1" />
                Pending ({pending.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-green-900/50 data-[state=active]:text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Approved ({approved.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-red-900/50 data-[state=active]:text-red-400">
                <XCircle className="w-3 h-3 mr-1" />
                Rejected ({rejected.length})
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
              <TabsContent value="pending" className="mt-0 space-y-2">
                {pending.length === 0 ? (
                  <p className="text-[#8a7a5a] text-center py-6">No pending submissions</p>
                ) : (
                  pending.map(s => <SubmissionCard key={s.id} submission={s} />)
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-0 space-y-2">
                {approved.length === 0 ? (
                  <p className="text-[#8a7a5a] text-center py-6">No approved submissions</p>
                ) : (
                  approved.map(s => <SubmissionCard key={s.id} submission={s} />)
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-0 space-y-2">
                {rejected.length === 0 ? (
                  <p className="text-[#8a7a5a] text-center py-6">No rejected submissions</p>
                ) : (
                  rejected.map(s => <SubmissionCard key={s.id} submission={s} />)
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="bg-black/90 border-[#5c4833] max-w-3xl p-2">
          {selectedImage && (
            <img src={selectedImage} alt="Submission proof" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}