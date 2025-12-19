"use client";

import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Mail, MessageCircle, Clock, MapPin, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const ContactSection = () => {
  const { isVisible, elementRef } = useScrollAnimation();
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: ''
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after success message
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ email: '', subject: '', message: '' });
    }, 3000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-secondary/20 to-background relative overflow-hidden">
      {/* Interactive background particles */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div ref={elementRef} className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Get in <span className="gradient-text">Touch</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about Uplora? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className={`grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {/* Contact Form */}
          <Card className="shadow-strong bg-card relative overflow-hidden">
            {/* Success overlay */}
            {isSubmitted && (
              <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center z-20 animate-fade-in">
                <div className="text-center p-8">
                  <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4 animate-scale-in" />
                  <h3 className="text-2xl font-bold text-primary mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">We'll get back to you within 24 hours.</p>
                </div>
              </div>
            )}

            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-primary" />
                Send us a message
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Input 
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="john@example.com" 
                      className={`bg-secondary/30 border-border/50 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:bg-background transform transition-all duration-300 ${
                        focusedField === 'email' ? 'scale-[1.02] border-primary' : ''
                      }`}
                    />
                    <Mail className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${
                      focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                </div>
                
                <div className="relative">
                  <Label htmlFor="subject" className="text-sm font-medium mb-2 block">
                    Subject *
                  </Label>
                  <Input 
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    onFocus={() => setFocusedField('subject')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="How can we help you?" 
                    className={`bg-secondary/30 border-border/50 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:bg-background transform transition-all duration-300 ${
                      focusedField === 'subject' ? 'scale-[1.02] border-primary' : ''
                    }`}
                  />
                </div>
                
                <div className="relative">
                  <Label htmlFor="message" className="text-sm font-medium mb-2 block">
                    Message *
                  </Label>
                  <Textarea 
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Tell us more about your needs..." 
                    rows={4}
                    className={`bg-secondary/30 border-border/50 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:bg-background transform transition-all duration-300 resize-none ${
                      focusedField === 'message' ? 'scale-[1.02] border-primary' : ''
                    }`}
                  />
                </div>
                
                <Button 
                  type="submit"
                  size="lg" 
                  disabled={isSubmitting || isSubmitted}
                  className={`w-full text-lg py-4 transition-all duration-300 group relative overflow-hidden ${
                    isSubmitting 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : 'gradient-primary text-primary-foreground hover:shadow-xl hover:scale-[1.02]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-8">
                We're here to help you streamline your content workflow. Reach out to us through any of the channels below, and we'll get back to you promptly.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4 group hover:bg-secondary/20 rounded-lg p-4 transition-all duration-300 hover:scale-[1.02]">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-primary/20 transition-colors duration-300">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Email Us</h4>
                  <p className="text-muted-foreground font-medium">support@uplora.io</p>
                  
                </div>
              </div>

              <div className="flex items-start space-x-4 group hover:bg-secondary/20 rounded-lg p-4 transition-all duration-300 hover:scale-[1.02]">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-primary/20 transition-colors duration-300">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Response Time</h4>
                  <p className="text-muted-foreground font-medium">Within 24 hours</p>
                  <p className="text-sm text-muted-foreground">Usually much faster during business hours</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(120deg); }
          66% { transform: translateY(5px) rotate(240deg); }
        }
      `}</style>
    </section>
  );
};

export default ContactSection;