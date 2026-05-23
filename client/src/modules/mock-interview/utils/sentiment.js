import { SentimentIntensityAnalyzer } from 'vader-sentiment';

const analyzer = new SentimentIntensityAnalyzer();

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of'];

export const analyzeText = (text) => {
  if (!text || text.trim() === '') {
    return {
      confidence: 100,
      tone: 50,
      hesitationCount: 0,
      positivity: 50,
    };
  }

  // Sentiment Analysis
  const sentimentResult = analyzer.polarity_scores(text);
  // compound is from -1 to 1. Map to 0-100.
  const toneScore = Math.round(((sentimentResult.compound + 1) / 2) * 100);

  // Hesitation Analysis
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  let hesitationCount = 0;
  
  words.forEach(word => {
    // Remove punctuation
    const cleanWord = word.replace(/[.,!?]/g, '');
    if (FILLER_WORDS.includes(cleanWord)) {
      hesitationCount++;
    }
  });

  // Calculate composite confidence score (0-100)
  // Baseline 100. Each hesitation drops it by 2 points (for long texts we might need a ratio, but this is simple real-time)
  // We'll calculate a hesitation ratio: hesitations per 10 words
  const wordsLength = words.length > 0 ? words.length : 1;
  const hesitationRatio = hesitationCount / wordsLength; // e.g., 2 / 10 = 0.2
  
  // High hesitation ratio (e.g. > 0.1) drops confidence significantly
  let confidenceScore = 100 - (hesitationRatio * 300); // 10% hesitation = 30 points drop
  
  // Adjust confidence slightly based on sentiment (positive tone increases confidence slightly)
  if (sentimentResult.compound > 0.2) confidenceScore += 5;
  if (sentimentResult.compound < -0.2) confidenceScore -= 5;
  
  confidenceScore = Math.max(0, Math.min(100, Math.round(confidenceScore)));

  return {
    confidence: confidenceScore,
    tone: toneScore,
    hesitationCount,
    positivity: Math.round(sentimentResult.pos * 100)
  };
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
