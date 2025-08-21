import { motion } from "framer-motion";
import CurrentPlanCard from "./CurrentPlanCard";
import BillingPortalCard from "./BillingPortalCard";
import { TrialInfo } from "@/types/subscription";
import styles from "./BillingTab.module.css";

const MotionDiv = motion.div as any;

interface BillingTabProps {
  currentPlan: {
    name: string;
    price: string;
    cycle: string;
    status: string;
    trialEnds: string;
    nextBilling: string;
    daysRemaining: number;
  };
  trialInfo: TrialInfo | null;
  onChangePlan: () => void;
  onPauseSubscription: () => void;
  onCancelSubscription: () => void;
  onOpenBillingPortal: () => void;
}

export default function BillingTab({
  currentPlan,
  trialInfo,
  onChangePlan,
  onPauseSubscription,
  onCancelSubscription,
  onOpenBillingPortal
}: BillingTabProps) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.container}
    >
      <CurrentPlanCard
        plan={currentPlan}
        trialInfo={trialInfo}
        onChangePlan={onChangePlan}
        onPauseSubscription={onPauseSubscription}
        onCancelSubscription={onCancelSubscription}
      />
      
      <BillingPortalCard onOpenBillingPortal={onOpenBillingPortal} />
    </MotionDiv>
  );
}