import { PracticeDialogs } from "@/features/practice/practice-dialogs";
import { requirePageUser } from "@/server/auth/require-page-user";
import { getProfile } from "@/server/users/profile";

/** Mounts the practice dialogs with the signed-in user's timezone ("today" follows it). */
export async function PracticeDialogsGate() {
  const user = await requirePageUser();
  const profile = await getProfile(user.id);

  return <PracticeDialogs timezone={profile.timezone} />;
}
