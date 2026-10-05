import { HomeScreen } from "@/components/home-screen";
import { readAuthSession } from "@/lib/auth";
import { loadWorkoutHome } from "@/lib/workouts";

export default async function Home() {
  const session = await readAuthSession();
  const workoutHome = session ? await loadWorkoutHome(session.userId) : null;

  return <HomeScreen initialSession={session} workoutHome={workoutHome} />;
}
