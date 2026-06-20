// Import technical keywords from existing config to exclude from overuse detection
import techKeywords from '../config/keywords.js';

// Normalize text for consistent processing
function normalize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Split text into individual sentences
function splitSentences(text) {
  return text.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
}

// Build frequency map of words in the text and track absolute word count
function getWordFrequency(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const totalWordCount = words.length; // Capture true total word count before filtering
  const freq = {};

  words.forEach(word => {
    if (word.length < 3) return; // ignore small words for frequency evaluation
    freq[word] = (freq[word] || 0) + 1;
  });

  return { freqMap: freq, totalWordCount };
}

// Calculate dynamic threshold based on resume length (fixes #230)
// Minimum threshold of 5, scales with document length (1% of total words)
function calculateDynamicThreshold(wordCount) {
  return Math.max(5, Math.floor(wordCount / 100));
}

// Create allowlist of technical terms to exclude from overuse penalties (fixes #230)
const TECHNICAL_ALLOWLIST = Object.values(techKeywords)
  .flat()
  .map(word => word.toLowerCase())
  .filter(word => word.length > 2);

// Detect overused words while excluding technical terms and using dynamic threshold (fixes #230)
function detectOverusedWords(freqMap, threshold) {
  return Object.keys(freqMap).filter(word => {
    const isTechnical = TECHNICAL_ALLOWLIST.includes(word);
    const isLongEnough = word.length > 2;
    
    return !isTechnical && isLongEnough && freqMap[word] >= threshold;
  });
}

// Detect duplicate sentences using full-string matching to avoid prefix collision false positives
function detectDuplicateSentences(sentences) {
  const duplicates = [];
  const seen = new Set();

  sentences.forEach(sentence => {
    // Use the entire normalized string as a hash key instead of truncating at 50 characters
    const key = sentence.trim();
    if (seen.has(key)) {
      duplicates.push(sentence);
    } else {
      seen.add(key);
    }
  });

  return duplicates;
}

// Generic weak phrases that reduce resume impact
const GENERIC_PHRASES = [
  "hardworking",
  "team player",
  "quick learner",
  "detail oriented",
  "self motivated"
];

// Detect usage of generic phrases
// Detect usage of generic phrases using strict word boundaries to avoid substring false positives
function detectGeneric(text) {
  return GENERIC_PHRASES.filter(phrase => {
    // Escapes any spaces inside the phrase and enforces word boundaries (\b) on both ends
    const regex = new RegExp(`\\b${phrase}\\b`, "i");
    return regex.test(text);
  });
}

// Main evaluator function
export default function consistencyEvaluator({
  resumeText = ""
}) {
  // 1. Split sentences using the raw text so punctuation delimiters still exist
  const rawSentences = splitSentences(resumeText);
  
  // 2. Normalize individual sentences for clean structural comparison
  const sentences = rawSentences.map(s => normalize(s));

  const clean = normalize(resumeText);

  // Extract both the frequency map and the non-deflated total word count
  const { freqMap, totalWordCount: wordCount } = getWordFrequency(clean);
  
  // Calculate dynamic threshold using the true word count (fixes #230)
  const dynamicThreshold = calculateDynamicThreshold(wordCount);

  const overusedWords = detectOverusedWords(freqMap, dynamicThreshold);
  const duplicateSentences = detectDuplicateSentences(sentences);
  const genericPhrases = detectGeneric(clean);

  // Calculate penalty score
  let penalty = 0;
  penalty += overusedWords.length * 5;
  penalty += duplicateSentences.length * 10;
  penalty += genericPhrases.length * 7;

  let score = Math.max(0, 100 - penalty);

  // Generate feedback messages
  const feedback = [];
  if (overusedWords.length) {
    feedback.push(`Reduce overuse of words: ${overusedWords.join(", ")}`);
  }
  if (duplicateSentences.length) {
    feedback.push("Avoid repeating similar sentences across sections");
  }
  if (genericPhrases.length) {
    feedback.push(`Replace generic phrases: ${genericPhrases.join(", ")}`);
  }
  if (score > 80) {
    feedback.push("Content is well structured and non-repetitive");
  }

  return {
    key: "consistency_match",
    label: "Content Consistency",
    score,
    summary: score > 80 
      ? "The resume content is clear and professionally structured." 
      : "Detected repetitive phrasing or generic cliches that could be improved.",
    details: {
      overusedWords,
      duplicateSentences,
      genericPhrases,
      feedback
    },
    // Added metadata for debugging and transparency (fixes #230)
    meta: {
      penaltyApplied: penalty,
      wordCount,
      thresholdUsed: dynamicThreshold
    }
  };
}