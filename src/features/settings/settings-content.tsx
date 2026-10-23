import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteAccountCard } from "@/features/settings/delete-account-card";
import { SettingsForm } from "@/features/settings/settings-form";
import { listTimezones } from "@/lib/timezones";
import { requirePageUser } from "@/server/auth/require-page-user";
import { getProfile } from "@/server/users/profile";

export async function SettingsContent() {
  const user = await requirePageUser();
  const profile = await getProfile(user.id);

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile and practice</CardTitle>
          <CardDescription>Signed in as {profile.email}.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            name={profile.name}
            timezone={profile.timezone}
            dailyGoalMinutes={profile.dailyGoalMinutes}
            timezones={listTimezones()}
          />
        </CardContent>
      </Card>
      <DeleteAccountCard />
    </div>
  );
}
