import { useState, useEffect } from "react";
import { LayoutHeader } from "@/components/layout/LayoutHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Shield, 
  Bell,
  CreditCard,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  created_at: string;
}

export default function AccountPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else if (user === null) {
      // If user is explicitly null (not loading), stop loading
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is okay
        console.error('Error fetching profile:', error);
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't let profile errors block the account page
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse gradient-text text-lg">Loading account...</div>
      </div>
    );
  }

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    : user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long'
      })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-background">
      <LayoutHeader title="Account Settings" />
      
      <div className="mx-auto max-w-6xl space-y-8 p-6">
        <Card className="glass-card border-white/5">
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-primary blur-md opacity-40" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-background/60 shadow-inner">
                  <User className="h-7 w-7 text-primary" />
                </div>
              </div>
              <div>
                <p className="text-sm uppercase tracking-wider text-muted-foreground">Signed in as</p>
                <h2 className="text-2xl font-semibold text-foreground">{user?.email}</h2>
                <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">Active</Badge>
              <Badge className="border-primary/20 bg-primary/10 px-3 py-1 text-primary">Verified</Badge>
              {isAdmin && (
                <Badge className="border-sky-400/20 bg-sky-500/10 px-3 py-1 text-sky-300">Admin</Badge>
              )}
              <Button variant="outline" className="border-white/10 bg-background/40 hover:bg-background/60">
                Manage Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-6">
            <Card className="glass-card border-white/5">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Keep your contact information current and review your membership badges.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="border-white/10 bg-background/50 text-foreground shadow-inner"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="member-since" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Member since
                    </Label>
                    <Input
                      id="member-since"
                      value={memberSince}
                      disabled
                      className="border-white/10 bg-background/50 text-foreground shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Badge className="border-primary/20 bg-primary/10 px-3 py-1 text-primary">Verified investor</Badge>
                  <Badge className="border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">Premium tier</Badge>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="border-white/10 bg-background/40 px-5 hover:bg-background/60"
                    onClick={() => toast({ title: "Profile update saved!" })}
                  >
                    Update profile
                  </Button>
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    View public profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/5">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Security & Privacy
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Strengthen access controls and monitor sign-in activity.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-white/5 bg-background/40 p-4">
                  <div>
                    <p className="font-medium text-foreground">Password</p>
                    <p className="text-sm text-muted-foreground">Last updated: never changed</p>
                  </div>
                  <Button variant="outline" className="border-white/10 bg-background/60 hover:bg-background/80">
                    Change password
                  </Button>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-white/5 bg-background/40 p-4">
                  <div>
                    <p className="font-medium text-foreground">Two-factor authentication</p>
                    <p className="text-sm text-muted-foreground">Add an additional confirmation step at sign in.</p>
                  </div>
                  <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
                    Enable 2FA
                  </Button>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-white/5 bg-background/40 p-4">
                  <div>
                    <p className="font-medium text-foreground">Session history</p>
                    <p className="text-sm text-muted-foreground">Track devices and locations with active sessions.</p>
                  </div>
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    View activity
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/5">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Fine-tune which touch points reach your inbox.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  {
                    title: "Investment updates",
                    description: "Performance, distribution notices and capital events.",
                    defaultChecked: true,
                  },
                  {
                    title: "New opportunities",
                    description: "Early access to curated offerings that fit your mandate.",
                    defaultChecked: true,
                  },
                  {
                    title: "Insights & research",
                    description: "Monthly briefings, sponsor spotlights and macro commentary.",
                    defaultChecked: false,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start justify-between gap-4 rounded-lg border border-white/5 bg-background/40 p-4"
                  >
                    <div className="max-w-md">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={item.defaultChecked}
                      className="h-4 w-4 rounded border-white/20 bg-transparent accent-primary"
                    />
                  </div>
                ))}

                <div className="flex items-center justify-end">
                  <Button
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => toast({ title: "Preferences saved!" })}
                  >
                    Save preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass-card border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Account Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl border border-white/5 bg-background/50 p-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Account status</span>
                    <Badge className="border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                      Active
                    </Badge>
                  </div>
                  <div className="mt-3 flex justify-between text-muted-foreground">
                    <span>Verification</span>
                    <Badge className="border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                      Verified
                    </Badge>
                  </div>
                  <div className="mt-3 flex justify-between text-muted-foreground">
                    <span>Member since</span>
                    <span className="text-foreground">{memberSince}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-background/50 p-4 text-sm">
                  <p className="font-medium text-foreground">Support concierge</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Need to update banking details or accreditation? Our team can help within one business day.
                  </p>
                  <Button variant="outline" className="mt-4 w-full border-white/10 hover:bg-background/60">
                    Contact support
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Download className="h-5 w-5 text-primary" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Tax Documents (2024)",
                  "Investment Summary",
                  "Portfolio Statement",
                ].map((label) => (
                  <Button
                    key={label}
                    variant="ghost"
                    className="w-full justify-between border border-white/5 bg-background/40 text-sm font-medium hover:bg-background/60"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-primary" />
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">Download</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
