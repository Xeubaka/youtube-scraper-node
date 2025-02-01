import { useQuery } from "@tanstack/react-query";

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";
const CACHE_KEY = "youtube_search_cache";
const MAX_RESULTS = 50; // YouTube API limit per request

interface YouTubeVideo {
  id: { videoId: string } | string;
  snippet: {
    title: string;
    description: string;
  };
  contentDetails?: {
    duration: string;
  };
}

interface SearchCache {
  query: string;
  videos: YouTubeVideo[];
  timestamp: number;
}

// Cache duration - 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

const fetchVideoDetails = async (videoIds: string[], apiKey: string): Promise<YouTubeVideo[]> => {
  console.log("Fetching video details for IDs:", videoIds);
  
  const params = new URLSearchParams({
    part: "contentDetails",
    id: videoIds.join(','),
    key: apiKey,
  });

  const response = await fetch(`${YOUTUBE_API_URL}/videos?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Video details fetch error:", errorData);
    throw new Error(errorData.error?.message || "Failed to fetch video details");
  }
  const data = await response.json();
  return data.items;
};

const fetchYouTubeVideos = async (
  query: string,
  apiKey: string,
  pageToken?: string
): Promise<{ items: YouTubeVideo[]; nextPageToken?: string }> => {
  console.log("Fetching YouTube videos for query:", query, "pageToken:", pageToken);
  
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    maxResults: MAX_RESULTS.toString(),
    key: apiKey,
    type: "video",
    safeSearch: "none",
    videoEmbeddable: "true"
  });

  if (pageToken) {
    params.append("pageToken", pageToken);
  }

  const response = await fetch(`${YOUTUBE_API_URL}/search?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    console.error("YouTube search error:", errorData);
    throw new Error(errorData.error?.message || "Failed to fetch YouTube videos");
  }
  return response.json();
};

const getCachedResults = (query: string): YouTubeVideo[] | null => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const cacheData: SearchCache = JSON.parse(cached);
  if (
    cacheData.query !== query ||
    Date.now() - cacheData.timestamp > CACHE_DURATION
  ) {
    return null;
  }

  return cacheData.videos;
};

const setCachedResults = (query: string, videos: YouTubeVideo[]) => {
  const cacheData: SearchCache = {
    query,
    videos,
    timestamp: Date.now(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
};

export const useYouTubeSearch = (query: string, apiKey: string) => {
  return useQuery({
    queryKey: ["youtube", query],
    queryFn: async () => {
      console.log("Starting YouTube search for query:", query);
      
      // Check cache first
      const cached = getCachedResults(query);
      if (cached) {
        console.log("Returning cached results for query:", query);
        return cached;
      }

      let allVideos: YouTubeVideo[] = [];
      let videoDetails: YouTubeVideo[] = [];
      let nextPageToken: string | undefined = undefined;

      try {
        // Fetch up to 200 videos (4 pages of 50 results)
        for (let i = 0; i < 4; i++) {
          const response = await fetchYouTubeVideos(query, apiKey, nextPageToken);
          allVideos = [...allVideos, ...response.items];
          nextPageToken = response.nextPageToken;

          if (!nextPageToken) break;
        }

        // Fetch video details (including duration) for all videos
        const videoIds = allVideos.map(video => {
          return typeof video.id === 'string' ? video.id : video.id.videoId;
        });

        do {
          
          const response = await fetchVideoDetails(videoIds.splice(0, 50), apiKey);
          videoDetails = [...videoDetails, ...response];

          if (!nextPageToken) break;
        } while (videoIds.length > 0)

        // Merge video details with search results
        const videosWithDetails = allVideos.map(video => {
          const videoId = typeof video.id === 'string' ? video.id : video.id.videoId;
          const details = videoDetails.find(detail => 
            typeof detail.id === 'string' ? detail.id === videoId : detail.id.videoId === videoId
          );
          return {
            ...video,
            contentDetails: details?.contentDetails
          };
        });

        // Cache results
        setCachedResults(query, videosWithDetails);
        console.log(`Cached ${videosWithDetails.length} videos for query:`, query);
        
        return videosWithDetails;
      } catch (error) {
        console.error("Error in YouTube search:", error);
        throw error;
      }
    },
    enabled: !!query && !!apiKey,
  });
};

// Helper function to convert ISO 8601 duration to minutes
export const convertDurationToMinutes = (duration: string): number => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  
  const hours = (match?.[1] ? parseInt(match[1]) : 0);
  const minutes = (match?.[2] ? parseInt(match[2]) : 0);
  const seconds = (match?.[3] ? parseInt(match[3]) : 0);
  
  return hours * 60 + minutes + Math.ceil(seconds / 60);
};