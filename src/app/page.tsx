import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { toast } from "sonner";

export default async function HomePage() {
  const session = await getSession();
  console.log(session)

  if(!session) {
    redirect('/login');
  }
  return (
    <div className="py-2 px-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={'outline'}>Create Habit</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Habit</DialogTitle>
          </DialogHeader>
          <form className="space-y-2">
            <Input placeholder="Habit Name"/>
            <Button type="submit">Submit</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
