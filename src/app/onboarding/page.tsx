"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Check,
  ClipboardCheck,
  Compass,
  Link2,
  Rocket,
  Sparkles,
  UserRound,
  Users,
  Video,
  Wand2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import ParticleBackground from "@/app/components/ui/ParticleBackground";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Progress } from "@/app/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/hooks/useOnboarding";

const MotionDiv = motion.div;

const steps = [
  { key: "welcome", title: "Welcome", description: "Tell us about your role" },
  { key: "workspace", title: "Workspace", description: "Set up your team space" },
  { key: "connections", title: "Connections", description: "Link your channels" },
  { key: "launch", title: "Launch", description: "Review and go live" }
];

const roleOptions = [
  { id: "creator", title: "Creator", description: "Solo or channel owner", icon: Video },
  { id: "editor", title: "Editor", description: "Editing for a team", icon: UserRound },
  { id: "team", title: "Brand Team", description: "In-house marketing", icon: Users },
  { id: "agency", title: "Agency", description: "Managing multiple clients", icon: Briefcase }
];

const goalOptions = [
  { id: "speed", title: "Ship Faster", description: "Reduce approvals & handoffs", icon: Rocket },
  { id: "quality", title: "Stay On-Brand", description: "Guardrails for every post", icon: ClipboardCheck },
  { id: "scale", title: "Scale Output", description: "More channels, fewer tools", icon: Wand2 },
  { id: "clarity", title: "Get Clarity", description: "Know what’s live and why", icon: Compass }
];

const connectionCards = [
  { title: "YouTube", description: "Primary publishing hub" },
  { title: "Instagram", description: "Reels and Stories ready" },
  { title: "TikTok", description: "Short-form pipeline" },
  { title: "LinkedIn", description: "Professional reach" }
];

const teamSizeOptions = [
  { value: "1", label: "Just me" },
  { value: "2-5", label: "2-5 people" },
  { value: "6-20", label: "6-20 people" },
  { value: "21-100", label: "21-100 people" },
  { value: "100+", label: "100+ people" }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const {
    shouldShowOnboarding,
    isLoading,
    markOnboardingSeen,
    completeOnboarding,
    skipOnboarding
  } = useOnboarding();

  const [stepIndex, setStepIndex] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [teamSize, setTeamSize] = useState("1");
  const [createTeam, setCreateTeam] = useState(true);
  const [teamCreated, setTeamCreated] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const progressValue = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex]);
  const displayName = user?.firstName || user?.fullName || "there";

  useEffect(() => {
    if (!isLoaded) return;
    markOnboardingSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  useEffect(() => {
    if (isLoading) return;
    if (shouldShowOnboarding === false) {
      router.replace("/dashboard");
    }
  }, [isLoading, shouldShowOnboarding, router]);

  const handleSkip = async () => {
    try {
      await skipOnboarding();
      router.replace("/dashboard");
    } catch (error) {
      console.error("Skip onboarding failed:", error);
    }
  };

  const handleCreateTeam = async () => {
    if (!createTeam || teamCreated) return true;
    if (!workspaceName.trim()) {
      setTeamError("Workspace name is required to create a team.");
      return false;
    }

    setIsCreatingTeam(true);
    setTeamError(null);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName.trim(),
          description: "Workspace created during onboarding"
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (data as any)?.error || (data as any)?.message || "Failed to create workspace.";
        setTeamError(message);
        return false;
      }

      setTeamCreated(true);
      return true;
    } catch (error) {
      setTeamError("Unable to create workspace. Please try again.");
      return false;
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleNext = async () => {
    if (stepIndex === 1) {
      const ok = await handleCreateTeam();
      if (!ok) return;
    }
    setStepIndex((idx) => Math.min(idx + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepIndex((idx) => Math.max(idx - 1, 0));
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await completeOnboarding();
      router.replace("/dashboard");
    } catch (error) {
      console.error("Complete onboarding failed:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const canContinueFromWorkspace = !createTeam || teamCreated || workspaceName.trim().length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/40">
      <ParticleBackground className="opacity-50" />
      <div className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-hero text-background shadow-sage">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Onboarding</p>
              <h1 className="font-display text-xl text-foreground">Welcome to Uplora, {displayName}</h1>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
            Skip for now
          </Button>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <Card className="border-border/60 bg-card/80 shadow-medium">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    Step {stepIndex + 1} of {steps.length}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} className="h-2 bg-muted/70" />
                <div className="space-y-4">
                  {steps.map((step, index) => {
                    const isActive = index === stepIndex;
                    const isComplete = index < stepIndex;
                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold",
                            isComplete ? "border-primary bg-primary text-primary-foreground" : "",
                            isActive ? "border-primary text-primary" : "border-border text-muted-foreground"
                          )}
                        >
                          {isComplete ? <Check className="h-3 w-3" /> : index + 1}
                        </div>
                        <div>
                          <p className={cn("text-sm font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}>{step.title}</p>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 shadow-medium">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Need help connecting?</p>
                    <p className="text-xs text-muted-foreground">Our social hub is ready anytime.</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => router.push("/social")}>
                  Open Social Connections
                </Button>
              </CardContent>
            </Card>
          </aside>

          <Card className="border-border/60 bg-card/90 shadow-strong">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <MotionDiv
                  key={steps[stepIndex].key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {stepIndex === 0 && (
                    <div className="space-y-8">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Personalization</p>
                        <h2 className="font-display text-3xl text-foreground">Design your workspace</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Tell us who you are and what success looks like. We will tune Uplora around your workflow.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm text-foreground">Your role</Label>
                        <div className="grid gap-3 md:grid-cols-2">
                          {roleOptions.map((option) => {
                            const Icon = option.icon;
                            const active = role === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setRole(option.id)}
                                className={cn(
                                  "group rounded-xl border p-4 text-left transition",
                                  active
                                    ? "border-primary bg-primary/10 shadow-sage"
                                    : "border-border/60 bg-background hover:border-primary/50 hover:bg-muted/40"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{option.title}</p>
                                    <p className="text-xs text-muted-foreground">{option.description}</p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm text-foreground">Primary goal</Label>
                        <div className="grid gap-3 md:grid-cols-2">
                          {goalOptions.map((option) => {
                            const Icon = option.icon;
                            const active = goal === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setGoal(option.id)}
                                className={cn(
                                  "group rounded-xl border p-4 text-left transition",
                                  active
                                    ? "border-primary bg-primary/10 shadow-sage"
                                    : "border-border/60 bg-background hover:border-primary/50 hover:bg-muted/40"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{option.title}</p>
                                    <p className="text-xs text-muted-foreground">{option.description}</p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {stepIndex === 1 && (
                    <div className="space-y-8">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
                        <h2 className="font-display text-3xl text-foreground">Build your operating hub</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Create a workspace for your team. You can invite collaborators and define roles right after onboarding.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm text-foreground">Workspace name</Label>
                        <Input
                          value={workspaceName}
                          onChange={(event) => setWorkspaceName(event.target.value)}
                          placeholder="Ex: Uplora Studio"
                          className="h-11"
                        />
                        {teamError && <p className="text-xs text-warning">{teamError}</p>}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <Label className="text-sm text-foreground">Team size</Label>
                          <Select value={teamSize} onValueChange={setTeamSize}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {teamSizeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex h-full flex-col justify-between rounded-xl border border-border/60 bg-muted/30 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">Create team workspace</p>
                              <p className="text-xs text-muted-foreground">Spin up a shared workspace now.</p>
                            </div>
                            <Switch checked={createTeam} onCheckedChange={setCreateTeam} />
                          </div>
                          {teamCreated && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                              <Check className="h-4 w-4" />
                              Workspace created successfully.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {stepIndex === 2 && (
                    <div className="space-y-8">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Connections</p>
                        <h2 className="font-display text-3xl text-foreground">Bring your channels together</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Connect your publishing destinations now or return later. You can always manage connections in the Social hub.
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {connectionCards.map((card) => (
                          <div key={card.title} className="rounded-xl border border-border/60 bg-background p-4">
                            <p className="text-sm font-semibold text-foreground">{card.title}</p>
                            <p className="text-xs text-muted-foreground">{card.description}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" onClick={() => router.push("/social")}>
                          Open Social Connections
                        </Button>
                        <p className="text-xs text-muted-foreground">We will keep onboarding open in this tab.</p>
                      </div>
                    </div>
                  )}

                  {stepIndex === 3 && (
                    <div className="space-y-8">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Launch</p>
                        <h2 className="font-display text-3xl text-foreground">Ready to launch your workflow</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Review your setup and head into the dashboard.
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-border/60 bg-background p-4">
                          <p className="text-xs font-medium text-muted-foreground">Role</p>
                          <p className="text-sm font-semibold text-foreground">
                            {role ? roleOptions.find((r) => r.id === role)?.title : "Not selected"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background p-4">
                          <p className="text-xs font-medium text-muted-foreground">Primary goal</p>
                          <p className="text-sm font-semibold text-foreground">
                            {goal ? goalOptions.find((g) => g.id === goal)?.title : "Not selected"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background p-4">
                          <p className="text-xs font-medium text-muted-foreground">Workspace</p>
                          <p className="text-sm font-semibold text-foreground">
                            {workspaceName.trim() || "Personal workspace"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background p-4">
                          <p className="text-xs font-medium text-muted-foreground">Team size</p>
                          <p className="text-sm font-semibold text-foreground">{teamSize}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                        <Rocket className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">You are all set.</p>
                          <p className="text-xs text-muted-foreground">Start uploading, approving, and publishing in minutes.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </MotionDiv>
              </AnimatePresence>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                <Button variant="ghost" onClick={handleBack} disabled={stepIndex === 0}>
                  Back
                </Button>
                {stepIndex < steps.length - 1 ? (
                  <Button onClick={handleNext} disabled={!canContinueFromWorkspace || isCreatingTeam}>
                    {isCreatingTeam ? "Creating workspace..." : "Continue"}
                  </Button>
                ) : (
                  <Button onClick={handleComplete} disabled={isCompleting}>
                    {isCompleting ? "Launching..." : "Go to dashboard"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
