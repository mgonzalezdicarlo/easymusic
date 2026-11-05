import { PracticeDialogs } from "@/features/practice/practice-dialogs";
import { requirePageUser } from "@/server/auth/require-page-user";
import { getLoggableScales } from "@/server/scales/loggable";
import { getProfile } from "@/server/users/profile";

/** Mounts the practice dialogs with the signed-in user's timezone ("today" follows it). */
export async function PracticeDialogsGate() {
  const user = await requirePageUser();
  const [profile, scales] = await Promise.all([
    getProfile(user.id),
    getLoggableScales(user.id),
  ]);

  return <PracticeDialogs timezone={profile.timezone} scales={scales} />;
}
