"use client";

import React, { useState } from "react";
import { ChevronRight, HelpCircle, Clock, Users, Shield, Zap, Globe, Star } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const faqs = [
  {
    question: "How does Uplora's team collaboration work?",
    answer: "Uplora streamlines team collaboration with a 4-step workflow: Editors create and upload content with captions and scheduling details, content enters a review queue, admins approve and confirm publish times, then content automatically publishes across selected platforms. This ensures quality control while maintaining team efficiency.",
    icon: Users
  },
  {
    question: "Which social media platforms are supported?",
    answer: "Uplora supports all major platforms including YouTube, TikTok, Instagram, LinkedIn, X (Twitter), and Facebook. You can publish to multiple platforms simultaneously from a single upload, ensuring consistent content distribution across your entire social media presence.",
    icon: Globe
  },
  {
    question: "Can multiple team members work simultaneously?",
    answer: "Absolutely! Uplora is built for teams. Multiple editors can create and upload content at the same time, while admins review and approve posts in real-time. Our system handles permissions, notifications, and workflow management to keep everyone synchronized.",
    icon: Users
  },
  {
    question: "How secure is our content and data?",
    answer: "We take security seriously with enterprise-grade encryption, secure data storage, and regular security audits. Your content is protected during upload, storage, and publishing. We never share your data with third parties and comply with major data protection regulations including GDPR.",
    icon: Shield
  },
  {
    question: "Do you offer a free trial?",
    answer: "Yes! We offer a comprehensive free trial so you can experience our collaborative workflow firsthand. Test our 4-step process, try multi-platform publishing, and see how our approval system works for your team before committing to a paid plan.",
    icon: Star
  },
  {
    question: "How does scheduling work across time zones?",
    answer: "Uplora supports scheduling content for multiple time zones. You can set specific publish times for different regions, ensuring your content reaches audiences at optimal times regardless of their location. Perfect for global teams and international audiences.",
    icon: Clock
  },
  {
    question: "What happens if content fails to publish?",
    answer: "Our system automatically retries failed posts and sends immediate notifications if issues persist. We provide detailed error logs and alternative publishing options. Our support team monitors system health 24/7 to ensure maximum uptime and reliability.",
    icon: Zap
  },
  {
    question: "What kind of support do you provide?",
    answer: "We provide 24/7 customer support through multiple channels including live chat, email, and our comprehensive help center. Our team is always ready to help with setup, troubleshooting, or any questions about maximizing your workflow efficiency.",
    icon: HelpCircle
  }
];

const FAQSection = () => {
  const [selectedFAQ, setSelectedFAQ] = useState<number>(0);
  const [expandedMobileFAQ, setExpandedMobileFAQ] = useState<number>(-1);
  const { isVisible, elementRef } = useScrollAnimation();

  return (
    <section id="faqs" className="py-20 bg-gradient-to-b from-background via-secondary/5 to-background">
      <div ref={elementRef} className="container mx-auto px-4 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about Uplora's collaborative social media scheduling platform
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Mobile Layout - Accordion Style */}
          <div className={`lg:hidden space-y-4 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {faqs.map((faq, index) => {
              const IconComponent = faq.icon;
              const isExpanded = expandedMobileFAQ === index;
              return (
                <div key={index} className="border border-border/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedMobileFAQ(isExpanded ? -1 : index)}
                    className={`w-full p-4 text-left transition-all duration-300 ${
                      isExpanded
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-card/50 hover:bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${
                        isExpanded ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground text-left">
                          {faq.question}
                        </h4>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${
                        isExpanded ? 'rotate-90 text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                  </button>
                  
                  {/* Mobile Answer */}
                  <div className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="p-4 pt-0 border-t border-border/20">
                      <div className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Layout - Two Column */}
          <div className={`hidden lg:grid lg:grid-cols-2 gap-8 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {/* Questions List */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold mb-6 text-foreground">Common Questions</h3>
              {faqs.map((faq, index) => {
                const IconComponent = faq.icon;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedFAQ(index)}
                    className={`w-full p-4 text-left rounded-xl border transition-all duration-300 ${
                      selectedFAQ === index
                        ? 'bg-primary/10 border-primary/30 shadow-soft'
                        : 'bg-card/50 border-border/50 hover:bg-card hover:border-border hover:shadow-soft'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${
                        selectedFAQ === index ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground text-left">
                          {faq.question}
                        </h4>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${
                        selectedFAQ === index ? 'rotate-90 text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Answer Panel */}
            <div className="lg:sticky lg:top-8">
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-soft">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/20 rounded-xl">
                    {React.createElement(faqs[selectedFAQ].icon, { 
                      className: "h-6 w-6 text-primary" 
                    })}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {faqs[selectedFAQ].question}
                  </h3>
                </div>
                <div className="text-muted-foreground leading-relaxed text-lg">
                  {faqs[selectedFAQ].answer}
                </div>
                
                {/* CTA */}
                <div className="mt-8 pt-6 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-4">
                    Still have questions? Our support team is here to help.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a 
                      href="#contact"
                      className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors duration-200"
                    >
                      Contact Support
                    </a>
                    <a 
                      href="#"
                      className="inline-flex items-center justify-center px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-secondary/20 transition-colors duration-200"
                    >
                      Start Free Trial
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;