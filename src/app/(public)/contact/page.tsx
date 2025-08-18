"use client";

import PublicLayout from "@/components/layout/PublicLayout";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { useState } from "react";
import { TextField, SelectField } from "@/components/ui/TextField";
import { Mail, User, MessageSquare, Send, Lightbulb, MapPin, Clock, Phone } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "General",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;
    
    setLoading(true);
    try {
      const composed = `${formData.subject ? `Subject: ${formData.subject}\n` : ""}${formData.name ? `From: ${formData.name}${formData.email ? ` <${formData.email}>` : ""}\n` : ""}\n${formData.message}`;
      
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: composed, 
          category: formData.category, 
          includeEmail: true, 
          path: "/contact" 
        })
      });
      
      setSent(true);
      setFormData({ name: "", email: "", subject: "", category: "General", message: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout title="Contact Us">
      <NextSeoNoSSR 
        title="Contact Us" 
        description="Get in touch with the Uplora team for support, questions, or feedback."
        canonical={typeof window !== "undefined" ? window.location.origin + "/contact" : undefined}
      />
      
      <div className="space-y-8">
        {/* Contact Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Email Support</h3>
            <p className="text-sm text-muted-foreground">Get help with your account</p>
            <p className="text-sm text-primary font-medium mt-2">support@uplora.io</p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Response Time</h3>
            <p className="text-sm text-muted-foreground">We typically respond within</p>
            <p className="text-sm text-secondary font-medium mt-2">24 hours</p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Global Support</h3>
            <p className="text-sm text-muted-foreground">Available worldwide</p>
            <p className="text-sm text-accent font-medium mt-2">24/7 Coverage</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="card p-8">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h3>
              <p className="text-muted-foreground mb-6">
                Thanks for reaching out! We've received your message and will get back to you soon.
              </p>
              <button 
                onClick={() => setSent(false)}
                className="btn btn-primary"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Get in Touch</h2>
                <p className="text-muted-foreground">
                  Have a question, suggestion, or need help? We'd love to hear from you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextField
                    label="Your Name"
                    icon={<User className="w-4 h-4" />}
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: (e.target as HTMLInputElement).value })}
                  />
                  <TextField
                    label="Email Address"
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: (e.target as HTMLInputElement).value })}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <TextField
                    label="Subject"
                    icon={<MessageSquare className="w-4 h-4" />}
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: (e.target as HTMLInputElement).value })}
                  />
                  <SelectField
                    label="Category"
                    icon={<Lightbulb className="w-4 h-4" />}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: (e.target as HTMLSelectElement).value })}
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Support">Technical Support</option>
                    <option value="Billing">Billing & Subscriptions</option>
                    <option value="Feature">Feature Request</option>
                    <option value="Bug">Bug Report</option>
                    <option value="Partnership">Partnership</option>
                  </SelectField>
                </div>

                <TextField
                  label="Message"
                  icon={<MessageSquare className="w-4 h-4" />}
                  placeholder="Tell us about your question or how we can help..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: (e.target as HTMLTextAreaElement).value })}
                  multiline
                  required
                />

                <div className="flex justify-center">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={loading || !formData.message.trim()}
                  >
                    {loading ? (
                      <>
                        <div className="spinner mr-2" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* FAQ Section */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">How does team collaboration work?</h4>
                <p className="text-sm text-muted-foreground">
                  Team members upload videos, owners review and approve them, then approved content goes directly to YouTube. No manual downloading required.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Is my content secure?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! We use enterprise-grade security with encrypted storage and role-based access controls to protect your content.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Can I try Uplora for free?</h4>
                <p className="text-sm text-muted-foreground">
                  Absolutely! We offer a 14-day free trial with full access to all features. No credit card required to start.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">How do I invite team members?</h4>
                <p className="text-sm text-muted-foreground">
                  From your team dashboard, click "Invite Member" and send secure email invitations with specific role permissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}