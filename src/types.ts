export interface EmotionScore {
  emotion: string;
  score: number;
}

export interface MoodState {
  primaryEmotion: string;
  intensity: number;
  emotionalSpectrum: EmotionScore[];
}

export interface CognitiveDistortion {
  name: string;
  detected: boolean;
  quote: string;
  explanation: string;
}

export interface Reframing {
  rationalAlternative: string;
  cbtPrompt: string;
}

export interface DiscoveryExercise {
  title: string;
  description: string;
  steps: string[];
}

export interface UiTranslations {
  mindAnalyzer: string;
  distortionLibrary: string;
  newReflection: string;
  searchReflections: string;
  allEmotions: string;
  allDistortions: string;
  pastReflections: string;
  statusProtected: string;
  howItWorksTitle: string;
  howItWorksDesc: string;
  freeJournalTab: string;
  cbtAnalyzerTab: string;
  voiceJournalTab: string;
  loadSampleButton: string;
  writeFreelyPlaceholder: string;
  situationLabel: string;
  situationPlaceholder: string;
  thoughtsLabel: string;
  thoughtsPlaceholder: string;
  feelingsLabel: string;
  feelingsPlaceholder: string;
  deconstructButton: string;
  deconstructingMind: string;
  loadingSubtitle: string;
  detectedLanguageBadge: string;
  severeDistress: string;
  moderateDistress: string;
  mildDistress: string;
  companionVoiceLabel: string;
  synthesisTitle: string;
  spectrumTitle: string;
  arousalStateTitle: string;
  intensityLabel: string;
  primaryEmotionLabel: string;
  restructuringTitle: string;
  reframeTableTitle: string;
  automaticTrapLabel: string;
  rationalReframeLabel: string;
  cbtProbingPromptLabel: string;
  biasScannerTitle: string;
  distortionScannerTitle: string;
  activeExerciseLabel: string;
  exerciseWorkspaceLabel: string;
  exerciseWorkspacePlaceholder: string;
  saveReflectionButton: string;
  healthyFlowDetected?: string;
  healthyFlowDesc?: string;
  identifiedInThoughts?: string;
  therapeuticBreakdown?: string;
  hideUndetected?: string;
  showUndetected?: string;
  workThroughSteps?: string;
  allStepsDone?: string;
  savingReflection?: string;
  reflectionAppended?: string;
}

export interface AnalysisData {
  summary: string;
  moodState: MoodState;
  cognitiveDistortions: CognitiveDistortion[];
  reframing: Reframing;
  discoveryExercise: DiscoveryExercise;
  detectedLanguage?: string;
  translatedUi?: UiTranslations;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  userInput: {
    inputType: "freeform" | "structured";
    textContent?: string;
    situation?: string;
    thoughts?: string;
    feelings?: string;
  };
  analysis: AnalysisData;
}
