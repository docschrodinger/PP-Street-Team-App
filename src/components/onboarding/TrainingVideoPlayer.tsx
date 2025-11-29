import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize, CheckCircle2, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface TrainingVideo {
  id: string;
  title: string;
  duration: string;
  videoUrl: string; // Supabase storage URL
  order: number;
}

interface TrainingVideoPlayerProps {
  videos: TrainingVideo[];
  completedVideos: string[];
  onVideoComplete: (videoId: string) => void;
  onAllComplete: () => void;
}

export function TrainingVideoPlayer({ 
  videos, 
  completedVideos, 
  onVideoComplete,
  onAllComplete 
}: TrainingVideoPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasWatchedEnough, setHasWatchedEnough] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideo = videos[currentVideoIndex];
  const isCompleted = completedVideos.includes(currentVideo?.id);

  useEffect(() => {
    // Check if all videos are completed
    if (videos.length > 0 && completedVideos.length === videos.length) {
      onAllComplete();
    }
  }, [completedVideos, videos, onAllComplete]);

  useEffect(() => {
    // Reset watched enough when video changes
    setHasWatchedEnough(isCompleted);
    setProgress(0);
  }, [currentVideoIndex, isCompleted]);

  function handleTimeUpdate() {
    if (videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);

      // User must watch 90% to mark as complete
      if (percent >= 90 && !hasWatchedEnough) {
        setHasWatchedEnough(true);
      }
    }
  }

  function togglePlay() {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }

  function toggleFullscreen() {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  }

  function markComplete() {
    if (hasWatchedEnough || isCompleted) {
      onVideoComplete(currentVideo.id);
      
      // Auto-advance to next video if not last
      if (currentVideoIndex < videos.length - 1) {
        setTimeout(() => {
          setCurrentVideoIndex(currentVideoIndex + 1);
          setProgress(0);
          setHasWatchedEnough(false);
          setIsPlaying(false);
        }, 500);
      }
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (!currentVideo) {
    return <div className="text-[#A0A0A0] p-6">No training videos available</div>;
  }

  const canAdvance = (index: number) => {
    if (index === 0) return true;
    return completedVideos.includes(videos[index - 1]?.id);
  };

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="relative bg-[#000] border-4 border-[#F6F2EE] overflow-hidden">
        <video
          ref={videoRef}
          src={currentVideo.videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            setIsPlaying(false);
            setHasWatchedEnough(true);
          }}
          className="w-full aspect-video"
          playsInline
        />

        {/* Custom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          {/* Progress bar */}
          <div className="mb-3">
            <div className="h-2 bg-[#333] border border-[#F6F2EE]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-[#8A4FFF]"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-[#8A4FFF] border-2 border-[#F6F2EE] transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-[#F6F2EE]" />
              ) : (
                <Play className="w-5 h-5 text-[#F6F2EE]" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 hover:bg-[#8A4FFF] border-2 border-[#F6F2EE] transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-[#F6F2EE]" />
              ) : (
                <Volume2 className="w-5 h-5 text-[#F6F2EE]" />
              )}
            </button>

            <span className="text-[#F6F2EE] text-sm">
              {videoRef.current ? formatTime(videoRef.current.currentTime) : '0:00'}
              {' / '}
              {videoRef.current ? formatTime(videoRef.current.duration || 0) : currentVideo.duration}
            </span>

            <div className="flex-1" />

            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-[#8A4FFF] border-2 border-[#F6F2EE] transition-colors"
            >
              <Maximize className="w-5 h-5 text-[#F6F2EE]" />
            </button>
          </div>
        </div>

        {/* Completion overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-[#8A4FFF]/20 flex items-center justify-center">
            <div className="p-6 bg-[#8A4FFF] border-4 border-[#F6F2EE]">
              <CheckCircle2 className="w-12 h-12 text-[#F6F2EE]" />
            </div>
          </div>
        )}
      </div>

      {/* Mark Complete Button */}
      {!isCompleted && (
        <Button
          onClick={markComplete}
          disabled={!hasWatchedEnough}
          className="w-full h-12 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasWatchedEnough ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Mark as Complete
            </>
          ) : (
            <>Watch {Math.round(90 - progress)}% more to continue</>
          )}
        </Button>
      )}

      {/* Video List */}
      <div className="space-y-2">
        <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-3">
          Training Videos ({completedVideos.length}/{videos.length})
        </h4>

        {videos.map((video, index) => {
          const completed = completedVideos.includes(video.id);
          const locked = !canAdvance(index);
          const isCurrent = index === currentVideoIndex;

          return (
            <button
              key={video.id}
              onClick={() => !locked && setCurrentVideoIndex(index)}
              disabled={locked}
              className={`w-full p-4 border-3 text-left transition-all ${
                isCurrent
                  ? 'bg-[#8A4FFF] border-[#F6F2EE]'
                  : completed
                  ? 'bg-[#151515] border-[#00FF00] hover:border-[#8A4FFF]'
                  : locked
                  ? 'bg-[#0A0A0A] border-[#333] opacity-50 cursor-not-allowed'
                  : 'bg-[#151515] border-[#F6F2EE] hover:border-[#8A4FFF]'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 border-2 flex items-center justify-center ${
                  isCurrent ? 'bg-[#F6F2EE] border-[#F6F2EE]' :
                  completed ? 'bg-[#00FF00] border-[#F6F2EE]' :
                  'bg-[#050505] border-[#F6F2EE]'
                }`}>
                  {completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#050505]" />
                  ) : locked ? (
                    <Lock className="w-5 h-5 text-[#666]" />
                  ) : (
                    <Play className={`w-5 h-5 ${isCurrent ? 'text-[#8A4FFF]' : 'text-[#F6F2EE]'}`} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className={`font-bold ${
                    isCurrent ? 'text-[#F6F2EE]' :
                    completed ? 'text-[#00FF00]' :
                    locked ? 'text-[#666]' :
                    'text-[#F6F2EE]'
                  }`}>
                    Video {index + 1}: {video.title}
                  </p>
                  <p className={`text-xs ${
                    isCurrent ? 'text-[#F6F2EE] opacity-75' : 'text-[#A0A0A0]'
                  }`}>
                    {video.duration}
                    {completed && ' • Completed'}
                    {locked && ' • Locked'}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="p-4 bg-[#151515] border-2 border-[#8A4FFF]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#F6F2EE] text-sm">Training Progress</span>
          <span className="text-[#8A4FFF] font-bold">
            {Math.round((completedVideos.length / videos.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-[#050505] border-2 border-[#F6F2EE]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedVideos.length / videos.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-[#8A4FFF] to-[#FF7A59]"
          />
        </div>
      </div>
    </div>
  );
}
