import React from 'react';
import { Sparkles, Waves, Zap, Brain, ArrowRight, Music } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
      
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto px-6 py-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-8 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <Sparkles size={14} />
          AI-Powered Audio Architecture
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight leading-tight">
          Curate your vibe with <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
            Mathematical Precision
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Stop shuffling. Start flowing. We analyze the BPM, Energy, and Key of your library to architect playlists that feel like a professional DJ mix.
        </p>
        
        <button 
          onClick={onGetStarted}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-5 bg-white text-black rounded-2xl font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
        >
          Connect Spotify
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6 w-full mt-8">
        
        <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-3xl hover:bg-slate-800/50 transition-colors backdrop-blur-sm">
          <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-6">
            <Brain size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Smart Curation</h3>
          <p className="text-slate-400 leading-relaxed">
            Gemini AI analyzes your selected playlists to understand your unique taste profile, then acts as a collaborative curator.
          </p>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-3xl hover:bg-slate-800/50 transition-colors backdrop-blur-sm">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mb-6">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Audio Analysis</h3>
          <p className="text-slate-400 leading-relaxed">
            We pull real audio features (BPM, Energy, Key) directly from Spotify's database to ensure perfect transitions.
          </p>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-3xl hover:bg-slate-800/50 transition-colors backdrop-blur-sm">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-6">
            <Waves size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Flow Architecture</h3>
          <p className="text-slate-400 leading-relaxed">
            Structure your mix with purpose. Choose from Rising Energy, Chill Down, or Peak & Valley flow patterns.
          </p>
        </div>

      </div>
      
      {/* Footerish Aesthetic */}
      <div className="mt-20 mb-10 flex items-center gap-2 text-slate-600 text-sm font-mono uppercase tracking-widest">
        <Music size={14} />
        Sonic Intelligence Engine v1.0
      </div>
    </div>
  );
};

export default LandingPage;
