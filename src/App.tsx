import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { initializeDatabase, seedTestUser } from './utils/supabase/setup';
import { Toaster } from 'sonner';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// Auth & Onboarding
import { WelcomeScreen } from './components/WelcomeScreen';
import { LoginScreen } from './components/LoginScreen';
import { ApplicationForm } from './components/ApplicationForm';
import { ContractScreen } from './components/ContractScreen';
import { OnboardingTour } from './components/OnboardingTour';

// Main screens
import { Dashboard } from './components/Dashboard';
import { StartRunScreen } from './components/StartRunScreen';
import { ActiveRunScreen } from './components/ActiveRunScreen';
import { LeadPipeline } from './components/LeadPipeline';
import { AddLeadForm } from './components/AddLeadForm';
import { LeadDetailsScreen } from './components/LeadDetailsScreen';
import { MissionsScreen } from './components/MissionsScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { RankSystemScreen } from './components/RankSystemScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { EarningsScreen } from './components/EarningsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { HQAdminDashboard } from './components/HQAdminDashboard';

// Navigation
import { BottomNav } from './components/BottomNav';
import { RankUpModal } from './components/RankUpModal';

type Screen =
  | 'welcome'
  | 'login'
  | 'apply'
  | 'contract'
  | 'onboarding'
  | 'dashboard'
  | 'start-run'
  | 'active-run'
  | 'pipeline'
  | 'add-lead'
  | 'lead-details'
  | 'missions'
  | 'leaderboard'
  | 'ranks'
  | 'profile'
  | 'notifications'
  | 'earnings'
  | 'settings'
  | 'hq-admin';

export default function App() {
  const { user, streetUser, loading, needsContract, needsOnboarding, signIn, signOut, markOnboardingComplete } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Rank up modal state
  const [showRankUpModal, setShowRankUpModal] = useState(false);
  const [rankUpData, setRankUpData] = useState<{
    previousRank: string;
    newRank: string;
    totalXP: number;
  } | null>(null);

  useEffect(() => {
    initApp();
  }, []);

  useEffect(() => {
    // Initialize push notifications when user is authenticated
    if (streetUser) {
      initializePushNotifications();
    }
  }, [streetUser]);

  useEffect(() => {
    // Listen for rank-up events
    const handleRankUp = (event: CustomEvent) => {
      const { previousRank, newRank, totalXP } = event.detail;
      setRankUpData({ previousRank, newRank, totalXP });
      setShowRankUpModal(true);
    };

    window.addEventListener('rank-up' as any, handleRankUp);
    return () => window.removeEventListener('rank-up' as any, handleRankUp);
  }, []);

  useEffect(() => {
    // Route user to appropriate screen based on auth state
    if (loading) return;

    if (!user) {
      setCurrentScreen('welcome');
    } else if (needsContract && streetUser) {
      setCurrentScreen('contract');
    } else if (needsOnboarding) {
      setCurrentScreen('onboarding');
    } else if (streetUser) {
      if (currentScreen === 'welcome' || currentScreen === 'login' || currentScreen === 'contract' || currentScreen === 'onboarding') {
        setCurrentScreen('dashboard');
      }
    }
  }, [user, streetUser, loading, needsContract, needsOnboarding]);

  async function initApp() {
    try {
      await initializeDatabase();
      setInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setInitialized(true);
    }
  }

  async function initializePushNotifications() {
    try {
      // Check if we're on a native platform
      if (!Capacitor.isNativePlatform()) {
        console.log('Push notifications not available on web');
        return;
      }

      // Request permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        throw new Error('User denied push notifications permission');
      }

      // Register with push service
      await PushNotifications.register();

      // Get the token
      const result = await PushNotifications.getDeliveryTokens();

      if (result.tokens.length > 0) {
        const deviceToken = result.tokens[0];
        console.log('Push token:', deviceToken);

        // Save device token to Supabase
        if (streetUser) {
          const { createClient } = await import('./utils/supabase/client');
          const supabase = createClient();

          await supabase
            .from('street_users')
            .update({ push_token: deviceToken })
            .eq('id', streetUser.id);
        }
      }

      // Listen for push notifications
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received:', notification);
        // Show toast or handle notification
        if (notification.title) {
          const { toast } = require('sonner');
          toast.info(`${notification.title}: ${notification.body}`);
        }

        // Handle deep linking
        if (notification.data?.route) {
          setCurrentScreen(notification.data.route as Screen);
        }
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed:', notification);
        // Handle notification tap
        if (notification.notification.data?.route) {
          setCurrentScreen(notification.notification.data.route as Screen);
        }
      });
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  async function handleLogin(email: string, password: string) {
    console.log('handleLogin called with email:', email);
    const { error } = await signIn(email, password);
    console.log('signIn result - error:', error);
    if (error) {
      console.error('Login error in handleLogin:', error);
      throw error;
    }
  }

  function handleNavigate(screen: string) {
    setCurrentScreen(screen as Screen);
  }

  function handleOnboardingComplete() {
    markOnboardingComplete();
    setCurrentScreen('dashboard');
  }

  function handleRunStarted(runId: string) {
    setActiveRunId(runId);
    setCurrentScreen('active-run');
  }

  function handleEndRun() {
    setActiveRunId(null);
    setCurrentScreen('dashboard');
  }

  function handleLeadAdded() {
    if (activeRunId) {
      setCurrentScreen('active-run');
    } else {
      setCurrentScreen('pipeline');
    }
  }

  const showBottomNav = streetUser && !loading && [
    'dashboard',
    'pipeline',
    'missions',
    'leaderboard',
    'profile'
  ].includes(currentScreen);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block border-4 border-[#F6F2EE] p-8 mb-4 bg-[#151515] animate-pulse">
            <h1 className="text-5xl font-black text-[#8A4FFF] tracking-tight">PP</h1>
          </div>
          <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#151515',
            color: '#F6F2EE',
            border: '3px solid #8A4FFF',
          },
        }}
      />
      <div className="min-h-screen bg-[#050505]">
        {/* Auth & Onboarding Screens */}
        {currentScreen === 'welcome' && (
          <WelcomeScreen
            onNavigateToLogin={() => setCurrentScreen('login')}
            onNavigateToApply={() => setCurrentScreen('apply')}
          />
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            onBack={() => setCurrentScreen('welcome')}
            onLogin={handleLogin}
          />
        )}

        {currentScreen === 'apply' && (
          <ApplicationForm
            onBack={() => setCurrentScreen('welcome')}
          />
        )}

        {currentScreen === 'contract' && streetUser && (
          <ContractScreen
            userId={streetUser.id}
            onComplete={() => setCurrentScreen('onboarding')}
          />
        )}

        {currentScreen === 'onboarding' && (
          <OnboardingTour
            onComplete={handleOnboardingComplete}
          />
        )}

        {/* Main App Screens */}
        {streetUser && (
          <>
            {currentScreen === 'dashboard' && (
              <Dashboard
                user={streetUser}
                onNavigate={handleNavigate}
              />
            )}

            {currentScreen === 'start-run' && (
              <StartRunScreen
                user={streetUser}
                onBack={() => setCurrentScreen('dashboard')}
                onRunStarted={handleRunStarted}
              />
            )}

            {currentScreen === 'active-run' && activeRunId && (
              <ActiveRunScreen
                runId={activeRunId}
                onBack={() => setCurrentScreen('dashboard')}
                onAddQuickLead={() => setCurrentScreen('add-lead')}
                onAddFullLead={() => setCurrentScreen('add-lead')}
                onEndRun={handleEndRun}
              />
            )}

            {currentScreen === 'pipeline' && (
              <LeadPipeline
                user={streetUser}
                onBack={() => setCurrentScreen('dashboard')}
                onAddLead={() => setCurrentScreen('add-lead')}
                onViewLead={(leadId) => {
                  setSelectedLeadId(leadId);
                  setCurrentScreen('lead-details');
                }}
              />
            )}

            {currentScreen === 'lead-details' && selectedLeadId && (
              <LeadDetailsScreen
                leadId={selectedLeadId}
                user={streetUser}
                onBack={() => setCurrentScreen('pipeline')}
                onLeadUpdated={() => {
                  // Optionally reload data
                }}
              />
            )}

            {currentScreen === 'add-lead' && (
              <AddLeadForm
                user={streetUser}
                runId={activeRunId || undefined}
                onBack={() => {
                  if (activeRunId) {
                    setCurrentScreen('active-run');
                  } else {
                    setCurrentScreen('pipeline');
                  }
                }}
                onSuccess={handleLeadAdded}
              />
            )}

            {currentScreen === 'missions' && (
              <MissionsScreen
                user={streetUser}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}

            {currentScreen === 'leaderboard' && (
              <LeaderboardScreen
                user={streetUser}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}

            {currentScreen === 'ranks' && (
              <RankSystemScreen
                user={streetUser}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}

            {currentScreen === 'profile' && (
              <ProfileScreen
                user={streetUser}
                onBack={() => setCurrentScreen('dashboard')}
                onSettings={() => setCurrentScreen('settings')}
                onLogout={async () => {
                  await signOut();
                  setCurrentScreen('welcome');
                }}
              />
            )}

            {currentScreen === 'settings' && (
              <SettingsScreen
                user={streetUser}
                onBack={() => setCurrentScreen('profile')}
                onNavigate={(screen) => setCurrentScreen(screen as Screen)}
              />
            )}

            {currentScreen === 'notifications' && (
              <NotificationsScreen
                user={streetUser}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}

            {currentScreen === 'earnings' && (
              <EarningsScreen
                user={streetUser}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}

            {currentScreen === 'hq-admin' && streetUser?.role === 'hq_admin' && (
              <HQAdminDashboard />
            )}
          </>
        )}

        {/* Bottom Navigation */}
        {showBottomNav && (
          <div className="pb-20">
            <BottomNav
              activeScreen={currentScreen}
              onNavigate={handleNavigate}
            />
          </div>
        )}
      </div>

      {/* Rank Up Modal */}
      {rankUpData && (
        <RankUpModal
          isOpen={showRankUpModal}
          previousRank={rankUpData.previousRank}
          newRank={rankUpData.newRank}
          totalXP={rankUpData.totalXP}
          onClose={() => {
            setShowRankUpModal(false);
            setRankUpData(null);
          }}
        />
      )}
    </>
  );
}
