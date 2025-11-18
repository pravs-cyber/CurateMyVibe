import { GoogleGenAI, Type } from "@google/genai";
import { Song, FlowType } from "../types";

// Initialize Gemini Client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

export const curatePlaylist = async (
  sourceSongs: Song[],
  targetVibe: string,
  flowType: FlowType,
  includeRecommendations: boolean
): Promise<Song[]> => {
  
  // We provide a lean version of the source songs to the AI to save context
  // We include the ID so we can map it back to the real object later
  const sourceMap = sourceSongs.map(s => ({
    id: s.id,
    desc: `"${s.title}" by ${s.artist} (BPM: ${s.bpm}, Energy: ${s.energy}, Key: ${s.key})`
  }));
  
  const sourceListStr = sourceMap.map(s => s.desc).join("\n");

  let prompt = `
    Act as a world-class collaborative DJ curator for Spotify.
    
    CONTEXT:
    I have a list of SOURCE SONGS from the user's library with their real audio features:
    ${sourceListStr}
    
    GOAL: Create a massive, cohesive, mixed playlist of exactly 100 songs.
    TARGET VIBE: "${targetVibe}".
    FLOW STRUCTURE: "${flowType}".
    
    INSTRUCTIONS:
    1. SELECTION & RATIO: 
       - Strictly select 95% of songs (approx 95 songs) from the provided SOURCE LIST. Pick ones that match the TARGET VIBE.
       - Add 5% of songs (approx 5 songs) as NEW RECOMMENDATIONS that fit the vibe perfectly.
       - If the source library is small, repeat songs only if necessary, but prioritize variety.
    
    2. ARRANGEMENT:
       - Use the provided BPM/Energy/Key data to order the songs specifically for "${flowType}":
         - Rising Energy: Start low BPM/Energy, build up.
         - Chill Down: Start high, fade out.
         - Peak & Valley: Wave-like structure.
         - Consistent: Keep it flat.
       - For NEW RECOMMENDATIONS, estimate their BPM/Energy/Key.
    
    3. OUTPUT FORMAT:
       - Return a JSON array of 100 Song objects.
       - IF the song is from the SOURCE LIST: You MUST include the exact "title" and "artist" provided.
       - IF the song is a RECOMMENDATION: Mark "isRecommendation": true.
       - "reasoning": Short reason why it fits the flow.
       - "energy": 0-10 scale.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              bpm: { type: Type.NUMBER },
              key: { type: Type.STRING },
              energy: { type: Type.NUMBER },
              mood: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              isRecommendation: { type: Type.BOOLEAN, description: "True if this song was NOT in the source list" }
            },
            required: ["title", "artist", "bpm", "key", "energy", "mood", "reasoning", "isRecommendation"]
          }
        }
      }
    });

    if (response.text) {
      const generatedList = JSON.parse(response.text) as Song[];
      
      // Post-processing: Re-attach real IDs and URIs from sourceSongs if available
      // This is critical so that the "Add to Playlist" buttons work for source songs
      return generatedList.map(genSong => {
        // Fuzzy match or exact match
        const original = sourceSongs.find(s => 
          s.title.toLowerCase() === genSong.title.toLowerCase() && 
          s.artist.toLowerCase().includes(genSong.artist.split(',')[0].toLowerCase())
        );

        if (original) {
          return {
            ...genSong,
            id: original.id,
            uri: original.uri,
            externalUrl: original.externalUrl,
            // We prefer the real analyzed data if available, but AI might have smoothed it for flow
            // Let's keep real data for accuracy
            bpm: original.bpm,
            energy: original.energy,
            key: original.key,
            isRecommendation: false
          };
        }
        
        // If it's a recommendation, we don't have an ID/URI yet. 
        return {
          ...genSong,
          id: `rec-${Math.random().toString(36).substr(2, 9)}`, // Temp ID
          uri: "",
          isRecommendation: true
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Gemini Curation Error:", error);
    throw new Error("Failed to curate playlist. Please try again.");
  }
};