import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Play, FileText, Download, ExternalLink, CheckCircle2, Lock, HelpCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import type { StreetUser } from '../lib/types';
import { motion } from 'motion/react';
import { TrainingVideoPlayer } from './onboarding/TrainingVideoPlayer';

interface ResourcesScreenProps {
  user: StreetUser;
  onBack: () => void;
}

interface TrainingVideo {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  order: number;
}

interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'link';
  url: string;
  description?: string;
}

export function ResourcesScreen({ user, onBack }: ResourcesScreenProps) {
  const [activeTab, setActiveTab] = useState<'videos' | 'documents' | 'help'>('videos');
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, [user.id]);

  async function loadResources() {
    // Load training videos from Supabase Storage
    // Videos are stored in: street-team-training bucket
    const trainingVideos: TrainingVideo[] = [
      {
        id: 'video-1',
        title: 'What is Patron Pass?',
        duration: '3:42',
        videoUrl: await getVideoUrl('01-what-is-patron-pass.mp4'),
        order: 1
      },
      {
        id: 'video-2',
        title: 'How Commission Works',
        duration: '4:15',
        videoUrl: await getVideoUrl('02-how-commission-works.mp4'),
        order: 2
      },
      {
        id: 'video-3',
        title: 'Signing Your First Venue',
        duration: '5:30',
        videoUrl: await getVideoUrl('03-signing-first-venue.mp4'),
        order: 3
      },
      {
        id: 'video-4',
        title: 'Best Practices & Pro Tips',
        duration: '4:45',
        videoUrl: await getVideoUrl('04-best-practices.mp4'),
        order: 4
      }
    ];

    setVideos(trainingVideos);

    // Load user's completed videos
    const { data: progress } = await supabase
      .from('street_user_training_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (progress) {
      const completed: string[] = [];
      if (progress.video_1_completed) completed.push('video-1');
      if (progress.video_2_completed) completed.push('video-2');
      if (progress.video_3_completed) completed.push('video-3');
      if (progress.video_4_completed) completed.push('video-4');
      setCompletedVideos(completed);
    }

    setLoading(false);
  }

  async function getVideoUrl(filename: string): Promise<string> {
    const { data } = supabase.storage
      .from('street-team-training')
      .getPublicUrl(filename);
    
    return data.publicUrl;
  }

  async function handleVideoComplete(videoId: string) {
    if (completedVideos.includes(videoId)) return;

    setCompletedVideos([...completedVideos, videoId]);

    // Update database
    const updateField = `video_${videoId.split('-')[1]}_completed`;
    await supabase
      .from('street_user_training_progress')
      .upsert({
        user_id: user.id,
        [updateField]: true
      }, {
        onConflict: 'user_id'
      });
  }

  function handleAllVideosComplete() {
    console.log('All videos completed!');
  }

  const documents: Document[] = [
    {
      id: 'pitch-deck',
      title: 'Pitch Deck (PDF)',
      type: 'pdf',
      url: '/documents/patron-pass-pitch-deck.pdf',
      description: 'Show venues what Patron Pass can do for them'
    },
    {
      id: 'brand-positioning',
      title: 'Brand Positioning Guide (PDF)',
      type: 'pdf',
      url: '/documents/brand-positioning.pdf',
      description: 'Understand our brand and messaging'
    },
    {
      id: 'objection-handling',
      title: 'Objection Handling Script (PDF)',
      type: 'pdf',
      url: '/documents/objection-handling.pdf',
      description: 'Responses to common venue concerns'
    },
    {
      id: 'sample-perks',
      title: 'Sample Member Perks (PDF)',
      type: 'pdf',
      url: '/documents/sample-perks.pdf',
      description: 'Examples of perks venues can offer'
    },
    {
      id: 'calculator',
      title: 'Commission Calculator (Excel)',
      type: 'link',
      url: '/documents/commission-calculator.xlsx',
      description: 'Calculate your potential earnings'
    }
  ];

  async function handleDownload(doc: Document) {
    // In production, these would be actual Supabase Storage URLs
    const { data } = supabase.storage
      .from('street-team-documents')
      .getPublicUrl(doc.url);

    window.open(data.publicUrl, '_blank');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#FFD700]" />

      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <h3 className="text-[#F6F2EE] flex-1">Resources & Training</h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['videos', 'documents', 'help'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 border-3 uppercase text-xs tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                  : 'bg-transparent border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
              }`}
            >
              {tab === 'videos' && `Training (${completedVideos.length}/${videos.length})`}
              {tab === 'documents' && 'Documents'}
              {tab === 'help' && 'Help'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {/* VIDEOS TAB */}
        {activeTab === 'videos' && (
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block p-6 bg-[#151515] border-4 border-[#8A4FFF] mb-4 animate-pulse">
                  <Play className="w-12 h-12 text-[#8A4FFF]" />
                </div>
                <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading videos...</p>
              </div>
            ) : (
              <TrainingVideoPlayer
                videos={videos}
                completedVideos={completedVideos}
                onVideoComplete={handleVideoComplete}
                onAllComplete={handleAllVideosComplete}
              />
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="p-4 bg-[#8A4FFF] border-3 border-[#F6F2EE] mb-6">
              <h4 className="text-[#F6F2EE] font-bold mb-2">📚 Reference Materials</h4>
              <p className="text-[#F6F2EE] text-sm opacity-90">
                Download these documents to help you sign more venues
              </p>
            </div>

            {documents.map(doc => (
              <motion.div
                key={doc.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="p-5 bg-[#151515] border-3 border-[#F6F2EE] hover:border-[#8A4FFF] transition-all cursor-pointer"
                onClick={() => handleDownload(doc)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#8A4FFF] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-[#F6F2EE]" />
                  </div>

                  <div className="flex-1">
                    <h4 className="text-[#F6F2EE] font-bold mb-1">{doc.title}</h4>
                    {doc.description && (
                      <p className="text-[#A0A0A0] text-sm mb-2">{doc.description}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-[#8A4FFF] border-2 border-[#F6F2EE] transition-colors">
                      <Download className="w-5 h-5 text-[#F6F2EE]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* HELP TAB */}
        {activeTab === 'help' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="p-4 bg-[#8A4FFF] border-3 border-[#F6F2EE] mb-6">
              <h4 className="text-[#F6F2EE] font-bold mb-2">❓ Need Help?</h4>
              <p className="text-[#F6F2EE] text-sm opacity-90">
                We're here to support you
              </p>
            </div>

            {/* FAQ Link */}
            <button className="w-full p-5 bg-[#151515] border-3 border-[#F6F2EE] hover:border-[#8A4FFF] transition-all text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#8A4FFF] border-2 border-[#F6F2EE] flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-[#F6F2EE]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#F6F2EE] font-bold mb-1">Frequently Asked Questions</h4>
                  <p className="text-[#A0A0A0] text-sm">Common questions answered</p>
                </div>
                <ExternalLink className="w-5 h-5 text-[#A0A0A0]" />
              </div>
            </button>

            {/* Contact Support */}
            <button className="w-full p-5 bg-[#151515] border-3 border-[#F6F2EE] hover:border-[#8A4FFF] transition-all text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FF7A59] border-2 border-[#F6F2EE] flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-[#F6F2EE]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#F6F2EE] font-bold mb-1">Contact Support</h4>
                  <p className="text-[#A0A0A0] text-sm">Get help from our team</p>
                </div>
                <ExternalLink className="w-5 h-5 text-[#A0A0A0]" />
              </div>
            </button>

            {/* Community */}
            <button className="w-full p-5 bg-[#151515] border-3 border-[#F6F2EE] hover:border-[#8A4FFF] transition-all text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FFD700] border-2 border-[#F6F2EE] flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-[#050505]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#F6F2EE] font-bold mb-1">Join Community</h4>
                  <p className="text-[#A0A0A0] text-sm">Connect with other ambassadors</p>
                </div>
                <ExternalLink className="w-5 h-5 text-[#A0A0A0]" />
              </div>
            </button>

            {/* Contact info */}
            <div className="p-5 bg-[#0A0A0A] border-2 border-[#F6F2EE]">
              <h4 className="text-[#F6F2EE] text-sm uppercase tracking-wider mb-3">Direct Contact</h4>
              <div className="space-y-2 text-sm">
                <p className="text-[#A0A0A0]">
                  Email: <a href="mailto:support@patronpass.com" className="text-[#8A4FFF] hover:text-[#FF7A59]">support@patronpass.com</a>
                </p>
                <p className="text-[#A0A0A0]">
                  Response time: Within 24 hours
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
