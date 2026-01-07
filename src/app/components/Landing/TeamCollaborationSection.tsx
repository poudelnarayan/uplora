import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Calendar, Clock, Users2, Shield, CheckCircle2, AlertCircle } from "lucide-react";

const TeamCollaborationSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-secondary/20 to-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Built for <span className="gradient-text">Team Collaboration</span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Give your team the power to work together seamlessly. Role-based access, shared calendars, 
              and approval workflows that scale with your growing team.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Role-based Access</h3>
                  <p className="text-muted-foreground">Editors create, Admins approve. Perfect permissions for every team member.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Shared Calendar</h3>
                  <p className="text-muted-foreground">See everyone's scheduled posts in one unified calendar view.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Approval Queue</h3>
                  <p className="text-muted-foreground">Track pending approvals and never miss a publication deadline.</p>
                </div>
              </div>
            </div>

            <Button size="lg" className="gradient-cta text-primary-foreground hover-glow">
              Start Collaborating Today
            </Button>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative">
            <Card className="shadow-strong bg-card">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg">Team Workspace</h3>
                    <p className="text-sm text-muted-foreground">Content Pipeline</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Admin View</span>
                  </div>
                </div>

                {/* Content Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-4 bg-primary/60 rounded"></div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">New Product Launch Video</p>
                        <p className="text-xs text-muted-foreground">by Sarah (Editor)</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-warning/15 text-warning border-warning/20">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-4 bg-accent/60 rounded"></div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Weekly Tips - Instagram Stories</p>
                        <p className="text-xs text-muted-foreground">by Mike (Editor)</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-success/15 text-success border-success/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-4 bg-destructive/60 rounded"></div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Behind the Scenes - YouTube</p>
                        <p className="text-xs text-muted-foreground">by Alex (Editor)</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Processing
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">12</div>
                      <div className="text-xs text-muted-foreground">Scheduled</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">3</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">47</div>
                      <div className="text-xs text-muted-foreground">Published</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating Team Members */}
            <div className="absolute -top-4 -right-4 bg-card rounded-full p-2 shadow-medium">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-primary-foreground">S</div>
                <div className="w-8 h-8 bg-accent rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-accent-foreground">M</div>
                <div className="w-8 h-8 bg-secondary rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-secondary-foreground">A</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamCollaborationSection;