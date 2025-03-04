import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from '@/server/auth';
import { redirect } from 'next/navigation';
import React from 'react'

function Page() {
  return (
    <div className='px-2 py-2'>
        <div className='font-semibold text-2xl'>Log in</div>
        <form className='space-y-2 max-w-96' action={async (formData) => {
            'use server';
            const res = await login(formData);
            console.log('login status: ' + res)
            redirect('/')
        }}>
            <Input placeholder='Username' name='username'/>
            <Input placeholder='Password' type='password' name='password'/>
            <Button type='submit'>Log in</Button>
        </form>
    </div>
  )
}

export default Page