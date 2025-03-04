import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { register } from '@/server/auth';
import { redirect } from 'next/navigation';
import React from 'react'

function Page() {
  return (
    <div className='px-2 py-2'>
        <div className='font-semibold text-2xl'>Register</div>
        <form className='space-y-2 max-w-96' action={async (formData) => {
            'use server';
            const res = await register(formData);
            console.log(res)
            //redirect('/')
        }}>
            <Input placeholder='Username' name='username'/>
            <Input placeholder='Password' type='password' name='password'/>
            <Button type='submit'>Register Account</Button>
        </form>
    </div>
  )
}

export default Page