"use client";

import AppShell from "@/components/layout/AppShell";
import { Check, Calendar, CreditCard, ExternalLink, Crown, Info } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

// Color palette from the provided image
const colors = {
  dark: '#222831',      // Primary dark
  darkGray: '#393E46',  // Secondary dark
  teal: '#00ADB5',      // Accent teal
  light: '#EEEEEE',     // Light gray
  background: '#FEFEFB', // Soft white background
  brandDark: '#213130'   // Dark text color
};

export default function SubscriptionPage() {
  const [activeTab, setActiveTab] = useState<"billing" | "plans">("billing");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Mock current plan data
  const currentPlan = {
    name: "Creator Plan",
    price: "$18.00",
    cycle: "month",
    status: "Trial",
    trialEnds: "August 26, 2025",
    nextBilling: "$18.00 after trial"
  };

  const handleSubscribe = (plan: string, cycle: string) => {
    console.log(`Subscribe to ${plan} ${cycle}`);
  };

  const openBillingPortal = () => {
    window.open("https://billing.stripe.com", "_blank");
  };

  return (
    <AppShell>
      <NextSeoNoSSR title="Subscription" description="Manage your Uplora subscription and billing." />
      
      <div className="subscription-container">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <div className="tab-border">
            <nav className="tab-nav">
              <button
                onClick={() => setActiveTab("billing")}
                className={`tab-button ${activeTab === "billing" ? "tab-active" : "tab-inactive"}`}
              >
                Billing
              </button>
              <button
                onClick={() => setActiveTab("plans")}
                className={`tab-button ${activeTab === "plans" ? "tab-active" : "tab-inactive"}`}
              >
                Plans
              </button>
            </nav>
          </div>
        </div>

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="tab-content"
          >
            {/* Current Plan Card */}
            <div className="current-plan-card">
              <div className="current-plan-header">
                <div className="current-plan-info">
                  <div className="current-plan-label">
                    <Calendar className="plan-icon" />
                    <span>Current Plan</span>
                  </div>
                  <h2 className="plan-title">{currentPlan.name}</h2>
                  <p className="plan-price">{currentPlan.price} / {currentPlan.cycle}</p>
                </div>
                <div className="plan-status">
                  <span className="status-badge">
                    {currentPlan.status}
                  </span>
                </div>
              </div>

              <div className="plan-details-grid">
                <div className="detail-item">
                  <div className="detail-label">
                    <Calendar className="detail-icon" />
                    <span>Trial ends</span>
                  </div>
                  <p className="detail-value">{currentPlan.trialEnds}</p>
                </div>
                <div className="detail-item">
                  <div className="detail-label">
                    <CreditCard className="detail-icon" />
                    <span>Amount</span>
                  </div>
                  <p className="detail-value">{currentPlan.nextBilling}</p>
                </div>
              </div>

              {/* Trial Notice */}
              <div className="trial-notice">
                <span className="trial-emoji">🎉</span>
                <p className="trial-text">
                  <strong>You're on a free trial!</strong> Your trial ends on {currentPlan.trialEnds}. After that, you'll be charged {currentPlan.nextBilling}.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  onClick={() => setActiveTab("plans")}
                  className="btn-primary"
                >
                  Change Plan
                </button>
                <button className="btn-secondary">
                  Pause Subscription
                </button>
                <button className="btn-danger">
                  Cancel Subscription
                </button>
              </div>
            </div>

            {/* Billing Portal */}
            <div className="billing-portal-card">
              <div className="billing-portal-content">
                <div className="billing-portal-info">
                  <h3 className="billing-portal-title">Stripe Billing Portal</h3>
                  <p className="billing-portal-description">
                    Access billing history, payment methods, and invoices
                  </p>
                </div>
                <button
                  onClick={openBillingPortal}
                  className="btn-outline"
                >
                  <ExternalLink className="btn-icon" />
                  Open Portal
                </button>
              </div>
            </div>
          </MotionDiv>
        )}

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="tab-content"
          >
            {/* Billing Cycle Toggle */}
            <div className="billing-toggle-container">
              <div className="billing-toggle">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`toggle-button ${billingCycle === "monthly" ? "toggle-active" : "toggle-inactive"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`toggle-button ${billingCycle === "yearly" ? "toggle-active" : "toggle-inactive"} relative`}
                >
                  Yearly
                  <span className="discount-badge">40% OFF</span>
                </button>
                <div className="free-trial-indicator">
                  <span className="free-trial-text">Free trial</span>
                  <div className="toggle-switch">
                    <div className="toggle-switch-active"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="pricing-grid">
              {/* Starter Plan */}
              <div className="pricing-card">
                <div className="pricing-header">
                  <h3 className="pricing-title">Starter</h3>
                  <p className="pricing-subtitle">Best for beginner creators</p>
                  <div className="pricing-amount">
                    <span className="price-number">
                      ${billingCycle === "monthly" ? "9" : "90"}
                    </span>
                    <span className="price-period">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                </div>

                <ul className="feature-list">
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>5 team members</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>10 video uploads per month</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Basic collaboration tools</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Email notifications</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>100MB file uploads</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Standard support</span>
                  </li>
                </ul>

                <button
                  onClick={() => handleSubscribe("starter", billingCycle)}
                  className="pricing-cta"
                >
                  Start 7 day free trial →
                </button>
                
                <p className="pricing-note">
                  <Check className="note-check" />
                  $0.00 due today, cancel anytime
                </p>
              </div>

              {/* Creator Plan - Current */}
              <div className="pricing-card pricing-card-current">
                <div className="current-plan-badges">
                  <span className="current-badge">YOUR CURRENT PLAN</span>
                  <span className="popular-badge">Most popular</span>
                </div>

                <div className="pricing-header">
                  <h3 className="pricing-title">Creator</h3>
                  <p className="pricing-subtitle">Best for growing creators</p>
                  <div className="pricing-amount">
                    <span className="price-number">
                      ${billingCycle === "monthly" ? "18" : "180"}
                    </span>
                    <span className="price-period">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                </div>

                <ul className="feature-list">
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>15 team members</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Unlimited video uploads</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Advanced collaboration</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Priority notifications</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>500MB file uploads</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Custom branding</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Priority support</span>
                  </li>
                </ul>

                <button
                  disabled
                  className="pricing-cta-current"
                >
                  Current Plan
                </button>
                
                <p className="pricing-note">
                  <Check className="note-check" />
                  You're on this plan
                </p>
              </div>

              {/* Pro Plan */}
              <div className="pricing-card">
                <div className="best-deal-badge">
                  <span>Best deal</span>
                </div>

                <div className="pricing-header">
                  <h3 className="pricing-title">Pro</h3>
                  <p className="pricing-subtitle">Best for scaling brands</p>
                  <div className="pricing-amount">
                    <span className="price-number">
                      ${billingCycle === "monthly" ? "49" : "490"}
                    </span>
                    <span className="price-period">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                </div>

                <ul className="feature-list">
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Unlimited team members</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Unlimited video uploads</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Advanced collaboration</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Real-time notifications</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>2GB file uploads</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>API access</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-check" />
                    <span>24/7 priority support</span>
                  </li>
                </ul>

                <button
                  onClick={() => handleSubscribe("pro", billingCycle)}
                  className="pricing-cta"
                >
                  Start 7 day free trial →
                </button>
                
                <p className="pricing-note">
                  <Check className="note-check" />
                  $0.00 due today, cancel anytime
                </p>
              </div>
            </div>

            {/* Enterprise Section */}
            <div className="enterprise-card">
              <div className="enterprise-content">
                <div className="enterprise-icon">
                  <Crown className="crown-icon" />
                </div>
                <h3 className="enterprise-title">Enterprise</h3>
                <p className="enterprise-description">
                  Custom solutions for large organizations with advanced needs
                </p>
                <div className="enterprise-actions">
                  <button className="btn-primary">
                    Contact Sales
                  </button>
                  <button className="btn-outline">
                    Schedule Demo
                  </button>
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@300;400;500;600;700&display=swap');

        .subscription-container {
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: ${colors.background};
          min-height: 100vh;
          padding: 2rem 1rem;
        }

        /* Tab Navigation */
        .tab-navigation {
          margin-bottom: 2rem;
        }

        .tab-border {
          border-bottom: 1px solid ${colors.light};
        }

        .tab-nav {
          display: flex;
          gap: 2rem;
        }

        .tab-button {
          padding: 1rem 0.25rem;
          border-bottom: 2px solid transparent;
          font-family: 'Google Sans', sans-serif;
          font-weight: 500;
          font-size: 0.875rem;
          background: none;
          border-top: none;
          border-left: none;
          border-right: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-active {
          border-bottom-color: ${colors.teal};
          color: ${colors.teal};
          font-weight: 600;
        }

        .tab-inactive {
          color: ${colors.darkGray};
        }

        .tab-inactive:hover {
          color: ${colors.brandDark};
          border-bottom-color: ${colors.light};
        }

        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Current Plan Card */
        .current-plan-card {
          background: white;
          border: 1px solid ${colors.light};
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(34, 40, 49, 0.1);
        }

        .current-plan-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .current-plan-info {
          flex: 1;
        }

        .current-plan-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
          color: ${colors.darkGray};
          font-weight: 400;
        }

        .plan-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: ${colors.darkGray};
        }

        .plan-title {
          font-size: 2rem;
          font-weight: 700;
          color: ${colors.brandDark};
          margin-bottom: 0.5rem;
          font-family: 'Google Sans', sans-serif;
        }

        .plan-price {
          font-size: 1rem;
          color: ${colors.darkGray};
          font-weight: 400;
        }

        .plan-status {
          display: flex;
          align-items: center;
        }

        .status-badge {
          background-color: ${colors.teal};
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: 'Google Sans', sans-serif;
        }

        .plan-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .plan-details-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: ${colors.darkGray};
          font-weight: 400;
        }

        .detail-icon {
          width: 1rem;
          height: 1rem;
          color: ${colors.darkGray};
        }

        .detail-value {
          font-weight: 600;
          color: ${colors.brandDark};
          font-family: 'Google Sans', sans-serif;
        }

        .trial-notice {
          background-color: #FFF8E1;
          border: 1px solid #FFE082;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .trial-emoji {
          font-size: 1.125rem;
        }

        .trial-text {
          font-size: 0.875rem;
          color: ${colors.brandDark};
          font-weight: 400;
          line-height: 1.5;
        }

        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        /* Billing Portal Card */
        .billing-portal-card {
          background: white;
          border: 1px solid ${colors.light};
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(34, 40, 49, 0.1);
        }

        .billing-portal-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .billing-portal-info {
          flex: 1;
        }

        .billing-portal-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: ${colors.brandDark};
          margin-bottom: 0.25rem;
          font-family: 'Google Sans', sans-serif;
        }

        .billing-portal-description {
          font-size: 0.875rem;
          color: ${colors.darkGray};
          font-weight: 400;
        }

        /* Billing Toggle */
        .billing-toggle-container {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .billing-toggle {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.25rem;
          background-color: ${colors.light};
          border-radius: 8px;
        }

        .toggle-button {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: 'Google Sans', sans-serif;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .toggle-active {
          background-color: ${colors.teal};
          color: white;
          box-shadow: 0 2px 4px rgba(0, 173, 181, 0.2);
        }

        .toggle-inactive {
          color: ${colors.darkGray};
        }

        .toggle-inactive:hover {
          color: ${colors.brandDark};
        }

        .discount-badge {
          position: absolute;
          top: -0.5rem;
          right: -0.5rem;
          background-color: #FF5722;
          color: white;
          font-size: 0.625rem;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-weight: 600;
        }

        .free-trial-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .free-trial-text {
          font-size: 0.875rem;
          color: ${colors.darkGray};
          font-weight: 400;
        }

        .toggle-switch {
          width: 2rem;
          height: 1rem;
          background-color: ${colors.teal};
          border-radius: 12px;
          position: relative;
        }

        .toggle-switch-active {
          width: 0.75rem;
          height: 0.75rem;
          background-color: white;
          border-radius: 50%;
          position: absolute;
          top: 0.125rem;
          right: 0.125rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        /* Pricing Grid */
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .pricing-card {
          background: white;
          border: 1px solid ${colors.light};
          border-radius: 12px;
          padding: 2rem;
          position: relative;
          box-shadow: 0 1px 3px rgba(34, 40, 49, 0.1);
          transition: all 0.2s ease;
        }

        .pricing-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(34, 40, 49, 0.15);
        }

        .pricing-card-current {
          border: 2px solid ${colors.teal};
          background: linear-gradient(135deg, rgba(0, 173, 181, 0.02), rgba(0, 173, 181, 0.05));
        }

        .current-plan-badges {
          position: absolute;
          top: -0.75rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
        }

        .current-badge {
          background-color: ${colors.teal};
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.625rem;
          font-weight: 600;
          font-family: 'Google Sans', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .popular-badge {
          background-color: ${colors.dark};
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.625rem;
          font-weight: 600;
          font-family: 'Google Sans', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .best-deal-badge {
          position: absolute;
          top: -0.75rem;
          left: 50%;
          transform: translateX(-50%);
        }

        .best-deal-badge span {
          background-color: ${colors.darkGray};
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.625rem;
          font-weight: 600;
          font-family: 'Google Sans', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pricing-header {
          margin-bottom: 2rem;
          margin-top: 1rem;
        }

        .pricing-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${colors.brandDark};
          margin-bottom: 0.5rem;
          font-family: 'Google Sans', sans-serif;
        }

        .pricing-subtitle {
          font-size: 0.875rem;
          color: ${colors.darkGray};
          margin-bottom: 1rem;
          font-weight: 400;
        }

        .pricing-amount {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .price-number {
          font-size: 3rem;
          font-weight: 700;
          color: ${colors.brandDark};
          font-family: 'Google Sans', sans-serif;
        }

        .price-period {
          font-size: 1rem;
          color: ${colors.darkGray};
          font-weight: 400;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: ${colors.brandDark};
          font-weight: 400;
        }

        .feature-check {
          width: 1rem;
          height: 1rem;
          color: ${colors.teal};
          margin-top: 0.125rem;
          flex-shrink: 0;
        }

        .pricing-cta {
          width: 100%;
          background-color: ${colors.teal};
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.875rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Google Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 0.75rem;
        }

        .pricing-cta:hover {
          background-color: #009AA1;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 173, 181, 0.3);
        }

        .pricing-cta-current {
          width: 100%;
          background-color: ${colors.darkGray};
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.875rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Google Sans', sans-serif;
          cursor: not-allowed;
          margin-bottom: 0.75rem;
          opacity: 0.7;
        }

        .pricing-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: ${colors.darkGray};
          font-weight: 400;
          justify-content: center;
        }

        .note-check {
          width: 0.875rem;
          height: 0.875rem;
          color: ${colors.teal};
        }

        /* Buttons */
        .btn-primary {
          background-color: ${colors.dark};
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Google Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background-color: #1A1F26;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 40, 49, 0.3);
        }

        .btn-secondary {
          background-color: ${colors.darkGray};
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Google Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background-color: #2F353D;
          transform: translateY(-1px);
        }

        .btn-danger {
          background-color: transparent;
          color: #D32F2F;
          border: 1px solid #FFCDD2;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Google Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-danger:hover {
          background-color: #FFEBEE;
          border-color: #EF5350;
        }

        .btn-outline {
          background-color: transparent;
          color: ${colors.brandDark};
          border: 1px solid ${colors.light};
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: 'Google Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-outline:hover {
          background-color: ${colors.light};
          border-color: ${colors.darkGray};
        }

        .btn-icon {
          width: 1rem;
          height: 1rem;
        }

        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        /* Enterprise Card */
        .enterprise-card {
          background: linear-gradient(135deg, rgba(57, 62, 70, 0.05), rgba(0, 173, 181, 0.05));
          border: 1px solid ${colors.teal};
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
        }

        .enterprise-content {
          max-width: 500px;
          margin: 0 auto;
        }

        .enterprise-icon {
          width: 4rem;
          height: 4rem;
          background: linear-gradient(135deg, ${colors.darkGray}, ${colors.dark});
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .crown-icon {
          width: 2rem;
          height: 2rem;
          color: white;
        }

        .enterprise-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${colors.brandDark};
          margin-bottom: 1rem;
          font-family: 'Google Sans', sans-serif;
        }

        .enterprise-description {
          font-size: 1rem;
          color: ${colors.darkGray};
          margin-bottom: 2rem;
          font-weight: 400;
          line-height: 1.5;
        }

        .enterprise-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: center;
        }

        @media (min-width: 640px) {
          .enterprise-actions {
            flex-direction: row;
            justify-content: center;
          }
        }
      `}</style>
    </AppShell>
  );
}