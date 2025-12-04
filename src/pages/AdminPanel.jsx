import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, Image, User, Clock, Star, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import OSRSButton from '@/components/bingo/OSRSButton';

export default function AdminPanel() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [profile, setProfile] = useState(null);

  React.useEffect(() => {
    const profileId = localStorage.getItem('bingo_profile_id');
    if (profileId) {
      base44.entities.Profile.filter({ id: profileId }).then(profiles => {
        if (profiles.length > 0) setProfile(profiles[0]);
      });
    }
  }, []);

  const isAdmin = profile?.is_admin;

  if (profile && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#1a2744] flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] p-8 rounded-xl border-4 border-[#5c4833] text-center">
          <p className="text-[#ff981f] text-xl mb-4" style={{ fontFamily: "'RuneScape UF', sans-serif" }}>
            Access Denied
          </p>
          <p className="text-[#c0a875]">Only admins can access this panel.</p>
          <Link to={createPageUrl('Home')} className="mt-4 inline-block">
            <OSRSButton variant="secondary">Back to Home</OSRSButton>
          </Link>
        </div>
      </div>
    );
  }

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => base44.entities.BingoEvent.filter({ id: eventId }),
    enabled: !!eventId,
    select: (data) => data[0]
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', eventId],
    queryFn: () => base44.entities.Team.filter({ event_id: eventId }),
    enabled: !!eventId
  });

  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['submissions', eventId],
    queryFn: () => base44.entities.TileCompletion.filter({ event_id: eventId }),
    enabled: !!eventId,
    refetchInterval: 5000
  });

  const updateSubmission = useMutation({
    mutationFn: async ({ id, status, teamId, points }) => {
      await base44.entities.TileCompletion.update(id, { status });
      
      if (status === 'approved') {
        const team = teams.find(t => t.id === teamId);
        if (team) {
          await base44.entities.Team.update(teamId, {
            total_points: (team.total_points || 0) + points,
            completed_tiles: [...(team.completed_tiles || []), selectedSubmission.tile_id]
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['submissions', eventId]);
      queryClient.invalidateQueries(['teams', eventId]);
      setSelectedSubmission(null);
    }
  });

  const updateEventStatus = useMutation({
    mutationFn: (status) => base44.entities.BingoEvent.update(eventId, { status }),
    onSuccess: () => queryClient.invalidateQueries(['event', eventId])
  });

  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name || 'Unknown';
  const getTeamColor = (teamId) => teams.find(t => t.id === teamId)?.color || '#888';
  const getTileTask = (tileId) => event?.tiles?.find(t => t.id === tileId)?.task || 'Unknown task';

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const approvedSubmissions = submissions.filter(s => s.status === 'approved');
  const rejectedSubmissions = submissions.filter(s => s.status === 'rejected');

  const SubmissionCard = ({ submission, showActions = true }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/30 rounded-lg border border-[#5c4833] p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getTeamColor(submission.team_id) }}
            />
            <span className="text-white font-bold">{getTeamName(submission.team_id)}</span>
          </div>
          
          <p className="text-[#c0a875] text-sm mb-2">{getTileTask(submission.tile_id)}</p>
          
          <div className="flex items-center gap-4 text-xs text-[#8a7a5a]">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {submission.player_name}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {submission.points_awarded} pts
              {submission.used_double_points && <span className="text-yellow-400">(2x)</span>}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(submission.created_date).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {submission.screenshot_url && (
            <button
              onClick={() => {
                setSelectedSubmission(submission);
                setShowImageModal(true);
              }}
              className="p-2 bg-blue-600/20 rounded-lg text-blue-400 hover:bg-blue-600/30 transition-colors"
            >
              <Image className="w-5 h-5" />
            </button>
          )}
          
          {showActions && submission.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  setSelectedSubmission(submission);
                  updateSubmission.mutate({
                    id: submission.id,
                    status: 'approved',
                    teamId: submission.team_id,
                    points: submission.points_awarded
                  });
                }}
                className="p-2 bg-green-600/20 rounded-lg text-green-400 hover:bg-green-600/30 transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setSelectedSubmission(submission);
                  updateSubmission.mutate({
                    id: submission.id,
                    status: 'rejected',
                    teamId: submission.team_id,
                    points: 0
                  });
                }}
                className="p-2 bg-red-600/20 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div 
      className="min-h-screen bg-[#1a2744] p-4 md:p-8"
      style={{ fontFamily: "'RuneScape UF', sans-serif" }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <Link to={createPageUrl('BingoEvent') + `?id=${eventId}`}>
            <OSRSButton variant="secondary" className="text-xs px-3 py-1">
              <ArrowLeft className="w-3 h-3 mr-1 inline" />
              Back
            </OSRSButton>
          </Link>
          
          <div className="flex items-center gap-2">
            <h1 className="text-xl text-[#ff981f] font-bold">Admin Panel</h1>
            <button onClick={() => refetch()} className="p-1 text-[#8a7a5a] hover:text-[#ff981f]">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-2">
            {event?.status !== 'active' && (
              <OSRSButton 
                variant="success"
                onClick={() => updateEventStatus.mutate('active')}
                className="text-xs px-3 py-1"
              >
                Start
              </OSRSButton>
            )}
            {event?.status === 'active' && (
              <OSRSButton 
                variant="danger"
                onClick={() => updateEventStatus.mutate('completed')}
                className="text-xs px-3 py-1"
              >
                End
              </OSRSButton>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-b from-[#3d3224] to-[#2a2218] rounded-xl border-4 border-[#5c4833] p-6"
        >
          <Tabs defaultValue="pending">
            <TabsList className="bg-black/30 border border-[#5c4833] mb-6">
              <TabsTrigger value="pending" className="data-[state=active]:bg-[#ff981f] data-[state=active]:text-black">
                Pending ({pendingSubmissions.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Approved ({approvedSubmissions.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Rejected ({rejectedSubmissions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-8 h-8 text-[#ff981f] animate-spin" />
                </div>
              ) : pendingSubmissions.length === 0 ? (
                <p className="text-center text-[#8a7a5a] py-8">No pending submissions</p>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {pendingSubmissions.map((submission) => (
                      <SubmissionCard key={submission.id} submission={submission} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {approvedSubmissions.length === 0 ? (
                <p className="text-center text-[#8a7a5a] py-8">No approved submissions</p>
              ) : (
                <div className="space-y-3">
                  {approvedSubmissions.map((submission) => (
                    <SubmissionCard key={submission.id} submission={submission} showActions={false} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected">
              {rejectedSubmissions.length === 0 ? (
                <p className="text-center text-[#8a7a5a] py-8">No rejected submissions</p>
              ) : (
                <div className="space-y-3">
                  {rejectedSubmissions.map((submission) => (
                    <SubmissionCard key={submission.id} submission={submission} showActions={false} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="bg-[#3d3224] border-[#5c4833] max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#ff981f]">Screenshot Proof</DialogTitle>
          </DialogHeader>
          {selectedSubmission?.screenshot_url && (
            <img 
              src={selectedSubmission.screenshot_url} 
              alt="Proof" 
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}