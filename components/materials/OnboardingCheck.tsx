import { getMaterialsCount } from "@/lib/actions/materials";
import OnboardingModal from "./OnboardingModal";

export default async function OnboardingCheck() {
  const { count } = await getMaterialsCount();
  return <OnboardingModal showOnboarding={count === 0} />;
}
