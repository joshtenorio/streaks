import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <main className="">
      <div className="flex flex-row space-x-2 pt-4 pb-2 px-4">
      <Button variant={'outline'}>Log in</Button>
      <Button>Register</Button>
      </div>
      <Separator />
    </main>
  );
}
