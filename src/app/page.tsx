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
import { desc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

async function resetStreaksIfNeeded() {
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  const oneDayInSeconds = 86400; // 24 hours in seconds

  // Get all habit templates
  const habits = await db
    .select()
    .from(habitTemplates)
    .execute();

  for (const habit of habits) {
    // Get the last check-in for the current habit
    const lastCheckIn = await db
      .select()
      .from(checkIns)
      .where(sql`${checkIns.habit_id} = ${habit.id}`)
      .orderBy(desc(checkIns.createdAt))
      .limit(1)
      .execute();

    const lastCheckInTime = lastCheckIn.length > 0 ? lastCheckIn[0]?.createdAt.getMilliseconds() : 0;

    // Check if more than a day has passed since the last check-in
    if (lastCheckInTime && (currentTime - lastCheckInTime) > oneDayInSeconds) {
      // Reset the streak to zero
      await db
        .update(habitTemplates)
        .set({ streak: 0 })
        .where(sql`${habitTemplates.id} = ${habit.id}`)
        .execute();
    }
  }
}

async function getHabits(uid: number) {
  "use server";

  await resetStreaksIfNeeded();
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
