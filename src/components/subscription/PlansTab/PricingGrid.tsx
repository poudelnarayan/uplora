import { Check } from "lucide-react";
import { PricingTier, formatPrice } from "@/config/subscription";
import styles from "./PricingGrid.module.css";

interface PricingGridProps {
  pricingTiers: PricingTier[];
  billingCycle: "monthly" | "yearly";
  currentPlanId: string;
  onSubscribe: (planId: string, cycle: "monthly" | "yearly") => void;
  trialDays: number;
  isTrialActive: boolean;
}

export default function PricingGrid({
  pricingTiers,
  billingCycle,
  currentPlanId,
  onSubscribe,
  trialDays,
  isTrialActive
}: PricingGridProps) {
  return (
    <div className={styles.grid}>
      {pricingTiers.map((tier) => {
        const isCurrentPlan = currentPlanId === tier.id;
        const price = billingCycle === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
        
        return (
          <div
            key={tier.id}
            className={`${styles.card} ${isCurrentPlan ? styles.cardCurrent : ""}`}
          >
            {/* Badges */}
            {isCurrentPlan && (
              <div className={styles.currentPlanBadges}>
                <span className={styles.currentBadge}>YOUR CURRENT PLAN</span>
                {tier.popular && (
                  <span className={styles.popularBadge}>Most popular</span>
                )}
              </div>
            )}
            
            {!isCurrentPlan && tier.popular && (
              <div className={styles.bestDealBadge}>
                <span>Most popular</span>
              </div>
            )}

            {/* Header */}
            <div className={styles.header}>
              <h3 className={styles.title}>{tier.name}</h3>
              <p className={styles.subtitle}>{tier.description}</p>
              <div className={styles.priceContainer}>
                <span className={styles.priceNumber}>
                  {formatPrice(price)}
                </span>
                <span className={styles.pricePeriod}>
                  /{billingCycle === "monthly" ? "month" : "year"}
                </span>
              </div>
            </div>

            {/* Features */}
            <ul className={styles.featureList}>
              {tier.features.map((feature, index) => (
                <li key={index} className={styles.featureItem}>
                  <Check className={styles.featureCheck} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            {isCurrentPlan ? (
              <button disabled className={styles.ctaCurrent}>
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => onSubscribe(tier.id, billingCycle)}
                className={styles.cta}
              >
                {isTrialActive 
                  ? `Switch to ${tier.name} →` 
                  : `Start ${trialDays} day free trial →`
                }
              </button>
            )}

            {/* Note */}
            <p className={styles.note}>
              <Check className={styles.noteCheck} />
              {isCurrentPlan 
                ? "You're on this plan" 
                : isTrialActive 
                  ? "Switch plans anytime during trial"
                  : "$0.00 due today, cancel anytime"
              }
            </p>
          </div>
        );
      })}
    </div>
  );
}