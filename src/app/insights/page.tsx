"use client";

import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Target, Globe, Award, Zap, Calendar, Users, Eye, Heart } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

export default function InsightsPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="heading-2 mb-2">AI-Powered Insights</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get intelligent recommendations to grow your channel and optimize your content strategy.
          </p>
        </motion.div>

        {/* Insights Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Best Upload Time</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Based on your audience analysis, your videos perform best when uploaded on:
                </p>
                <div className="bg-green-500/10 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-600">
                    📅 Fridays at 3:00 PM EST
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Content Suggestions</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your audience is most engaged with:
                </p>
                <div className="space-y-2">
                  <div className="bg-blue-500/10 rounded-lg p-2">
                    <p className="text-sm font-medium text-blue-600">
                      🎯 Tutorial videos (85% engagement)
                    </p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-2">
                    <p className="text-sm font-medium text-blue-600">
                      🎯 Behind-the-scenes content (72% engagement)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Audience Growth</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your channel is growing faster than 78% of similar channels:
                </p>
                <div className="bg-purple-500/10 rounded-lg p-3">
                  <p className="text-sm font-medium text-purple-600">
                    📈 +23% growth this month
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Achievement Unlocked</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  You're close to reaching a new milestone:
                </p>
                <div className="bg-orange-500/10 rounded-lg p-3">
                  <p className="text-sm font-medium text-orange-600">
                    🏆 1,000 subscribers (87% complete)
                  </p>
                  <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 mx-auto mb-4 flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold mb-2 text-foreground">View Velocity</h4>
            <p className="text-2xl font-bold text-blue-600 mb-2">+45%</p>
            <p className="text-sm text-muted-foreground">vs last month</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="font-semibold mb-2 text-foreground">Engagement Rate</h4>
            <p className="text-2xl font-bold text-green-600 mb-2">8.5%</p>
            <p className="text-sm text-muted-foreground">Above average</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <h4 className="font-semibold mb-2 text-foreground">Subscriber Growth</h4>
            <p className="text-2xl font-bold text-purple-600 mb-2">+156</p>
            <p className="text-sm text-muted-foreground">This month</p>
          </div>
        </motion.div>

        {/* Content Calendar Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2 text-foreground">Content Calendar Optimization</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Based on your audience behavior, here's the optimal posting schedule:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-500/10 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-600 mb-1">Monday</p>
                  <p className="text-xs text-muted-foreground">Educational content</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-600 mb-1">Wednesday</p>
                  <p className="text-xs text-muted-foreground">Tutorial videos</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-600 mb-1">Friday</p>
                  <p className="text-xs text-muted-foreground">Behind-the-scenes</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-8"
        >
          <div className="text-center">
            <Lightbulb className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold mb-2 text-foreground">AI Recommendations</h4>
            <p className="text-muted-foreground mb-6">
              Get personalized suggestions to optimize your content strategy
            </p>
            <button className="btn btn-primary">
              <Zap className="w-4 h-4 mr-2" />
              Generate AI Insights
            </button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
