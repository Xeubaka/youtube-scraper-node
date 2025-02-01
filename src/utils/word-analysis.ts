interface WordCount {
    word: string;
    count: number;
  }
  
  const stopWords = new Set([ "|", "-" ]);
  
  export const analyzeWordFrequency = (texts: string[]): WordCount[] => {
    console.log("Analyzing word frequency for", texts.length, "texts");
    
    const wordCount: Map<string, number> = new Map();
  
    texts.forEach(text => {
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
  
      words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      });
    });
  
    const sortedWords = Array.from(wordCount.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  
    console.log("Top 5 words:", sortedWords);
    return sortedWords;
  };