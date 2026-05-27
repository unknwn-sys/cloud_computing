'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, getToken, setToken } from '@/lib/api';

type TokenResponse = {
  access_token: string;
  token_type: string;
};

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await api<TokenResponse>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      setToken(response.access_token, remember);
      toast.success('Session secured');
      router.replace('/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className='relative min-h-screen overflow-hidden bg-[#050812] px-6 py-10 text-slate-100'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,.16),transparent_28%)]' />
      <div className='absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:42px_42px]' />

      <section className='relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center'>
        <div className='grid w-full items-center gap-10 lg:grid-cols-[1.1fr_.9fr]'>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='hidden lg:block'
          >
            <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100'>
              <ShieldCheck size={16} />
              Enterprise cloud log intelligence
            </div>
            <h1 className='max-w-2xl text-5xl font-semibold leading-tight tracking-normal text-white'>
              Secure access to your SIEM analytics workspace.
            </h1>
            <p className='mt-5 max-w-xl text-base leading-7 text-slate-300'>
              Analyze high-volume HTTP logs, identify suspicious traffic, and monitor operational risk from a cloud-ready command center.
            </p>
            <div className='mt-8 grid max-w-xl grid-cols-3 gap-3'>
              {['Threat signals', 'Traffic trends', 'Audit-ready'].map((item) => (
                <div key={item} className='rounded-lg border border-white/10 bg-white/[.04] p-4 text-sm text-slate-200 shadow-2xl shadow-cyan-950/20'>
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45 }}
            onSubmit={submit}
            className='glass mx-auto w-full max-w-md rounded-2xl p-7 shadow-2xl shadow-cyan-950/30'
          >
            <div className='mb-7 flex items-center gap-3'>
              <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950'>
                <Lock size={21} />
              </div>
              <div>
                <h2 className='text-2xl font-semibold text-white'>Sign in</h2>
                <p className='text-sm text-slate-400'>Use your analyst account.</p>
              </div>
            </div>

            <label className='mb-2 block text-sm text-slate-300'>Email</label>
            <div className='mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 focus-within:border-cyan-300/70'>
              <Mail size={18} className='text-slate-500' />
              <input
                type='email'
                autoComplete='email'
                placeholder='name@company.com'
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className='w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600'
              />
            </div>

            <label className='mb-2 block text-sm text-slate-300'>Password</label>
            <div className='mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 focus-within:border-cyan-300/70'>
              <Lock size={18} className='text-slate-500' />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                placeholder='Enter password'
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className='w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600'
              />
              <button
                type='button'
                onClick={() => setShowPassword((value) => !value)}
                className='rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className='mb-6 flex items-center justify-between text-sm'>
              <label className='flex items-center gap-2 text-slate-300'>
                <input
                  type='checkbox'
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className='h-4 w-4 rounded border-white/20 bg-slate-950 accent-cyan-400'
                />
                Remember me
              </label>
              <span className='text-slate-500'>Protected session</span>
            </div>

            <button
              disabled={isLoading}
              className='flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70'
            >
              {isLoading && <Loader2 size={18} className='animate-spin' />}
              {isLoading ? 'Authenticating' : 'Access dashboard'}
            </button>
          </motion.form>
        </div>
      </section>
    </main>
  );
}
