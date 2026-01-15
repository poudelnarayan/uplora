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

    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
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
              {/* Avatar Section (mirrors top-right user menu style) */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.imageUrl || undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {isLoaded ? (user?.fullName || "Your profile") : "Loading…"}
                    </p>
                    <p className="text-xs text-muted-foreground">{isLoaded ? primaryEmail : ""}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
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
              <div className="flex items-center justify-between p-6 border rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold">Subscription</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage plan, invoices, and payment methods from the Subscription page.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">Powered by Stripe</Badge>
                  </div>
                </div>
                <Button asChild>
                  <a href="/subscription">Open Subscription</a>
                </Button>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Payment Method</h4>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Manage in Stripe portal</p>
                      <p className="text-sm text-muted-foreground">View / update your payment method</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
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
                    Open Portal
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href="/subscription">Change Plan</a>
                </Button>
                <Button
                  variant="outline"
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
                  Billing History
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
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Post Published</Label>
                        <p className="text-sm text-muted-foreground">Get notified when your posts go live</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Post Failed</Label>
                        <p className="text-sm text-muted-foreground">Alert when a post fails to publish</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">Summary of your content performance</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">Team Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>New Team Member</Label>
                        <p className="text-sm text-muted-foreground">When someone joins your workspace</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Approval Requests</Label>
                        <p className="text-sm text-muted-foreground">When posts need your approval</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
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
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">Not configured</p>
                  </div>
                  <Button variant="outline">Enable</Button>
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

              <div className="space-y-4">
                <h4 className="font-medium">Interface Preferences</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {themeMounted ? (
                          theme === "dark" ? (
                            <Moon className="h-4 w-4 text-primary" />
                          ) : (
                            <Sun className="h-4 w-4 text-primary" />
                          )
                        ) : (
                          <Moon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Label className="text-base font-semibold">Theme</Label>
                        {themeMounted && (
                          <Badge variant="outline" className="text-xs">
                            {theme === "dark" ? "Dark" : "Light"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {themeMounted ? (
                          theme === "dark" 
                            ? "Dark theme is active. Switch to light mode for a brighter interface." 
                            : "Light theme is active. Switch to dark mode for reduced eye strain."
                        ) : (
                          "Loading theme preferences..."
                        )}
                      </p>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={themeMounted ? theme === "dark" : true}
                        onCheckedChange={() => {
                          if (themeMounted) {
                            toggleTheme();
                          }
                        }}
                        disabled={!themeMounted}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div>
                      <Label>Compact View</Label>
                      <p className="text-sm text-muted-foreground">Show more content in less space</p>
                    </div>
                    <Switch />
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
      </Tabs>
      </div>
      </AppShell>
      
  );
};

export default Settings;