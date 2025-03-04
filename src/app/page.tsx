import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/server/auth";
import { db } from "@/server/db";
import { checkIns, habitTemplates } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

async function resetStreaksForInactiveHabits(): Promise<void> {
  try {
    const yesterdayStart = getYesterdayTimestamp().start;
    const yesterdayEnd = getYesterdayTimestamp().end;

    // Find habit templates that *did not* have a check-in yesterday
    const inactiveHabitTemplates = await db.run(sql`
  SELECT ${habitTemplates.id}
  FROM ${habitTemplates}
  WHERE NOT EXISTS (
  SELECT 1
  FROM ${checkIns}
  WHERE ${checkIns.habit_id} = ${habitTemplates.id}
  AND ${checkIns.createdAt} >= ${yesterdayStart}
  AND ${checkIns.createdAt} <= ${yesterdayEnd}
  );
  `);

    // Extract the habit template IDs from the result
    const inactiveHabitTemplateIds = (inactiveHabitTemplates as any).rows.map(
      (row: any) => row.habit_templateid,
    );

    // Reset the streak for those habit templates
    if (inactiveHabitTemplateIds.length > 0) {
      await db
        .update(habitTemplates)
        .set({ streak: 0 })
        .where(
          sql`${habitTemplates.id} IN (${inactiveHabitTemplateIds.join(",")})`,
        );
      console.log(
        `Reset streak for ${inactiveHabitTemplateIds.length} inactive habits.`,
      );
    } else {
      console.log("No inactive habits found.");
    }
  } catch (error) {
    console.error("Error resetting streaks:", error);
  }
}

// Utility function to get yesterday's timestamp range
function getYesterdayTimestamp(): { start: number; end: number } {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const start = Math.floor(yesterday.getTime() / 1000); // Unix timestamp in seconds

  const endOfDay = new Date(yesterday);
  endOfDay.setHours(23, 59, 59, 999);
  const end = Math.floor(endOfDay.getTime() / 1000); // Unix timestamp in seconds
  return { start, end };
}

async function getHabits(uid: number) {
  "use server";

  await resetStreaksForInactiveHabits();
  const res = await db
    .select()
    .from(habitTemplates)
    .where(eq(habitTemplates.user, uid));
  return res;
}

interface HabitCardProps {
  id: number;
  habitName: string;
  streak: number;
}
function HabitCard(props: HabitCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.habitName}</CardTitle>
        <Separator />
      </CardHeader>
      <CardContent className="flex flex-col space-y-2">
        <div className="flex flex-row items-center space-x-2">
          <div className="text-xl font-medium">Current Streak:</div>
          <div className="text-lg">{props.streak}</div>
        </div>
        <div className="flex flex-row items-center space-x-2">
          <div className="">Were you successful?</div>
          <form
            action={async () => {
              "use server";
              try {
                // 1. Create the check-in
                await db.insert(checkIns).values({ habit_id: props.id });
            
                // 2. Increment the streak for the habit template
                await db
                  .update(habitTemplates)
                  .set({ streak: sql`${habitTemplates.streak} + ${1}` })
                  .where(eq(habitTemplates.id, props.id));
            
                console.log(`Check-in created and streak incremented for habit ${props.id}`);
              } catch (error) {
                console.error("Error creating check-in and updating streak:", error);
                // Handle the error appropriately (e.g., display an error message to the user)
              }
              redirect('/')
            }}
          >
            <Button type="submit">Yes</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function HomePage() {
  const session = await getSession();
  console.log(session);

  if (!session) {
    redirect("/login");
  }

  const habits = await getHabits(session.uid);
  console.log(habits);

  return (
    <div className="flex flex-col items-center space-y-2 px-2 py-2">
      <div className="text-3xl font-semibold">Hi, {session.user}</div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={"outline"} className="w-32">
            Create Habit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Habit</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-2"
            action={async (formData) => {
              "use server";
              let name;
              if (formData.get("habitName"))
                name = (
                  formData.get("habitName") as FormDataEntryValue
                ).toString();
              else name = "";
              await db.insert(habitTemplates).values({
                habit_name: name,
                user: session.uid,
              });
              redirect("/");
            }}
          >
            <Input placeholder="Habit Name" name="habitName" />
            <Button type="submit">Submit</Button>
          </form>
        </DialogContent>
      </Dialog>
      {habits.map((habit, idx) => {
        return (
          <HabitCard
            key={idx}
            habitName={habit.habit_name}
            id={habit.id}
            streak={habit.streak}
          />
        );
      })}
    </div>
  );
}
