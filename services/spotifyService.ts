import { ImportedPlaylist, Song } from "../types";

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-modify'
];

export const getAuthUrl = (clientId: string, redirectUri: string) => {
  // specific manual encoding to ensure Spotify compatibility
  const scopeString = SCOPES.join('%20'); 
  const cleanRedirect = encodeURIComponent(redirectUri);
  
  // strictly formatted URL construction
  return `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${cleanRedirect}&scope=${scopeString}&show_dialog=true`;
};

export const getTokenFromUrl = () => {
  return window.location.hash
    .substring(1)
    .split('&')
    .reduce((initial, item) => {
      let parts = item.split('=');
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {} as any);
};

// Helper for API calls
const fetchSpotify = async (endpoint: string, token: string, options: RequestInit = {}) => {
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Spotify API Error');
  }
  return res.json();
};

// --- User Profile ---

export const fetchUserProfile = async (token: string) => {
  return fetchSpotify('/me', token);
};

// --- Playlists & Tracks ---

export const fetchUserPlaylists = async (token: string): Promise<ImportedPlaylist[]> => {
  const data = await fetchSpotify('/me/playlists?limit=50', token);
  
  // We return a simplified object first, tracks are fetched on demand or in batch later
  return data.items.map((p: any) => ({
    id: p.id,
    name: p.name,
    songs: [], // Populated later
    imageUrl: p.images?.[0]?.url,
    totalTracks: p.tracks.total
  }));
};

// Fetch tracks for a playlist AND their audio features (BPM, Energy, etc)
export const fetchPlaylistDetails = async (token: string, playlistId: string): Promise<Song[]> => {
  // 1. Get Tracks
  const tracksData = await fetchSpotify(`/playlists/${playlistId}/tracks?limit=100`, token);
  
  const tracks = tracksData.items
    .map((item: any) => item.track)
    .filter((t: any) => t && t.id); // Filter nulls

  if (tracks.length === 0) return [];

  // 2. Get Audio Features (Batch)
  const ids = tracks.map((t: any) => t.id).join(',');
  const featuresData = await fetchSpotify(`/audio-features?ids=${ids}`, token);
  
  // 3. Merge
  return tracks.map((track: any, index: number) => {
    const feat = featuresData.audio_features[index] || {};
    
    // Map Pitch Class notation to Camelot or Standard Key roughly if needed, 
    // but for now we just use the integer or a simple map
    const keyMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const mode = feat.mode === 1 ? 'Major' : 'Minor';
    const keyStr = feat.key !== undefined && feat.key >= 0 ? `${keyMap[feat.key]} ${mode}` : 'Unknown';

    return {
      id: track.id,
      uri: track.uri,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      externalUrl: track.external_urls?.spotify,
      // Features
      bpm: feat.tempo ? Math.round(feat.tempo) : 0,
      energy: feat.energy ? Number((feat.energy * 10).toFixed(1)) : 0, // Scale 0-1 to 0-10
      key: keyStr,
      isRecommendation: false
    } as Song;
  });
};

// --- Actions ---

export const saveTrackToLibrary = async (token: string, trackId: string) => {
  await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const createPlaylistAndAddTracks = async (
  token: string, 
  userId: string, 
  name: string, 
  uris: string[]
) => {
  // 1. Create Playlist
  const playlist = await fetchSpotify(`/users/${userId}/playlists`, token, {
    method: 'POST',
    body: JSON.stringify({
      name: name,
      description: 'Curated by CurateMyVibe AI',
      public: false
    })
  });

  // 2. Add Tracks (Batch of 100 max)
  // If uris > 100, need loops. For now assuming ~100.
  if (uris.length > 0) {
    await fetchSpotify(`/playlists/${playlist.id}/tracks`, token, {
      method: 'POST',
      body: JSON.stringify({
        uris: uris.slice(0, 100) // Safety cap
      })
    });
  }
  
  return playlist.external_urls.spotify;
};