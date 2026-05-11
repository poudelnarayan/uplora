"use client";
import { useEffect, useMemo, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { User, CreditCard, Bell, Shield, Globe, Save, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import AppShell from "@/app/components/layout/AppLayout";
import { useTheme } from "@/context/ThemeContext";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { theme, toggleTheme, mounted: themeMounted } = useTheme();

  const primaryEmail = useMemo(() => user?.primaryEmailAddress?.emailAddress || "", [user]);
  const initials = useMemo(() => {
    const first = user?.firstName?.[0] || "";
    const last = user?.lastName?.[0] || "";
    const fallback = user?.fullName?.split(" ").map(p => p[0]).slice(0, 2).join("") || "";
    return (first + last || fallback || "U").toUpperCase();
  }, [user]);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    bio: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    // Hydrate editable fields from Clerk
    const unsafe = (user.unsafeMetadata || {}) as Record<string, unknown>;
    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: typeof unsafe.phone === "string" ? unsafe.phone : "",
      bio: typeof unsafe.bio === "string" ? unsafe.bio : "",
    });
  }, [isLoaded, user]);

  return (
    <AppShell>

    <div className="space-y-6 min-w-0">
      {/* Header — stacks on mobile, side-by-side on sm+. */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="self-start sm:self-auto h-9"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* 5 cols on every breakpoint. Mobile shows icon-only triggers
            (was 3 cols, which forced 2 of the 5 tabs to wrap awkwardly).
            min-w-0 + truncate inside each trigger so labels never break
            the row at narrow widths. */}
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger value="profile" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm min-w-0">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm min-w-0">
            <CreditCard className="h-4 w-4 shrink-0" />
            <span className="truncate">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm min-w-0">
            <Bell className="h-4 w-4 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Alerts</span>
              <span className="hidden sm:inline">Notifications</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm min-w-0">
            <Shield className="h-4 w-4 shrink-0" />
            <span className="truncate">Security</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm min-w-0">
            <Globe className="h-4 w-4 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Prefs</span>
              <span className="hidden sm:inline">Preferences</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shrink-0">
                  <AvatarImage src={user?.imageUrl || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {isLoaded ? (user?.fullName || "Your profile") : "Loading…"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{isLoaded ? primaryEmail : ""}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Avatar + email are managed in Clerk.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                    disabled={!isLoaded || !user || profileSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                    disabled={!isLoaded || !user || profileSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={primaryEmail} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    disabled={!isLoaded || !user || profileSaving}
                    placeholder="(optional)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                  disabled={!isLoaded || !user || profileSaving}
                />
              </div>

              {profileError ? (
                <p className="text-sm text-destructive">{profileError}</p>
              ) : null}
              {profileSaved ? (
                <p className="text-sm text-green-600">Saved.</p>
              ) : null}

              <Button
                className="gap-2"
                disabled={!isLoaded || !user || profileSaving}
                onClick={async () => {
                  if (!user) return;
                  setProfileSaving(true);
                  setProfileError(null);
                  setProfileSaved(false);
                  try {
                    const existingUnsafe = (user.unsafeMetadata || {}) as Record<string, unknown>;
                    await user.update({
                      firstName: profileForm.firstName,
                      lastName: profileForm.lastName,
                      unsafeMetadata: {
                        ...existingUnsafe,
                        phone: profileForm.phone,
                        bio: profileForm.bio,
                      },
                    });
                    setProfileSaved(true);
                    window.setTimeout(() => setProfileSaved(false), 2500);
                  } catch (e) {
                    setProfileError(e instanceof Error ? e.message : "Failed to update profile");
                  } finally {
                    setProfileSaving(false);
                  }
                }}
              >
                <Save className="h-4 w-4" />
                {profileSaving ? "Saving…" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6 border rounded-lg">
                <div className="min-w-0 space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold">Subscription</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage plan, invoices, and payment methods from the Subscription page.
                  </p>
                  <Badge variant="outline" className="text-xs">Powered by Stripe</Badge>
                </div>
                <Button asChild size="sm" className="self-start sm:self-auto shrink-0">
                  <a href="/subscription">Open subscription</a>
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Payment method</h4>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">Manage in Stripe portal</p>
                      <p className="text-xs text-muted-foreground truncate">View or update your payment method</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start sm:self-auto shrink-0"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/stripe/billing-portal", { method: "POST" });
                        if (!response.ok) throw new Error("Failed to open billing portal");
                        const { url } = await response.json();
                        window.open(url, "_blank", "noopener,noreferrer");
                      } catch {
                        // no-op
                      }
                    }}
                  >
                    Open portal
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                  <a href="/subscription">Change plan</a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/stripe/billing-portal", { method: "POST" });
                      if (!response.ok) throw new Error("Failed to open billing portal");
                      const { url } = await response.json();
                      window.open(url, "_blank", "noopener,noreferrer");
                    } catch {
                      // no-op
                    }
                  }}
                >
                  Billing history
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about posts, mentions, and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Email Notifications</h4>
                  <div className="space-y-4">
                    <ToggleRow label="Post published" description="Get notified when your posts go live" defaultChecked />
                    <ToggleRow label="Post failed" description="Alert when a post fails to publish" defaultChecked />
                    <ToggleRow label="Weekly reports" description="Summary of your content performance" />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">Team Notifications</h4>
                  <div className="space-y-4">
                    <ToggleRow label="New team member" description="When someone joins your workspace" defaultChecked />
                    <ToggleRow label="Approval requests" description="When posts need your approval" defaultChecked />
                  </div>
                </div>
              </div>

              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Two-factor authentication</h4>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">Authenticator app</p>
                    <p className="text-xs text-muted-foreground">Not configured</p>
                  </div>
                  <Button variant="outline" size="sm" className="self-start sm:self-auto">Enable</Button>
                </div>
              </div>

              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Update Security
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
              <CardDescription>
                Configure timezone, language, and other preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time</SelectItem>
                      <SelectItem value="pst">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Interface preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 p-4 border rounded-lg bg-card">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {themeMounted ? (
                          theme === "dark" ? (
                            <Moon className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <Sun className="h-4 w-4 text-primary shrink-0" />
                          )
                        ) : (
                          <Moon className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <Label className="text-sm font-semibold">Theme</Label>
                        {themeMounted && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {theme === "dark" ? "Dark" : "Light"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {themeMounted
                          ? theme === "dark"
                            ? "Switch to light mode for a brighter interface."
                            : "Switch to dark mode for reduced eye strain."
                          : "Loading theme preferences…"}
                      </p>
                    </div>
                    <Switch
                      checked={themeMounted ? theme === "dark" : true}
                      onCheckedChange={() => themeMounted && toggleTheme()}
                      disabled={!themeMounted}
                      className="data-[state=checked]:bg-primary shrink-0 mt-0.5"
                    />
                  </div>
                  <ToggleRow label="Compact view" description="Show more content in less space" />
                </div>
              </div>

              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
      </AppShell>

  );
};

/**
 * Single toggle row — label + description on the left, switch on the right.
 * Wraps label nicely on mobile (min-w-0 + truncate) so long descriptions
 * never push the switch off-screen.
 */
function ToggleRow({
  label, description, defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} className="shrink-0 mt-0.5" />
    </div>
  );
}

export default Settings;