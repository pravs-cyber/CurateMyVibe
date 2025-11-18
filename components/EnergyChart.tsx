import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Song } from '../types';

interface EnergyChartProps {
  songs: Song[];
}

const EnergyChart: React.FC<EnergyChartProps> = ({ songs }) => {
  const data = songs.map((song, index) => ({
    name: index + 1,
    bpm: song.bpm,
    energy: song.energy,
    title: song.title
  }));

  return (
    <div className="w-full h-64 bg-slate-800/50 rounded-xl p-4 border border-slate-700 backdrop-blur-sm">
      <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">BPM & Energy Flow</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
          <YAxis yAxisId="left" stroke="#64748b" tick={{fontSize: 12}} domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ color: '#10b981' }}
          />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="bpm" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorBpm)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnergyChart;