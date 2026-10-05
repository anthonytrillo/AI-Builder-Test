import { GymDashboard } from "@/components/gym-dashboard";
import { readAuthSession } from "@/lib/auth";

export default async function Home() {
  const session = await readAuthSession();

  return <GymDashboard initialSession={session} />;
}
