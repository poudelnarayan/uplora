"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle, AlertCircle, Lightbulb, MessageCircle, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

export default function TestEmailSystemPage() {
  const [testing, setTesting] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{
    type: string;
    success: boolean;
    message: string;
    timestamp: string;
  }>>([]);

  const runTest = async (testType: "feedback" | "idea" | "invitation") => {
    setTesting(testType);
    
    try {
      const response = await fetch("/api/test-email-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType })
      });
      
      const result = await response.json();
      
      setResults(prev => [{
        type: testType,
        success: response.ok,
        message: result.message || result.error || "Unknown result",
        timestamp: result.timestamp || new Date().toLocaleString()
      }, ...prev.slice(0, 9)]); // Keep last 10 results
      
    } catch (error) {
      setResults(prev => [{
        type: testType,
        success: false,
        message: error instanceof Error ? error.message : "Network error",
        timestamp: new Date().toLocaleString()
      }, ...prev.slice(0, 9)]);
    } finally {
      setTesting(null);
    }
  };

  return (
    <AppShell>
      <div className="min-h-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Email System Testing</h1>
          <p className="text-muted-foreground">Test the Idea Lab, Feedback Studio, and Team Invitation email routing</p>
        </motion.div>

        {/* Test Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Feedback Test */}
          <div className="card p-6 text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Feedback Studio</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Test email routing to <strong>feedback@uplora.io</strong>
            </p>
            <button
              onClick={() => runTest("feedback")}
              disabled={testing === "feedback"}
              className="btn btn-primary w-full"
            >
              {testing === "feedback" ? (
                <>
                  <div className="spinner mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Test Feedback Email
                </>
              )}
            </button>
          </div>

          {/* Idea Test */}
          <div className="card p-6 text-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Idea Lab</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Test email routing to <strong>brainstorm@uplora.io</strong>
            </p>
            <button
              onClick={() => runTest("idea")}
              disabled={testing === "idea"}
              className="btn btn-primary w-full"
            >
              {testing === "idea" ? (
                <>
                  <div className="spinner mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Test Idea Email
                </>
              )}
            </button>
          </div>

          {/* Invitation Test */}
          <div className="card p-6 text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Team Invitations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Test team invitation email formatting
            </p>
            <button
              onClick={() => runTest("invitation")}
              disabled={testing === "invitation"}
              className="btn btn-primary w-full"
            >
              {testing === "invitation" ? (
                <>
                  <div className="spinner mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Test Invitation Email
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Email Configuration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Routing Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Feedback Studio</h4>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                All feedback submissions → <strong>feedback@uplora.io</strong>
              </p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2">Idea Lab</h4>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                All idea submissions → <strong>brainstorm@uplora.io</strong>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Test Results */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold text-foreground mb-4">Test Results</h2>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground capitalize">{result.type}</span>
                        <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">Testing Instructions</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Test Each Email Type</p>
                <p>Click each test button to send sample emails to the configured addresses</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Check Email Delivery</p>
                <p>Verify emails arrive at feedback@uplora.io and brainstorm@uplora.io</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Validate Formatting</p>
                <p>Ensure emails have proper formatting, timestamps, and all required details</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}