import { Home, MapPin, Target, TrendingUp, User } from 'lucide-react';

interface BottomNavProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'pipeline', icon: MapPin, label: 'Leads' },
    { id: 'missions', icon: Target, label: 'Missions' },
    { id: 'leaderboard', icon: TrendingUp, label: 'Ranks' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#151515] border-t-4 border-[#F6F2EE] safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${
                isActive ? 'scale-105' : ''
              }`}
            >
              <div
                className={`p-2 border-2 transition-colors ${
                  isActive
                    ? 'bg-[#8A4FFF] border-[#F6F2EE]'
                    : 'bg-transparent border-[#F6F2EE] hover:border-[#8A4FFF]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#F6F2EE]' : 'text-[#A0A0A0]'}`} />
              </div>
              <span
                className={`text-xs uppercase tracking-widest ${
                  isActive ? 'text-[#F6F2EE]' : 'text-[#A0A0A0]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
