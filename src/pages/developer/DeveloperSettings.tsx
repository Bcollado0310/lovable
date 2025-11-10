import { Building2, ShieldCheck, Users, Bell, Key, FileText, MessageSquare, Globe2 } from "lucide-react";
import { useDeveloperAuth } from "@/contexts/DeveloperAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function DeveloperSettings() {
  const { organization, user, userRole, hasPermission, loading } = useDeveloperAuth();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center space-y-3 rounded-xl border border-white/5 bg-background/60">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary/40 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading developer settings...</p>
      </div>
    );
  }

  const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "Developer";
  const permissionLabel = hasPermission("manage")
    ? "Full organization access"
    : hasPermission("write")
    ? "Offering & investor edits"
    : "View only";

  const inferredDomain =
    organization?.website?.replace(/^https?:\/\//, "").replace(/\/$/, "") || "aurora-development.com";

  const teamMembers = [
    {
      name: user?.email ? user.email.split("@")[0] : "Primary Contact",
      email: user?.email || "you@demo.dev",
      role: `${roleLabel} - Organization`,
      focusAreas: ["Capital partner onboarding", "Investor disclosures"],
      status: "Active now",
    },
    {
      name: "Jordan Blake",
      email: "jordan@aurora.dev",
      role: "Manager - Capital Markets",
      focusAreas: ["Offering structure", "Compliance reviews"],
      status: "Reviewed 2h ago",
    },
    {
      name: "Priya Patel",
      email: "priya@aurora.dev",
      role: "Editor - Investor Success",
      focusAreas: ["Distribution notices", "Document room"],
      status: "Invited - pending acceptance",
    },
  ];

  const complianceChecklist = [
    {
      title: "Entity verification",
      description: "Articles of organization, EIN confirmation, beneficial ownership certificate.",
      status: "Completed",
    },
    {
      title: "Banking & payouts",
      description: "ACH instructions verified for distributions and capital calls.",
      status: "In review",
    },
    {
      title: "Marketing disclosures",
      description: "Latest offering deck, investor FAQs, financial projections uploaded.",
      status: "Outstanding",
    },
  ];

  const notificationSettings = [
    {
      title: "Distribution approvals",
      description: "Receive alerts when capital events require sign-off.",
      defaultEnabled: true,
    },
    {
      title: "Investor activity",
      description: "Get summaries when prospects access diligence rooms or subscribe.",
      defaultEnabled: true,
    },
    {
      title: "Compliance reminders",
      description: "Monthly reminders for KYC refresh, accreditation, and document expirations.",
      defaultEnabled: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Organization settings</h1>
        <p className="text-muted-foreground">
          Configure the Aurora developer console for your capital markets and investor operations teams.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.65fr_1fr]">
        <div className="space-y-6">
          <Card className="glass-card border-white/5">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Organization profile
              </CardTitle>
              <CardDescription>
                Update the information investors and co-managers see across the pipeline, data rooms, and notices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input
                    id="org-name"
                    defaultValue={organization?.name || "Aurora Development Partners"}
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-domain">Primary domain</Label>
                  <Input
                    id="org-domain"
                    defaultValue={inferredDomain}
                    placeholder="e.g. aurora.capital"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-website">Public website</Label>
                  <Input
                    id="org-website"
                    defaultValue={organization?.website || "https://aurora-development.com"}
                    placeholder="https://"
                    type="url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-contact">Investor relations alias</Label>
                  <Input
                    id="org-contact"
                    defaultValue="investors@aurora.dev"
                    placeholder="investors@yourdomain.com"
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-overview">Executive overview</Label>
                <Textarea
                  id="org-overview"
                  defaultValue={
                    organization?.description ||
                    "Boutique sponsor focused on stabilized multifamily opportunities across the Sunbelt."
                  }
                  placeholder="Share your mandate, track record highlights, and strategic focus."
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" className="border-white/10 bg-background/60 hover:bg-background/80">
                  Preview investor profile
                </Button>
                <Button
                  onClick={() => toast({ title: "Organization profile updated" })}
                  className="border-primary/40 bg-primary/90 text-primary-foreground hover:bg-primary"
                >
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Team &amp; access
              </CardTitle>
              <CardDescription>
                Manage who can launch offerings, approve documents, and communicate with investors in the console.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-white/10 bg-background/40 p-4 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{roleLabel} privileges</p>
                    <p className="text-muted-foreground">{permissionLabel}</p>
                  </div>
                  <Badge className="w-fit border-primary/20 bg-primary/15 text-primary">Current role</Badge>
                </div>
                <div className="mt-4 grid gap-3 text-muted-foreground sm:grid-cols-3">
                  <PermissionPill label="Offering editor" enabled={hasPermission("write")} />
                  <PermissionPill label="Investor comms" enabled={hasPermission("write")} />
                  <PermissionPill label="Org administration" enabled={hasPermission("manage")} />
                </div>
              </div>

              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.email}
                    className="flex flex-col gap-3 rounded-xl border border-white/5 bg-background/40 p-4 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-start md:gap-8"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 border border-white/10 bg-primary/10">
                        <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-xs uppercase tracking-wide text-primary/80">{member.role}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Focus areas</p>
                      <ul className="list-inside list-disc space-y-1">
                        {member.focusAreas.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <Badge variant="outline" className="border-white/20 bg-background/60">
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" className="border-white/10 bg-background/60 hover:bg-background/80">
                  Invite teammate
                </Button>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Export access log
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Notification routing
              </CardTitle>
              <CardDescription>
                Choose how the account management team receives critical investor and deal lifecycle updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {notificationSettings.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 rounded-xl border border-white/5 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked={item.defaultEnabled} className="ml-auto" />
                </div>
              ))}

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" className="border-white/10 bg-background/60 hover:bg-background/80">
                  Manage Slack webhooks
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toast({ title: "Notification preferences saved" })}
                  className="border-primary/20 bg-primary/15 text-primary hover:bg-primary/25"
                >
                  Save preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card border-white/5">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Compliance center
              </CardTitle>
              <CardDescription>
                Monitor the documentation required for sponsor diligence, banking, and investor communications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {complianceChecklist.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/5 bg-background/40 p-4 text-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "Completed"
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                          : item.status === "In review"
                          ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                          : "border-rose-400/30 bg-rose-400/10 text-rose-200"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" className="h-8 border border-white/10 bg-background/60 text-xs">
                      <FileText className="mr-2 h-4 w-4" />
                      View files
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 border border-white/10 bg-background/60 text-xs">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Request update
                    </Button>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-dashed border-white/10 bg-background/40 p-4 text-sm">
                <p className="font-medium text-foreground">Need to add a new entity?</p>
                <p className="text-muted-foreground">
                  Upload legal docs and banking instructions to onboard additional SPVs or managed accounts.
                </p>
                <Button size="sm" className="mt-4 bg-primary/90 text-primary-foreground hover:bg-primary">
                  Start new entity review
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5 text-primary" />
                API credentials
              </CardTitle>
              <CardDescription>
                Use the Aurora API to sync allocations, automate investor updates, and reconcile capital calls.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-white/5 bg-background/40 p-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Production key</span>
                  <span className="font-mono text-sm text-foreground">
                    aurora_prod_{organization?.id?.slice(0, 6) || "xxxxxx"}********
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
                  <span>Last rotated: 18 days ago</span>
                  <span>Usage limit: 50k requests / day</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-8 border-white/10 bg-background/60">
                    Reveal key
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 border-white/10 bg-background/60">
                    Rotate credentials
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-white/10 bg-background/40 p-4 text-sm">
                <p className="font-medium text-foreground">Sandbox access</p>
                <p className="text-muted-foreground">
                  Provision a separate environment for staging data room flows without touching production investors.
                </p>
                <Button size="sm" variant="secondary" className="mt-3 border-primary/20 bg-primary/15 text-primary">
                  Generate sandbox token
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe2 className="h-5 w-5 text-primary" />
                Support &amp; resources
              </CardTitle>
              <CardDescription>
                Connect with the Aurora account management team or explore resources for your capital partners.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border border-white/5 bg-background/40 p-4">
                <p className="font-medium text-foreground">Dedicated account manager</p>
                <p className="text-muted-foreground">
                  Reach out to <span className="text-foreground">maya@aurora.dev</span> for strategy reviews, diligence prep,
                  or onboarding new distribution partners.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 border-white/10 bg-background/60 hover:bg-background/80"
                >
                  Schedule a working session
                </Button>
              </div>
              <div className="rounded-xl border border-white/5 bg-background/40 p-4">
                <p className="font-medium text-foreground">Playbooks &amp; templates</p>
                <p className="text-muted-foreground">
                  Investor FAQ boilerplates, allocation policies, and quarterly reporting checklists tailored for sponsors.
                </p>
                <Button size="sm" variant="ghost" className="pl-0 text-primary hover:text-primary/80">
                  {"Browse resource hub ->"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface PermissionPillProps {
  label: string;
  enabled: boolean;
}

function PermissionPill({ label, enabled }: PermissionPillProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
        enabled
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-background/60 text-muted-foreground"
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      <span className="text-[10px] font-semibold">{enabled ? "Enabled" : "Off"}</span>
    </div>
  );
}
