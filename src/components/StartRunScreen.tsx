import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Play } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import type { StreetUser } from '../hooks/useAuth';

interface StartRunScreenProps {
  user: StreetUser;
  onBack: () => void;
  onRunStarted: (runId: string) => void;
}

const NEIGHBORHOODS = [
  'Lower East Side',
  'Williamsburg',
  'Bushwick',
  'East Village',
  'SoHo',
  'West Village',
  'Brooklyn Heights',
  'Park Slope',
  'Greenpoint',
  'Astoria',
];

export function StartRunScreen({ user, onBack, onRunStarted }: StartRunScreenProps) {
  const [formData, setFormData] = useState({
    title: '',
    neighborhood: '',
    plannedVenueCount: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      const title = formData.title || `${formData.neighborhood} Street Run`;

      const { data, error: insertError } = await supabase
        .from('street_runs')
        .insert({
          user_id: user.id,
          title,
          city: user.city,
          neighborhood: formData.neighborhood,
          start_time: new Date().toISOString(),
          planned_venue_count: formData.plannedVenueCount,
          actual_venue_count: 0,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        onRunStarted(data.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start run');
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
        <h3 className="text-[#F6F2EE]">Start Street Run</h3>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
          <div>
            <Label className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-2 block">
              Run Title (optional)
            </Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE]"
              placeholder="Thursday Night Crawl"
            />
            <p className="text-xs text-[#A0A0A0] mt-2">
              Leave blank to auto-generate from neighborhood
            </p>
          </div>

          <div>
            <Label className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-3 block">
              Neighborhood
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {NEIGHBORHOODS.map(neighborhood => (
                <button
                  key={neighborhood}
                  type="button"
                  onClick={() => setFormData({ ...formData, neighborhood })}
                  className={`p-3 border-3 text-sm transition-all ${
                    formData.neighborhood === neighborhood
                      ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                      : 'bg-[#151515] border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
                  }`}
                >
                  {neighborhood}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-2 block">
              Planned Venues
            </Label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, plannedVenueCount: Math.max(1, formData.plannedVenueCount - 1) })}
                className="w-12 h-12 border-3 border-[#F6F2EE] text-[#F6F2EE] hover:bg-[#8A4FFF] transition-colors"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <p className="text-3xl font-bold text-[#F6F2EE]">{formData.plannedVenueCount}</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, plannedVenueCount: formData.plannedVenueCount + 1 })}
                className="w-12 h-12 border-3 border-[#F6F2EE] text-[#F6F2EE] hover:bg-[#8A4FFF] transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-[#FF4444] border-3 border-[#F6F2EE] text-[#F6F2EE]">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !formData.neighborhood}
            className="w-full h-14 bg-[#8A4FFF] hover:bg-[#7A3FEF] text-[#F6F2EE] border-4 border-[#F6F2EE] uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5" />
            {loading ? 'Starting...' : 'Start Run'}
          </Button>

          {/* Info box */}
          <div className="p-4 bg-[#151515] border-2 border-[#8A4FFF]">
            <p className="text-xs text-[#A0A0A0] uppercase tracking-wide mb-2">Pro Tip</p>
            <p className="text-sm text-[#F6F2EE]">
              Set a target, but stay flexible. The best conversations happen when you're not rushed.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
