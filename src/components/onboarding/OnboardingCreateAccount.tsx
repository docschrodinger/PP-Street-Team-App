import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingCreateAccountProps {
  onBack: () => void;
  onContinue: (data: AccountData) => void;
}

export interface AccountData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  city: string;
}

const CITIES = [
  'Austin', 'Chicago', 'Los Angeles', 'Miami', 'New York City',
  'San Francisco', 'Seattle', 'Denver', 'Nashville', 'Atlanta',
  'Boston', 'Portland', 'San Diego', 'Dallas', 'Phoenix', 'Other'
];

export function OnboardingCreateAccount({ onBack, onContinue }: OnboardingCreateAccountProps) {
  const [formData, setFormData] = useState<AccountData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    city: '',
  });

  const [errors, setErrors] = useState<Partial<AccountData>>({});

  function validate(): boolean {
    const newErrors: Partial<AccountData> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email';
    if (!formData.phone.trim()) newErrors.phone = 'Required';
    if (formData.password.length < 8) newErrors.password = 'Must be 8+ characters';
    if (!formData.city) newErrors.city = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      onContinue(formData);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#FFD700]" />

      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <h3 className="text-[#F6F2EE] flex-1">Create Your Account</h3>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex gap-1">
            <div className="flex-1 h-1 bg-[#8A4FFF]" />
            <div className="flex-1 h-1 bg-[#333]" />
            <div className="flex-1 h-1 bg-[#333]" />
            <div className="flex-1 h-1 bg-[#333]" />
            <div className="flex-1 h-1 bg-[#333]" />
            <div className="flex-1 h-1 bg-[#333]" />
          </div>
          <p className="text-[#A0A0A0] text-xs mt-2">Step 1 of 6</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[#F6F2EE] mb-2">
                First Name <span className="text-[#FF7A59]">*</span>
              </Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE]"
                placeholder="Alex"
              />
              {errors.firstName && <p className="text-[#FF4444] text-xs mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <Label className="text-[#F6F2EE] mb-2">
                Last Name <span className="text-[#FF7A59]">*</span>
              </Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE]"
                placeholder="Johnson"
              />
              {errors.lastName && <p className="text-[#FF4444] text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <Label className="text-[#F6F2EE] mb-2">
              Email <span className="text-[#FF7A59]">*</span>
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE]"
              placeholder="alex@example.com"
            />
            {errors.email && <p className="text-[#FF4444] text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label className="text-[#F6F2EE] mb-2">
              Phone <span className="text-[#FF7A59]">*</span>
            </Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE]"
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && <p className="text-[#FF4444] text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <Label className="text-[#F6F2EE] mb-2">
              Password <span className="text-[#FF7A59]">*</span>
            </Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE]"
              placeholder="Must be 8+ characters"
            />
            {errors.password && <p className="text-[#FF4444] text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <Label className="text-[#F6F2EE] mb-2">
              City <span className="text-[#FF7A59]">*</span>
            </Label>
            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE] px-3"
            >
              <option value="">Select your city</option>
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {errors.city && <p className="text-[#FF4444] text-xs mt-1">{errors.city}</p>}
          </div>

          <div className="pt-4">
            <p className="text-[#A0A0A0] text-xs mb-4">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-[#8A4FFF] underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-[#8A4FFF] underline">Privacy Policy</a>
            </p>

            <Button
              type="submit"
              className="w-full h-14 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider font-bold"
            >
              Continue →
            </Button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
