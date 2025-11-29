import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { TrendingUp, DollarSign, Award } from 'lucide-react';

interface OnboardingWelcomeProps {
  onStart: () => void;
  onSignIn: () => void;
}

export function OnboardingWelcome({ onStart, onSignIn }: OnboardingWelcomeProps) {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 relative overflow-hidden">
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
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#FFD700]"
        style={{ backgroundSize: '200% 100%' }}
      />

      {/* Decorative background shapes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-20 right-10 w-32 h-32 border-4 border-[#8A4FFF] opacity-10"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-20 left-10 w-24 h-24 border-4 border-[#FF7A59] opacity-10"
      />

      {/* Main content */}
      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 bg-[#8A4FFF] border-4 border-[#F6F2EE] flex items-center justify-center mx-auto">
              <span className="text-4xl font-bold text-[#F6F2EE]">PP</span>
            </div>
          </motion.div>
          
          <h1 className="text-[#F6F2EE] mb-3">
            Patron Pass<br/>Street Team
          </h1>
          <p className="text-[#A0A0A0] text-lg">
            Build your venue portfolio.<br/>
            Earn recurring income.<br/>
            Own equity.
          </p>
        </motion.div>

        {/* Value props */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-8"
        >
          <div className="flex items-start gap-3 p-4 bg-[#151515] border-2 border-[#8A4FFF]">
            <DollarSign className="w-6 h-6 text-[#FFD700] flex-shrink-0 mt-1" />
            <div>
              <p className="text-[#F6F2EE] font-bold mb-1">Unlimited Earning Potential</p>
              <p className="text-[#A0A0A0] text-sm">
                $100/mo per venue. 20 venues = $2,000/mo recurring.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#151515] border-2 border-[#FF7A59]">
            <TrendingUp className="w-6 h-6 text-[#8A4FFF] flex-shrink-0 mt-1" />
            <div>
              <p className="text-[#F6F2EE] font-bold mb-1">Compound Your Income</p>
              <p className="text-[#A0A0A0] text-sm">
                Each venue pays you 6-12 months. Build your portfolio.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#151515] border-2 border-[#FFD700]">
            <Award className="w-6 h-6 text-[#FFD700] flex-shrink-0 mt-1" />
            <div>
              <p className="text-[#F6F2EE] font-bold mb-1">Earn Ownership</p>
              <p className="text-[#A0A0A0] text-sm">
                Top performers get stock options. Build equity.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Button
            onClick={onStart}
            className="w-full h-14 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider font-bold text-lg relative overflow-hidden group"
          >
            Get Started
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
          </Button>

          <button
            onClick={onSignIn}
            className="w-full text-[#8A4FFF] text-sm hover:text-[#FF7A59] transition-colors"
          >
            Already have an account? <span className="underline">Sign in</span>
          </button>
        </motion.div>

        {/* Fine print */}
        <p className="text-[#666] text-xs text-center mt-8">
          No experience needed • Flexible schedule • Build your own business
        </p>
      </div>
    </div>
  );
}
