import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { 
  ArrowLeft, 
  Square, 
  MapPin, 
  Camera, 
  Plus,
  Clock,
  Zap,
  Target,
  CheckCircle2,
  TrendingUp,
  Flame
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { awardXP } from '../lib/xpService';
import { updateMissionProgress } from '../lib/missionService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface ActiveRunScreenProps {
  runId: string;
  onBack: () => void;
  onAddQuickLead: () => void;
  onAddFullLead: () => void;
  onEndRun: () => void;
}

export function ActiveRunScreen({ 
  runId, 
  onBack, 
  onAddQuickLead,
  onAddFullLead,
  onEndRun 
}: ActiveRunScreenProps) {
  const [run, setRun] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [venues, setVenues] = useState<any[]>([]);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadRun();
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
      // Refresh venues every 30 seconds
      if (elapsed % 30 === 0) {
        loadVenues();
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, [runId]);

  async function loadRun() {
    const { data } = await supabase
      .from('street_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (data) {
      setRun(data);
      const startTime = new Date(data.start_time).getTime();
      const now = Date.now();
      setElapsed(Math.floor((now - startTime) / 1000));
      loadVenues(data);
    }
  }

  async function loadVenues(runData = run) {
    if (!runData) return;
    
    const { data: venueData } = await supabase
      .from('street_venue_leads')
      .select('*')
      .eq('created_by_user_id', runData.user_id)
      .gte('created_at', runData.start_time)
      .order('created_at', { ascending: false });

    setVenues(venueData || []);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      toast.error('Camera access required for photos');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  async function capturePhoto() {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          toast.success('Photo captured!', {
            description: 'Add venue details to attach photo'
          });
          stopCamera();
          onAddFullLead();
        }
      }, 'image/jpeg', 0.9);
    }
  }

  const handleEndRun = async () => {
    if (!run) return;
    
    await supabase
      .from('street_runs')
      .update({
        end_time: new Date().toISOString(),
        actual_venue_count: venues.length,
        status: 'completed',
      })
      .eq('id', runId);

    // Award XP for completing run
    const baseXP = 50;
    const venueBonus = venues.length * 10;
    const timeBonus = elapsed > 3600 ? 25 : 0; // Bonus for runs over 1 hour
    const xpAmount = baseXP + venueBonus + timeBonus;
    
    const result = await awardXP({
      userId: run.user_id,
      amount: xpAmount,
      source: 'run_completed',
      sourceId: runId,
      pointsAmount: 5 + venues.length,
    });

    if (result.success) {
      toast.success(`Run completed – +${xpAmount} XP earned!`, {
        description: result.rankUp ? `🎉 Promoted to ${result.newRank}!` : `${venues.length} venues logged`,
      });

      // Update mission progress
      await updateMissionProgress(run.user_id, 'run_completed');
    }

    onEndRun();
  };

  if (!run) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block border-4 border-[#8A4FFF] p-6 mb-4 bg-[#151515] animate-pulse">
            <Zap className="w-12 h-12 text-[#8A4FFF]" />
          </div>
          <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading Run...</p>
        </div>
      </div>
    );
  }

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const targetVenues = run.target_venue_count || 10;
  const progress = Math.min((venues.length / targetVenues) * 100, 100);

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] relative overflow-hidden">
      {/* Animated gradient accent */}
      <motion.div 
        animate={{ 
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#8A4FFF]"
        style={{ backgroundSize: '200% 100%' }}
      />

      {/* Header */}
      <div className="relative border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <div className="flex-1">
            <h3 className="text-[#F6F2EE]">{run.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3 text-[#8A4FFF]" />
              <p className="text-[#A0A0A0] text-sm">{run.neighborhood}</p>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="px-3 py-1 bg-[#FF7A59] border-2 border-[#F6F2EE]"
          >
            <span className="text-[#F6F2EE] text-xs font-bold uppercase tracking-wider">LIVE</span>
          </motion.div>
        </div>

        {/* Timer - Big and Bold */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-6 bg-gradient-to-br from-[#8A4FFF] to-[#7A3FEF] border-4 border-[#F6F2EE] relative overflow-hidden"
          style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)' }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-[#F6F2EE]" />
              <span className="text-[#F6F2EE] text-xs uppercase tracking-widest">Time Active</span>
            </div>
            <p className="text-5xl font-bold text-[#F6F2EE] font-mono text-center tracking-wider">
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
          </div>
          {/* Decorative pulse */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-[#FF7A59]"
          />
        </motion.div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-24">
        
        {/* Progress to Goal */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-5 bg-[#151515] border-3 border-[#F6F2EE]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#8A4FFF]" />
              <span className="text-[#F6F2EE] uppercase tracking-wide font-bold">Progress</span>
            </div>
            <span className="text-[#A0A0A0] text-sm">
              {venues.length} / {targetVenues} venues
            </span>
          </div>
          <div className="h-4 bg-[#050505] border-2 border-[#F6F2EE] overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-[#8A4FFF] to-[#FF7A59]"
            />
            {progress >= 100 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <CheckCircle2 className="w-5 h-5 text-[#FFD700]" />
              </motion.div>
            )}
          </div>
          {progress >= 100 && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#FFD700] text-sm mt-2 font-bold uppercase tracking-wide"
            >
              🔥 Goal Crushed!
            </motion.p>
          )}
        </motion.div>

        {/* Quick Actions - Enhanced */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={onAddQuickLead}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-4 border-[#F6F2EE] text-[#F6F2EE] relative overflow-hidden group"
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' }}
            >
              <Plus className="w-8 h-8" />
              <span className="text-sm uppercase tracking-wide font-bold">Add Lead</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={cameraActive ? capturePhoto : startCamera}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-[#FF7A59] hover:bg-[#EE6A49] border-4 border-[#F6F2EE] text-[#F6F2EE] relative overflow-hidden"
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' }}
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm uppercase tracking-wide font-bold">
                {cameraActive ? 'Capture' : 'Camera'}
              </span>
            </Button>
          </motion.div>
        </div>

        {/* Camera View */}
        <AnimatePresence>
          {cameraActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative border-4 border-[#FF7A59] overflow-hidden"
              style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)' }}
            >
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                className="w-full h-64 object-cover bg-black"
              />
              <div className="absolute inset-0 border-2 border-dashed border-[#FF7A59] m-4 pointer-events-none" />
              <button
                onClick={stopCamera}
                className="absolute top-2 right-2 p-2 bg-[#050505] border-2 border-[#F6F2EE] hover:bg-[#FF4444] transition-colors"
              >
                <span className="text-[#F6F2EE] text-xs font-bold">✕</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Venues Added - Visual Cards */}
        {venues.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[#F6F2EE] uppercase tracking-wide flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#FF7A59]" />
                Venues Logged
              </h4>
              <span className="text-[#8A4FFF] font-bold">{venues.length}</span>
            </div>
            
            <div className="space-y-2">
              {venues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-[#151515] border-3 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[#F6F2EE] font-bold mb-1">{venue.venue_name}</p>
                      <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
                        <MapPin className="w-3 h-3" />
                        <span>{venue.address}</span>
                      </div>
                    </div>
                    <div className={`px-2 py-1 border-2 text-xs font-bold uppercase tracking-wider ${
                      venue.status === 'new' ? 'border-[#A0A0A0] text-[#A0A0A0]' :
                      venue.status === 'contacted' ? 'border-[#8A4FFF] text-[#8A4FFF]' :
                      venue.status === 'verbal_yes' ? 'border-[#FF7A59] text-[#FF7A59]' :
                      venue.status === 'signed_pending' ? 'border-[#FFD700] text-[#FFD700]' :
                      'border-[#00FF00] text-[#00FF00]'
                    }`}>
                      {venue.status.replace('_', ' ')}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {venues.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-block p-8 bg-[#151515] border-3 border-[#F6F2EE] mb-4">
              <Target className="w-16 h-16 text-[#A0A0A0]" />
            </div>
            <p className="text-[#A0A0A0] mb-2">No venues logged yet</p>
            <p className="text-[#8A4FFF] text-sm">Hit the streets and start adding leads!</p>
          </motion.div>
        )}

        {/* End Run Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {!showEndConfirm ? (
            <Button
              onClick={() => setShowEndConfirm(true)}
              variant="outline"
              className="w-full h-14 border-3 border-[#FF4444] text-[#FF4444] hover:bg-[#FF4444] hover:text-[#F6F2EE] uppercase tracking-wider font-bold transition-all"
            >
              <Square className="w-5 h-5 mr-2" />
              End Run
            </Button>
          ) : (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="p-5 bg-[#151515] border-4 border-[#FF4444] space-y-3"
            >
              <p className="text-[#F6F2EE] text-center font-bold">End this run?</p>
              <p className="text-[#A0A0A0] text-sm text-center">
                You logged {venues.length} venues in {Math.floor(elapsed / 60)} minutes
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowEndConfirm(false)}
                  variant="outline"
                  className="border-2 border-[#F6F2EE] text-[#F6F2EE] hover:bg-[#151515]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEndRun}
                  className="bg-[#FF4444] hover:bg-[#EE3333] border-2 border-[#F6F2EE] text-[#F6F2EE]"
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
