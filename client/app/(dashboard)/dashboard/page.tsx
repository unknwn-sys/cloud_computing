'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import TrafficChart from '@/components/charts/TrafficChart';
import { toast } from 'sonner';

type Upload = {
  id: number;
  filename: string;
  created_at: string;
  summary: {
    total_requests: number;
    http_404: number;
    http_500: number;
    hourly_traffic: Record<string, number>;
  };
};

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<{
    uploads: Upload[];
    audit: any[];
  }>({
    uploads: [],
    audit: [],
  });

  const [file, setFile] = useState<File | null>(null);
  const [isReady, setIsReady] = useState(false);

  const load = () =>
    api('/analytics/dashboard')
      .then((dashboard) => {
        setData(dashboard);
        setIsReady(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        toast.error('Please login again');
        router.replace('/login');
      });

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.replace('/login');
      return;
    }

    load();
  }, [router]);

  const upload = async () => {
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    try {
      await api('/logs/upload', {
        method: 'POST',
        body: form,
      });

      toast.success('Processed with MapReduce');
      load();
    } catch {
      localStorage.removeItem('token');
      toast.error('Please login again');
      router.replace('/login');
    }
  };

  const latest = data.uploads[0]?.summary;

  const chartData = latest
    ? Object.entries(latest.hourly_traffic).map(([hour, count]) => ({
        hour,
        count,
      }))
    : [];

  if (!isReady) {
    return null;
  }

  return (
    <main className='p-6 md:p-10 space-y-6'>
      <h1 className='text-3xl font-semibold'>
        Security Analytics Dashboard
      </h1>

      <section className='glass rounded-2xl p-5'>
        <input
          type='file'
          accept='.log'
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={upload}
          className='ml-4 bg-cyan-400 text-black px-4 py-2 rounded'
        >
          Upload & Analyze
        </button>
      </section>

      <section className='grid md:grid-cols-3 gap-4'>
        {['total_requests', 'http_404', 'http_500'].map((k) => (
          <div key={k} className='glass rounded-xl p-4'>
            <p className='text-slate-400'>{k}</p>

            <p className='text-3xl font-bold'>
              {Number(
                latest?.[
                  k as keyof Pick<
                    typeof latest,
                    'total_requests' | 'http_404' | 'http_500'
                  >
                ] ?? 0
              )}
            </p>
          </div>
        ))}
      </section>

      <section className='glass rounded-2xl p-5'>
        <TrafficChart data={chartData} />
      </section>
    </main>
  );
}
