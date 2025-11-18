export enum FlowType {
  RISING_ENERGY = "Rising Energy",
  FALLING_ENERGY = "Chill Down",
  MOUNTAIN = "Peak & Valley",
  CONSISTENT = "Consistent Vibe"
}

export interface SpotifyConfig {
  clientId: string;
  redirectUri: string;
}

export interface Song {
  id: string;
  uri: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  energy: number; // 0-1 (mapped to 0-10 for UI)
  mood?: string;
  reasoning?: string;
  isRecommendation?: boolean; // True if AI added it, False if from user's library
  externalUrl?: string;
}

export interface ImportedPlaylist {
  id: string;
  name: string;
  songs: Song[];
  imageUrl?: string;
  totalTracks: number;
}

export interface CurateRequest {
  initialInput: string; 
  targetVibe: string;
  flowType: FlowType;
  includeRecommendations: boolean;
}

export interface PlaylistStats {
  avgBpm: number;
  avgEnergy: number;
  totalSongs: number;
  primaryMood: string;
}