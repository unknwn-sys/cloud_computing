'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const router=useRouter();
  const submit=async(e:React.FormEvent)=>{e.preventDefault();try{const d=await api('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});localStorage.setItem('token',d.access_token);router.push('/dashboard')}catch{toast.error('Invalid credentials')}};
  return <main className='min-h-screen flex items-center justify-center p-6'><motion.form initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} onSubmit={submit} className='glass rounded-2xl p-8 w-full max-w-md space-y-4'><h1 className='text-2xl font-semibold'>Secure Cloud Log Analyzer</h1><input type='email' autoComplete='email' placeholder='Email' className='w-full bg-slate-900 p-3 rounded' value={email} onChange={e=>setEmail(e.target.value)} /><input type='password' autoComplete='current-password' placeholder='Password' className='w-full bg-slate-900 p-3 rounded' value={password} onChange={e=>setPassword(e.target.value)} /><button className='w-full bg-cyan-500/80 hover:bg-cyan-400 text-black font-medium py-3 rounded'>Sign in</button></motion.form></main>
}
