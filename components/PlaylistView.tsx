import React, { useState } from 'react';
import { Song } from '../types';
import { Zap, Activity, Key, ExternalLink, Sparkles, PlusCircle, CheckCircle2, Heart, Save } from 'lucide-react';

interface PlaylistViewProps {
  songs: Song[];
  onSavePlaylist: () => void;
  onSaveTrack: (trackId: string) => Promise<void>;
  isSaving: boolean;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({ songs, onSavePlaylist, onSaveTrack, isSaving }) => {
  const [addedSongs, setAddedSongs] = useState<Set<string>>(new Set());

  if (songs.length === 0) return null;

  const openSpotify = (song: Song) => {
    if (song.externalUrl) {
      window.open(song.externalUrl, '_blank');
    } else {
      const query = encodeURIComponent(`${song.title} ${song.artist}`);
      window.open(`https://open.spotify.com/search/${query}`, '_blank');
    }
  };

  const handleAdd = async (song: Song) => {
    if (!song.id || song.isRecommendation) {
      // Recommendations might not have IDs if we didn't search for them yet
      openSpotify(song);
      return;
    }
    
    try {
      await onSaveTrack(song.id);
      setAddedSongs(prev => {
        const newSet = new Set(prev);
        newSet.add(song.id);
        return newSet;
      });
    } catch (e) {
      console.error("Failed to like song", e);
      alert("Failed to save song. Token might be expired.");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Action Bar */}
      <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm sticky top-20 z-20">
        <div className="text-sm text-slate-400">
          <span className="text-white font-bold">{songs.length}</span> tracks ready for export
        </div>
        <button
          onClick={onSavePlaylist}
          disabled={isSaving}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save size={18} /> Save Full Playlist to Spotify
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {songs.map((song, index) => {
          const isAdded = song.id && addedSongs.has(song.id);
          
          return (
            <div 
              key={`${song.title}-${index}`}
              className={`group flex flex-col md:flex-row items-start md:items-center gap-4 border rounded-lg p-4 transition-all duration-200 ${
                isAdded
                  ? 'bg-emerald-900/20 border-emerald-500/50'
                  : song.isRecommendation 
                    ? 'bg-emerald-900/10 border-emerald-500/30 hover:bg-emerald-900/20' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80'
              }`}
            >
              {/* Index Number */}
              <div className={`hidden md:flex w-8 h-8 items-center justify-center rounded-full font-mono text-sm shrink-0 ${
                song.isRecommendation ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {index + 1}
              </div>

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold truncate text-lg ${isAdded ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {song.title}
                  </h4>
                  {song.isRecommendation && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded ml-2 flex items-center gap-1">
                      <Sparkles size={10} /> New
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm font-medium truncate">{song.artist}</p>
                <p className="text-slate-500 text-xs mt-1 line-clamp-1 italic">"{song.reasoning}"</p>
              </div>

              {/* Metrics & Actions */}
              <div className="flex flex-col md:flex-row w-full md:w-auto items-end md:items-center gap-3 md:gap-6">
                
                <div className="flex items-center gap-4 text-xs md:text-sm font-mono text-slate-400">
                  <div className="flex items-center gap-1.5" title="BPM">
                    <Activity size={14} className="text-emerald-500" />
                    <span>{song.bpm}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Key">
                    <Key size={14} className="text-purple-400" />
                    <span>{song.key}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Energy">
                    <Zap size={14} className="text-yellow-400" />
                    <span>{song.energy}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleAdd(song)}
                    disabled={!song.id || song.isRecommendation}
                    className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
                      isAdded 
                        ? 'bg-emerald-500/20 text-emerald-500' 
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                    }`}
                    title={song.isRecommendation ? "Cannot auto-save recommendations yet" : isAdded ? "Saved to Liked Songs" : "Add to Liked Songs"}
                  >
                    {isAdded ? <CheckCircle2 size={18} /> : <Heart size={18} />}
                  </button>
                  
                  <button 
                    onClick={() => openSpotify(song)}
                    className="p-2 rounded-full hover:bg-slate-700/50 text-slate-500 hover:text-[#1DB954] transition-colors"
                    title="Open in Spotify"
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlaylistView;