import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft } from 'lucide-react';

interface LoginScreenProps {
  onBack: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginScreen({ onBack, onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting to reach:', 'https://djsuqvmefbgnmoyfpqhi.supabase.co');
      const response = await fetch('https://djsuqvmefbgnmoyfpqhi.supabase.co/rest/v1/', {
        headers: { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqc3Vxdm1lZmJnbm1veWZwcWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc4MzcsImV4cCI6MjA3MTg4MzgzN30.ojH8W5hjbUbKKf_AaMnYzHGA5vf_fDtG8Bvguet8soA' }
      });
      console.log('Basic connectivity test response status:', response.status);
    } catch (e) {
      console.error('Basic connectivity test failed:', e);
    }

    try {
      console.log('Attempting login with:', email);
      await onLogin(email, password);
      console.log('Login successful');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE]"
        >
          <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
        </button>
        <h3 className="text-[#F6F2EE]">Login</h3>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-8">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
          <div>
            <Label htmlFor="email" className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-2 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE] focus:border-[#8A4FFF]"
              placeholder="street@patronpass.com"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-2 block">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE] focus:border-[#8A4FFF]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-[#FF4444] border-3 border-[#F6F2EE] text-[#F6F2EE]">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-[#8A4FFF] hover:bg-[#7A3FEF] text-[#F6F2EE] border-4 border-[#F6F2EE] uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          {/* Test credentials hint */}
          <div className="mt-8 p-4 bg-[#151515] border-2 border-[#8A4FFF]">
            <p className="text-xs text-[#A0A0A0] uppercase tracking-wide mb-2">Test Account</p>
            <p className="text-sm text-[#F6F2EE] font-mono">test@patronpass.com</p>
            <p className="text-sm text-[#F6F2EE] font-mono">TestPass123!</p>
          </div>
        </form>
      </div>
    </div>
  );
}
