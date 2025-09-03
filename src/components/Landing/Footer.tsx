"use client";

import { Youtube, Twitter, Linkedin, Instagram } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  return <footer className="bg-secondary/30 border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="text-2xl font-bold gradient-text mb-4">
              Uplora
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              <span className="text-base font-inter">
                Helping creators and teams streamline their content workflow from draft to publish.
              </span>
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-smooth" aria-label="YouTube">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground hover:text-gray-800 hover:bg-gray-100 transition-smooth" aria-label="X (Twitter)">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground hover:text-pink-500 hover:bg-pink-50 transition-smooth" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-smooth" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#features" 
                  onClick={(e) => handleSmoothScroll(e, 'features')}
                  className="text-muted-foreground hover:text-foreground transition-smooth"
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="#pricing" 
                  onClick={(e) => handleSmoothScroll(e, 'pricing')}
                  className="text-muted-foreground hover:text-foreground transition-smooth"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
                  About
                </a>
              </li>
              
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#contact" 
                  onClick={(e) => handleSmoothScroll(e, 'contact')}
                  className="text-muted-foreground hover:text-foreground transition-smooth"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a 
                  href="#faqs" 
                  onClick={(e) => handleSmoothScroll(e, 'faqs')}
                  className="text-muted-foreground hover:text-foreground transition-smooth"
                >
                  FAQ's
                </a>
              </li>
              <li>
                
              </li>
              <li>
                
              </li>
            </ul>
          </div>
        </div>

        <hr className="my-8 border-border" />
        
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2024 Uplora. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link href="/copyright" className="hover:text-foreground transition-smooth">
              Copyright
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-smooth">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-smooth">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;