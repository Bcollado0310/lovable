import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Mail, User, Globe, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // <-- Supabase client

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  country: string;        // UI label (e.g., "Spain")
  age: string;
  incomeBracket: string;  // enum value string
  marketingOptIn: boolean;
  privacyAccepted: boolean;
  honeypot: string;       // Hidden field for bot protection
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  country?: string;
  age?: string;
  incomeBracket?: string;
  privacyAccepted?: string;
}

/** Map UI country names -> 2-letter uppercase codes (fits table constraint) */
const countryNameToISO2: Record<string, string> = {
  Austria: 'AT', Belgium: 'BE', Bulgaria: 'BG', Croatia: 'HR', Cyprus: 'CY',
  'Czech Republic': 'CZ', Denmark: 'DK', Estonia: 'EE', Finland: 'FI', France: 'FR',
  Germany: 'DE', Greece: 'GR', Hungary: 'HU', Ireland: 'IE', Italy: 'IT',
  Latvia: 'LV', Lithuania: 'LT', Luxembourg: 'LU', Malta: 'MT', Netherlands: 'NL',
  Poland: 'PL', Portugal: 'PT', Romania: 'RO', Slovakia: 'SK', Slovenia: 'SI',
  Spain: 'ES', Sweden: 'SE', 'United Kingdom': 'UK', Other: 'ZZ'
};

const countries = [
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic','Denmark','Estonia','Finland',
  'France','Germany','Greece','Hungary','Ireland','Italy','Latvia','Lithuania','Luxembourg','Malta',
  'Netherlands','Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden','United Kingdom','Other'
];

const incomeBrackets = ['€0–€20k','€20k–€50k','€50k–€100k','€100k–€200k','€200k+','Prefer not to say'];

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function parseUtm() {
  if (typeof window === 'undefined') return {};
  const u = new URL(window.location.href);
  const q = u.searchParams;
  return {
    utm_source: q.get('utm_source') || null,
    utm_medium: q.get('utm_medium') || null,
    utm_campaign: q.get('utm_campaign') || null,
    utm_term: q.get('utm_term') || null,
    utm_content: q.get('utm_content') || null,
    referer_url: document.referrer || null,
    user_agent: navigator.userAgent || null
  };
}

const WaitlistForm = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    age: '',
    incomeBracket: '',
    marketingOptIn: false,
    privacyAccepted: false,
    honeypot: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const utm = useMemo(() => parseUtm(), []);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.country) newErrors.country = 'Country selection is required';
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else {
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
        newErrors.age = 'Age must be between 18 and 120';
      }
    }
    if (!formData.incomeBracket) newErrors.incomeBracket = 'Income bracket is required';
    if (!formData.privacyAccepted) newErrors.privacyAccepted = 'You must accept the privacy policy';

    // Honeypot
    if (formData.honeypot) throw new Error('Bot detected');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const iso2 = countryNameToISO2[formData.country] || 'ZZ'; // default to 'ZZ' if unmapped
      const payload = {
        email: formData.email.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        country_code: iso2,                              // fits table constraint
        age: parseInt(formData.age, 10),
        income_bracket: formData.incomeBracket,         // must match enum exactly
        marketing_opt_in: formData.marketingOptIn,
        privacy_accepted: formData.privacyAccepted,     // RLS requires true
        ...utm                                          // utm_source, etc., referer_url, user_agent
      };

      // Temporarily cast to bypass type issues until DB types regenerate
      const { error } = await (supabase as any)
        .from('waitlist_signups')
        .insert({
          ...payload,
          income_bracket: formData.incomeBracket as any // Cast income bracket to match enum
        });

      if (error) {
        // Unique violation -> treat as success so users aren’t blocked
        if ((error as any).code === '23505') {
          setIsSuccess(true);
          toast({ title: "You're already on the list ✨", description: "We’ll keep you posted by email." });
        } else {
          throw error;
        }
      } else {
        // Send welcome email after successful database insertion
        try {
          const emailResponse = await supabase.functions.invoke('send-welcome-email', {
            body: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email
            }
          });

          if (emailResponse.error) {
            console.error('Email sending error:', emailResponse.error);
          } else {
            console.log('Welcome email sent successfully');
          }
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't block success flow if email fails
        }

        setIsSuccess(true);
        toast({
          title: "Welcome to Aurora Equity! 🎉",
          description: "You've successfully joined our exclusive waitlist. Check your email for details!"
        });
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      toast({
        title: "Submission Failed",
        description: err?.message || "There was an error submitting your information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card neon-glow text-center">
            <CardHeader className="pb-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl gradient-text">You're In! 🎉</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Welcome to the exclusive Aurora Equity waitlist
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Thank you for joining us on this revolutionary journey. We'll keep you updated
                with exclusive insights and be the first to notify you when Aurora Equity launches.
              </p>
              <div className="glass-card p-4 text-sm text-muted-foreground">
                <p>💎 VIP early access secured</p>
                <p>📈 Exclusive market insights</p>
                <p>🚀 First to invest opportunities</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="waitlist" className="py-20 px-6 bg-slate-950">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Join the Revolution</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Be among the first to access the future of real estate investing
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl neon-text">Exclusive Waitlist</CardTitle>
            <CardDescription>
              Secure your spot in the next generation of real estate crowdfunding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hidden Honeypot Field */}
              <input
                type="text"
                name="website"
                value={formData.honeypot}
                onChange={e => setFormData(prev => ({ ...prev, honeypot: e.target.value }))}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2">
                    <User className="w-4 h-4" /> First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={`glass ${errors.firstName ? 'border-destructive' : ''}`}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <p className="text-destructive text-sm">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2">
                    <User className="w-4 h-4" /> Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={`glass ${errors.lastName ? 'border-destructive' : ''}`}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && <p className="text-destructive text-sm">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`glass ${errors.email ? 'border-destructive' : ''}`}
                  placeholder="Enter your email address"
                />
                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>

              {/* Country and Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Country *
                  </Label>
                  <Select
                    value={formData.country}
                    onValueChange={value => setFormData(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger className={`glass ${errors.country ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && <p className="text-destructive text-sm">{errors.country}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2">
                    <User className="w-4 h-4" /> Age *
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="120"
                    value={formData.age}
                    onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    className={`glass ${errors.age ? 'border-destructive' : ''}`}
                    placeholder="Enter your age"
                  />
                  {errors.age && <p className="text-destructive text-sm">{errors.age}</p>}
                </div>
              </div>

              {/* Income Bracket */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Annual Income (EUR) *
                </Label>
                <Select
                  value={formData.incomeBracket}
                  onValueChange={value => setFormData(prev => ({ ...prev, incomeBracket: value }))}
                >
                  <SelectTrigger className={`glass ${errors.incomeBracket ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select your income bracket" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {incomeBrackets.map(bracket => (
                      <SelectItem key={bracket} value={bracket}>{bracket}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.incomeBracket && <p className="text-destructive text-sm">{errors.incomeBracket}</p>}
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketingOptIn"
                    checked={formData.marketingOptIn}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, marketingOptIn: !!checked }))}
                  />
                  <Label htmlFor="marketingOptIn" className="text-sm leading-relaxed">
                    I'd like to receive exclusive updates, market insights, and investment opportunities from Aurora Equity
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacyAccepted"
                    checked={formData.privacyAccepted}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, privacyAccepted: !!checked }))}
                  />
                  <Label htmlFor="privacyAccepted" className="text-sm leading-relaxed">
                    I accept the <a href="/privacy" className="neon-text hover:underline">Privacy Policy</a> and agree to the processing of my personal data *
                  </Label>
                </div>
                {errors.privacyAccepted && <p className="text-destructive text-sm">{errors.privacyAccepted}</p>}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-primary hover:opacity-90 text-lg font-semibold neon-glow"
              >
                {isSubmitting ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Joining Waitlist...</>) : 'Join Exclusive Waitlist'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
export default WaitlistForm;