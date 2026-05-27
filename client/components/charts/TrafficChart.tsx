'use client';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
export default function TrafficChart({data}:{data:{hour:string,count:number}[]}){return <div className='h-64'><ResponsiveContainer><AreaChart data={data}><XAxis dataKey='hour' stroke='#94a3b8'/><Tooltip/><Area dataKey='count' stroke='#22d3ee' fill='#22d3ee33'/></AreaChart></ResponsiveContainer></div>}
