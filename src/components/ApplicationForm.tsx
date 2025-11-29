import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createClient } from '../utils/supabase/client';

interface ApplicationFormProps {
  onBack: () => void;
}

const EXPERIENCE_TAGS = [
  'nightlife',
  'sales',
  'promo',
  'hospitality',
  'events',
  'marketing'
];

export function ApplicationForm({ onBack }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    instagram_handle: '',
    experience_tags: [] as string[],
    why_join: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleExperienceTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      experience_tags: prev.experience_tags.includes(tag)
        ? prev.experience_tags.filter(t => t !== tag)
        : [...prev.experience_tags, tag]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      
      const { error: insertError } = await supabase
        .from('street_applications')
        .insert({
          ...formData,
          status: 'submitted',
        });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] px-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-6 bg-[#151515] border-4 border-[#8A4FFF]">
              <CheckCircle2 className="w-16 h-16 text-[#8A4FFF]" />
            </div>
          </div>
          
          <h2 className="text-[#F6F2EE] mb-4">APPLICATION SUBMITTED</h2>
          
          <p className="text-[#A0A0A0] mb-8">
            Your application is under review. You'll hear from us within 24-48 hours.
          </p>

          <Button
            onClick={onBack}
            className="w-full h-12 bg-[#8A4FFF] hover:bg-[#7A3FEF] text-[#F6F2EE] border-4 border-[#F6F2EE] uppercase tracking-wider"
          >
            Back to Welcome
          </Button>
        </div>
      </div>
    );
  }

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
        <h3 className="text-[#F6F2EE]">Join Street Team</h3>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6 pb-8">
          <div>
            <Label className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-2 block">
              Full Name
            </Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE]"
              placeholder="Jordan Smith"
            />
          </div>

          <div>
            <Label className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-2 block">
              Email
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE]"
              placeholder="jordan@email.com"
            />
          </div>

          <div>
            <Label className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-2 block">
              Phone
            </Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE]"
              placeholder="+1-555-0123"
            />
          </div>

          <div>
            <Label className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-2 block">
              City
            </Label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE]"
              placeholder="Brooklyn, NY"
            />
          </div>

          <div>
            <Label className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-2 block">
              Instagram Handle
            </Label>
            <Input
              value={formData.instagram_handle}
              onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
              className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE]"
              placeholder="@yourhandle"
            />
          </div>

          <div>
            <Label className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-3 block">
              Experience (select all that apply)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {EXPERIENCE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleExperienceTag(tag)}
                  className={`p-3 border-3 uppercase text-sm tracking-wide transition-all ${
                    formData.experience_tags.includes(tag)
                      ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                      : 'bg-[#151515] border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-2 block">
              Why do you want to join the Street Team?
            </Label>
            <Textarea
              value={formData.why_join}
              onChange={(e) => setFormData({ ...formData, why_join: e.target.value })}
              required
              rows={5}
              className="bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE] resize-none"
              placeholder="Tell us about your hustle..."
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
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </div>
    </div>
  );
}
