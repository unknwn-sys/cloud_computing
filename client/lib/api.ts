const base = process.env.NEXT_PUBLIC_API_BASE_URL;
export const api = async (path:string, init?:RequestInit) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${base}${path}`, { ...init, headers: { ...(init?.headers||{}), ...(token?{Authorization:`Bearer ${token}`}:{}) } });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
};
