import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { logout } from "@/server/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from 'react'

function Navbar() {
  return (
    <div>
    <div className="flex flex-row space-x-2 pt-2 pb-2 px-4">
    <Link href='/'>
    <Button variant={'ghost'} className="font-semibold text-2xl">streaks</Button>
    </Link>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={'outline'}>Account</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link href={'/login'}>Login</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={'/register'}>Register</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <form action={async () => {
        'use server';
        await logout();
        redirect('/')
    }}>
        <Button variant={'outline'} type="submit">Logout</Button>
    </form>
  </div>
  <Separator />
  </div>
  )
}

export default Navbar