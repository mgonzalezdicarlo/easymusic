import { OnboardingDialog } from "@/features/settings/onboarding-dialog";
import { listTimezones } from "@/lib/timezones";
import { requirePageUser } from "@/server/auth/require-page-user";
import { getProfile } from "@/server/users/profile";

/** Shows the first-run prompt until the signed-in user has completed it. */
export async function OnboardingGate() {
  const user = await requirePageUser();
  const profile = await getProfile(user.id);

  if (profile.onboarded) return null;

  return (
    <OnboardingDialog
      timezone={profile.timezone}
      dailyGoalMinutes={profile.dailyGoalMinutes}
      timezones={listTimezones()}
    />
  );
}
