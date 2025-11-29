import { useState } from 'react';
import { Button } from './ui/button';
import { MapPin, Target, TrendingUp, DollarSign } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const TOUR_STEPS = [
  {
    icon: MapPin,
    title: 'ADD VENUES',
    description: 'Hit the streets. Walk into bars, cafés, nightclubs. Build relationships with owners and GMs. Log every conversation.',
    color: '#8A4FFF',
  },
  {
    icon: Target,
    title: 'COMPLETE MISSIONS',
    description: 'Daily and weekly challenges keep you sharp. Earn XP for every action. Track your streak. Stay hungry.',
    color: '#FF7A59',
  },
  {
    icon: TrendingUp,
    title: 'CLIMB THE RANKS',
    description: 'Bronze → Silver → Gold → Platinum → Diamond → Black Key. Each rank unlocks better perks and higher rev-share.',
    color: '#8A4FFF',
  },
  {
    icon: DollarSign,
    title: 'GET PAID',
    description: 'Earn 15-30% of platform fees from venues you sign. Recurring revenue as long as they stay active. Build your network, build your income.',
    color: '#FF7A59',
  },
];

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] px-6 py-12">
      {/* Skip button */}
      <div className="flex justify-end mb-8">
        <button
          onClick={handleSkip}
          className="text-[#A0A0A0] uppercase text-sm tracking-widest hover:text-[#F6F2EE] transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto">
        {/* Icon */}
        <div 
          className="mb-8 p-8 border-4 border-[#F6F2EE] grain-texture"
          style={{ backgroundColor: step.color }}
        >
          <Icon className="w-20 h-20 text-[#F6F2EE]" />
        </div>

        {/* Title */}
        <h2 className="text-[#F6F2EE] mb-4 text-center">{step.title}</h2>

        {/* Description */}
        <p className="text-[#A0A0A0] text-center mb-12 leading-relaxed">
          {step.description}
        </p>

        {/* Progress dots */}
        <div className="flex gap-2 mb-8">
          {TOUR_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-8 border-2 border-[#F6F2EE] transition-colors ${
                index === currentStep ? 'bg-[#8A4FFF]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Next button */}
        <Button
          onClick={handleNext}
          className="w-full h-14 bg-[#8A4FFF] hover:bg-[#7A3FEF] text-[#F6F2EE] border-4 border-[#F6F2EE] uppercase tracking-wider"
        >
          {currentStep < TOUR_STEPS.length - 1 ? 'Next' : 'Get Started'}
        </Button>
      </div>

      {/* Bottom indicator */}
      <div className="text-center text-xs text-[#A0A0A0] uppercase tracking-widest mt-8">
        {currentStep + 1} / {TOUR_STEPS.length}
      </div>
    </div>
  );
}
