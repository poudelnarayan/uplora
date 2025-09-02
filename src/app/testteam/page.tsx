"use client";

import { motion } from "framer-motion";
import { Plus, UserPlus, Settings, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Teams = () => {
  const teamMembers = [
    {
      id: "1",
      name: "John Doe",
      email: "john@acme.com",
      role: "Owner",
      avatar: "https://github.com/shadcn.png",
      status: "active",
      lastActive: "2 hours ago"
    },
    {
      id: "2", 
      name: "Sarah Wilson",
      email: "sarah@acme.com",
      role: "Admin",
      avatar: "/api/placeholder/40/40",
      status: "active",
      lastActive: "5 minutes ago"
    },
    {
      id: "3",
      name: "Mike Chen",
      email: "mike@acme.com", 
      role: "Editor",
      avatar: "/api/placeholder/40/40",
      status: "pending",
      lastActive: "Never"
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily@acme.com",
      role: "Viewer", 
      avatar: "/api/placeholder/40/40",
      status: "active",
      lastActive: "1 day ago"
    }
  ];

  const getRoleColor = (role: string) => {
    switch(role) {
      case "Owner": return "bg-gradient-primary text-white";
      case "Admin": return "bg-warning text-warning-foreground";
      case "Editor": return "bg-success text-success-foreground";
      case "Viewer": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-success";
      case "pending": return "bg-warning";
      case "inactive": return "bg-muted-foreground";
      default: return "bg-muted-foreground";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            Team Management
          </h1>
          <p className="text-muted-foreground">
            Manage workspace members, roles, and permissions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Workspace Settings
          </Button>
          <Button className="gradient-primary shadow-primary gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">4</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-success rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">3</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-warning rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">1</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold">2</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Roles</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team members and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{member.name}</h3>
                      <Badge variant="outline" className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{member.email}</span>
                      <span>Last active: {member.lastActive}</span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Role</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                    <DropdownMenuItem>View Activity</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Teams;