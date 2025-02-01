/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useYouTubeSearch, convertDurationToMinutes } from "../utils/youtube-api";
import { analyzeWordFrequency } from "../utils/word-analysis";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface DailyTimeLimit {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

const YouTubeAnalytics = () => {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showWatchSchedule, setShowWatchSchedule] = useState(false);
  const [timeLimits, setTimeLimits] = useState<DailyTimeLimit>({
    monday: 60,
    tuesday: 60,
    wednesday: 60,
    thursday: 60,
    friday: 60,
    saturday: 120,
    sunday: 120,
  });
  const { toast } = useToast();

  const { data: videos, isLoading, error } = useYouTubeSearch(searchTerm, apiKey);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your YouTube API key",
        variant: "destructive",
      });
      return;
    }
    if (!query) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }
    setSearchTerm(query);
  };

  const topWords = videos
    ? analyzeWordFrequency(
        videos.flatMap(video => [
          video.snippet.title,
          video.snippet.description
        ])
      )
    : [];

  const calculateWatchSchedule = () => {
    if (!videos) return [];

    const schedule: { day: string; videos: any[] }[] = [];
    let currentDayIndex = 0;
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let currentDayVideos: any[] = [];
    let remainingTimeInDay = timeLimits[daysOfWeek[currentDayIndex] as keyof DailyTimeLimit];

    videos.forEach(video => {
      const videoDuration = video.contentDetails?.duration 
        ? convertDurationToMinutes(video.contentDetails.duration)
        : 10; // Fallback to 10 minutes if duration is not available

      if (videoDuration <= remainingTimeInDay) {
        currentDayVideos.push({ ...video, duration: videoDuration });
        remainingTimeInDay -= videoDuration;
      } else {
        if (currentDayVideos.length > 0) {
          schedule.push({
            day: daysOfWeek[currentDayIndex],
            videos: currentDayVideos
          });
        }

        currentDayIndex++;
        if (currentDayIndex >= 7) {
          // If we've gone through all days of the week, stop processing
          return;
        }

        currentDayVideos = [];
        remainingTimeInDay = timeLimits[daysOfWeek[currentDayIndex] as keyof DailyTimeLimit];

        // Try to add the video to the new day
        if (videoDuration <= remainingTimeInDay) {
          currentDayVideos.push({ ...video, duration: videoDuration });
          remainingTimeInDay -= videoDuration;
        }
      }
    });

    // Add the last day's videos if any remain
    if (currentDayVideos.length > 0) {
      schedule.push({
        day: daysOfWeek[currentDayIndex],
        videos: currentDayVideos
      });
    }

    return schedule;
  };

  const watchSchedule = calculateWatchSchedule();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        YouTube Content Analysis
      </h1>

      <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-4 mb-8">
        <div className="space-y-2">
          <label className="text-sm font-medium">YouTube API Key</label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your YouTube API key"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Search Query</label>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search term"
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Analyze"
              )}
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <Card className="p-4 mb-8 bg-red-50 text-red-600">
          Error: {error instanceof Error ? error.message : "Something went wrong"}
        </Card>
      )}

      {videos && (
        <div className="max-w-2xl mx-auto space-y-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Top 5 Words (from {videos.length} videos)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topWords.map(({ word, count }) => (
                <Card key={word} className="p-4 text-center">
                  <div className="font-medium text-lg">{word}</div>
                  <div className="text-sm text-gray-500">
                    Used {count} times
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Watch Time Analysis</h2>
              <Button onClick={() => setShowWatchSchedule(!showWatchSchedule)}>
                {showWatchSchedule ? "Hide Schedule" : "Show Schedule"}
              </Button>
            </div>

            {showWatchSchedule && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(timeLimits).map(([day, limit]) => (
                    <div key={day} className="space-y-2">
                      <label className="text-sm font-medium capitalize">{day}</label>
                      <Input
                        type="number"
                        value={limit}
                        onChange={(e) =>
                          setTimeLimits({
                            ...timeLimits,
                            [day]: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {watchSchedule.map(({ day, videos }, index) => (
                    <Card key={index} className="p-4">
                      <h3 className="text-lg font-medium capitalize mb-2">{day}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Est. Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {videos.map((video: any, videoIndex: number) => (
                            <TableRow key={videoIndex}>
                              <TableCell>{video.snippet.title}</TableCell>
                              <TableCell>{video.duration} min</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default YouTubeAnalytics;