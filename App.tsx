import React, { useState, useEffect } from 'react';
import { Disc, Sliders, Sparkles, ListMusic, Music2, Loader2, CheckCircle2, User, LogIn, Settings, Zap, Waves } from 'lucide-react';
import { Song, FlowType, ImportedPlaylist, SpotifyConfig } from './types';
import { curatePlaylist } from './services/geminiService';
import { 
  getAuthUrl, 
  getTokenFromUrl, 
  fetchUserPlaylists, 
  fetchUserProfile, 
  fetchPlaylistDetails, 
  saveTrackToLibrary, 
  createPlaylistAndAddTracks 
} from './services/spotifyService';
import PlaylistView from './components/PlaylistView';
import EnergyChart from './components/EnergyChart';

export default function App() {
  // --- Auth State ---
  const [config, setConfig] = useState<SpotifyConfig>({
    clientId: localStorage.getItem('spotify_client_id') || '',
    redirectUri: window.location.origin + window.location.pathname
  });
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // --- App Flow State ---
  const [appState, setAppState] = useState<'AUTH' | 'FETCHING_DATA' | 'CONFIGURING' | 'CURATING' | 'RESULTS'>('AUTH');
  
  // --- Data State ---
  const [userPlaylists, setUserPlaylists] = useState<ImportedPlaylist[]>([]);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(new Set());
  const [curatedSongs, setCuratedSongs] = useState<Song[]>([]);
  
  // --- Config State ---
  const [targetVibe, setTargetVibe] = useState('Driving & Energetic');
  const [flowType, setFlowType] = useState<FlowType>(FlowType.RISING_ENERGY);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Initialization & Token Parsing
  useEffect(() => {
    const hash = getTokenFromUrl();
    if (hash.access_token) {
      setToken(hash.access_token);
      window.location.hash = ''; // Clear hash
      setAppState('FETCHING_DATA');
      loadUserData(hash.access_token);
    }
  }, []);

  const handleLogin = () => {
    if (!config.clientId) {
      setError("Please enter a valid Client ID");
      return;
    }
    localStorage.setItem('spotify_client_id', config.clientId);
    window.location.href = getAuthUrl(config.clientId, config.redirectUri);
  };

  const loadUserData = async (accessToken: string) => {
    try {
      setStatusMessage("Connecting to Spotify...");
      const profile = await fetchUserProfile(accessToken);
      setUserProfile(profile);
      
      setStatusMessage("Fetching your playlists...");
      const playlists = await fetchUserPlaylists(accessToken);
      setUserPlaylists(playlists);
      
      setAppState('CONFIGURING');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load Spotify data");
      setAppState('AUTH');
    }
  };

  // 2. Playlist Selection & Analysis (The "Heavy Lifting")
  const togglePlaylistSelection = (id: string) => {
    const newSet = new Set(selectedPlaylistIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPlaylistIds(newSet);
  };

  const handleCurate = async () => {
    if (selectedPlaylistIds.size === 0) {
      setError("Please select at least one playlist as a source.");
      return;
    }

    setAppState('CURATING');
    setError(null);
    setStatusMessage("Analyzing audio features (BPM, Energy) of your tracks...");

    try {
      // 1. Fetch all tracks and their audio features from selected playlists
      // We do this now to get real data for the AI
      const selectedPlaylists = userPlaylists.filter(p => selectedPlaylistIds.has(p.id));
      let allSourceSongs: Song[] = [];

      for (const playlist of selectedPlaylists) {
        setStatusMessage(`Analyzing ${playlist.name}...`);
        const tracks = await fetchPlaylistDetails(token!, playlist.id);
        allSourceSongs = [...allSourceSongs, ...tracks];
      }

      // Deduplicate by ID
      const uniqueSongs = Array.from(new Map(allSourceSongs.map(s => [s.id, s])).values());

      if (uniqueSongs.length < 10) {
        throw new Error("Not enough songs in selected playlists (need at least 10).");
      }

      setStatusMessage("AI is architecting your flow...");
      
      // 2. Send to Gemini
      const songs = await curatePlaylist(uniqueSongs, targetVibe, flowType, includeRecommendations);
      setCuratedSongs(songs);
      setAppState('RESULTS');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate playlist.");
      setAppState('CONFIGURING');
    }
  };

  // 3. Output Actions
  const handleSavePlaylist = async () => {
    if (!token || !userProfile) return;
    setIsSaving(true);
    try {
      const uris = curatedSongs
        .filter(s => s.uri && !s.isRecommendation) // Can only add known URIs directly
        .map(s => s.uri);
      
      const playlistName = `CurateMyVibe: ${targetVibe}`;
      const url = await createPlaylistAndAddTracks(token, userProfile.id, playlistName, uris);
      
      alert(`Playlist saved! Opening Spotify...`);
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      alert("Failed to save playlist.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTrack = async (trackId: string) => {
    if (!token) return;
    await saveTrackToLibrary(token, trackId);
  };

  const reset = () => {
    // If we have token, go to config, else auth
    if (token) {
      setAppState('CONFIGURING');
      setCuratedSongs([]);
      setError(null);
    } else {
      setAppState('AUTH');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200 pb-20 font-inter">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 group-hover:border-cyan-500/50 transition-colors">
              <Waves className="text-cyan-400" size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-tight">
              CurateMyVibe
            </h1>
          </div>
          {userProfile && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700 hover:border-slate-600 transition-colors">
              {userProfile.images?.[0]?.url ? (
                <img src={userProfile.images[0].url} className="w-6 h-6 rounded-full" alt="Avatar" />
              ) : (
                <User size={14} className="text-slate-400" />
              )}
              <span className="text-sm font-medium text-slate-300">{userProfile.display_name}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* PHASE 1: AUTHENTICATION */}
        {appState === 'AUTH' && (
          <div className="flex flex-col items-center justify-center mt-10 animate-fade-in">
            <div className="max-w-md w-full bg-slate-800/50 border border-slate-700 p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Unlock Your Flow</h2>
                <p className="text-slate-400">
                  Connect Spotify to analyze audio features and architect the perfect playlist flow using AI.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-4 bg-slate-900/80 rounded-xl text-xs text-slate-400 border border-slate-700/80">
                  <p className="font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Settings size={14} /> Configuration
                  </p>
                  <ol className="list-decimal pl-4 space-y-2">
                    <li>Open <a href="https://developer.spotify.com/dashboard" target="_blank" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">Spotify Developer Dashboard</a>.</li>
                    <li>Create a new App.</li>
                    <li>Add this EXACT Redirect URI:<br/>
                      <code className="block mt-1 bg-black/50 px-2 py-1.5 rounded text-cyan-300 font-mono break-all border border-cyan-900/50">
                        {config.redirectUri}
                      </code>
                    </li>
                    <li>Paste the <strong>Client ID</strong> below.</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Client ID</label>
                  <input
                    type="text"
                    value={config.clientId}
                    onChange={(e) => setConfig({...config, clientId: e.target.value})}
                    placeholder="Paste your Client ID here"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors text-white placeholder-slate-600"
                  />
                </div>
              </div>

              <button 
                onClick={handleLogin}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
              >
                <LogIn size={20} />
                Authenticate with Spotify
              </button>
              
              {error && (
                <p className="mt-4 text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/30">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* PHASE 2: LOADING DATA (Fetch or Analysis) */}
        {(appState === 'FETCHING_DATA' || appState === 'CURATING') && (
          <div className="flex flex-col items-center justify-center mt-32">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
              <Loader2 size={48} className="text-cyan-500 animate-spin mb-4 relative z-10" />
            </div>
            <h3 className="text-xl font-medium text-slate-300 mt-4">{statusMessage}</h3>
            <p className="text-slate-500 mt-2 text-sm max-w-md text-center">
              {appState === 'CURATING' ? 'Decoding audio features & architecting your flow...' : 'Syncing library...'}
            </p>
          </div>
        )}

        {/* PHASE 3: CONFIGURATION */}
        {appState === 'CONFIGURING' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in">
            
            {/* LEFT: Playlist Selection */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ListMusic size={20} className="text-cyan-500" /> 
                  Select Source Material
                </h2>
                <p className="text-xs text-slate-400">
                  Choose the DNA for your new mix.
                  <span className="ml-2 bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 border border-cyan-500/20">{selectedPlaylistIds.size} selected</span>
                </p>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {userPlaylists.map(playlist => {
                  const isSelected = selectedPlaylistIds.has(playlist.id);
                  return (
                    <div 
                      key={playlist.id}
                      onClick={() => togglePlaylistSelection(playlist.id)}
                      className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 group ${
                        isSelected 
                          ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                          : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4 overflow-hidden">
                          {playlist.imageUrl ? (
                            <img src={playlist.imageUrl} alt={playlist.name} className="w-14 h-14 rounded-lg object-cover bg-slate-800 shadow-md" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                              <Music2 size={24} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className={`font-medium truncate text-lg ${isSelected ? 'text-cyan-100' : 'text-slate-300 group-hover:text-white'}`}>
                              {playlist.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">{playlist.totalTracks} tracks</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={24} className="text-cyan-500 shrink-0 drop-shadow-lg" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Controls */}
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-slate-800/30 rounded-2xl border border-slate-800 p-8 backdrop-blur-sm">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Sliders size={20} className="text-purple-500" /> 
                  Configure Output
                </h2>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Target Vibe</label>
                    <input
                      type="text"
                      value={targetVibe}
                      onChange={(e) => setTargetVibe(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-white placeholder-slate-600"
                      placeholder="e.g. High Energy, Melancholic, Late Night Drive"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Energy Flow Architecture</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.values(FlowType).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFlowType(type)}
                          className={`text-xs py-4 px-2 rounded-xl border transition-all font-medium ${
                            flowType === type
                              ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-900/30'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-200 block">Collaborator Mode</span>
                      <span className="text-xs text-slate-500">Inject 5% AI-selected discoveries</span>
                    </div>
                    <button
                      onClick={() => setIncludeRecommendations(!includeRecommendations)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        includeRecommendations ? 'bg-purple-600' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                        includeRecommendations ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCurate}
                  className="w-full mt-8 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  Generate Masterpiece
                </button>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 5: RESULTS */}
        {appState === 'RESULTS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Sidebar Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-2xl p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-white mb-2">The Mix</h2>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs border border-cyan-500/20 font-medium">
                    {targetVibe}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20 font-medium">
                    {flowType}
                  </span>
                </div>

                <div className="space-y-4">
                  <EnergyChart songs={curatedSongs} />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                         const text = curatedSongs.map(s => `${s.title} - ${s.artist}`).join('\n');
                         navigator.clipboard.writeText(text);
                         alert("Copied to clipboard!");
                      }}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors border border-slate-600"
                    >
                      <ListMusic size={16} /> Copy Text
                    </button>
                    <button 
                      onClick={() => setAppState('CONFIGURING')}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                    >
                      <Sliders size={16} /> Edit Vibe
                    </button>
                  </div>
                  
                  <div className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-lg">
                    <p className="text-xs text-cyan-200/70 leading-relaxed">
                      <strong className="block mb-1 text-cyan-400">Analysis Complete:</strong>
                      Tracks are sorted by actual audio energy data extracted from the Spotify API.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main List */}
            <div className="lg:col-span-8">
              <div className="bg-slate-900/50 rounded-2xl p-1">
                <PlaylistView 
                  songs={curatedSongs} 
                  onSavePlaylist={handleSavePlaylist}
                  onSaveTrack={handleSaveTrack}
                  isSaving={isSaving}
                />
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}