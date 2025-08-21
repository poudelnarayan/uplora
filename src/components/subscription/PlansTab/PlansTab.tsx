import { motion } from "framer-motion";
import BillingCycleToggle from "./BillingCycleToggle";
import PricingGrid from "./PricingGrid";
import EnterpriseCard from "./EnterpriseCard";
import { subscriptionConfig } from "@/config/subscription";
import styles from "./PlansTab.module.css";

const MotionDiv = motion.div as any;

interface PlansTabProps {
  billingCycle: "monthly" | "yearly";
  onBillingCycleChange: (cycle: "monthly" | "yearly") => void;
  currentPlanId: string;
  onSubscribe: (planId: string, cycle: "monthly" | "yearly") => void;
  trialDaysRemaining: number;
  isTrialActive: boolean;
}

export default function PlansTab({
  billingCycle,
  onBillingCycleChange,
  currentPlanId,
  onSubscribe,
  trialDaysRemaining,
  isTrialActive
}: PlansTabProps) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.container}
    >
      <BillingCycleToggle
        billingCycle={billingCycle}
        onBillingCycleChange={onBillingCycleChange}
        yearlyDiscount={subscriptionConfig.yearlyDiscount}
        isTrialActive={isTrialActive}
      />
      
      <PricingGrid
        pricingTiers={subscriptionConfig.pricingTiers}
        billingCycle={billingCycle}
        currentPlanId={currentPlanId}
        onSubscribe={onSubscribe}
        trialDays={subscriptionConfig.trialConfig.durationDays}
        isTrialActive={isTrialActive}
      />
      
      <EnterpriseCard />
    </MotionDiv>
  );
}