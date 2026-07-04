import React, { useState } from "react";
import { Sparkles, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Save, Check, FileCheck, ThumbsUp, Heart } from "lucide-react";
import { HistoryEntry, CognitiveDistortion, UiTranslations } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AnalysisViewProps {
  entry: HistoryEntry;
  translations: UiTranslations;
  onSaveReflection?: (id: string, reflectionText: string) => Promise<void>;
}

export default function AnalysisView({ entry, translations, onSaveReflection }: AnalysisViewProps) {
  const { analysis } = entry;
  const { summary, moodState, cognitiveDistortions, reframing, discoveryExercise } = analysis;

  const [reflectionText, setReflectionText] = useState("");
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isPersian = translations.mindAnalyzer === "آنالیزور ذهن";

  const getLocalizedDistortionName = (name: string) => {
    if (!isPersian) return name;
    const clean = name.toLowerCase().trim();
    if (clean.includes("catastrophiz")) return "فاجعه‌سازی (بزرگ‌نمایی)";
    if (clean.includes("all-or-nothing") || clean.includes("all or nothing")) return "تفکر همه یا هیچ (سیاه و سفید)";
    if (clean.includes("mind read") || clean.includes("mindreading")) return "ذهن‌خوانی";
    if (clean.includes("emotional reason")) return "استدلال احساسی";
    if (clean.includes("should") || clean.includes("must")) return "بایدهای تحمیلی (بایدها و نبایدها)";
    if (clean.includes("overgeneraliz")) return "تعمیم بیش از حد";
    if (clean.includes("mental filter")) return "فیلتر ذهنی";
    if (clean.includes("discounting") || clean.includes("disqualifying")) return "بی‌توجهی به جنبه‌های مثبت";
    if (clean.includes("personaliz")) return "شخصی‌سازی";
    if (clean.includes("labeling") || clean.includes("labelling")) return "برچسب‌زدن";
    return name;
  };

  // Filter detected vs undetected distortions
  const detectedDistortions = cognitiveDistortions.filter((d) => d.detected);
  const undetectedDistortions = cognitiveDistortions.filter((d) => !d.detected);
  const [showUndetected, setShowUndetected] = useState(false);
  const [expandedDistortion, setExpandedDistortion] = useState<string | null>(
    detectedDistortions.length > 0 ? detectedDistortions[0].name : null
  );

  // SVG Radial Ring calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const intensity = moodState?.intensity ?? 50;
  const strokeDashoffset = circumference - (intensity / 100) * circumference;

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSaveReflection = async () => {
    if (!onSaveReflection || !reflectionText.trim()) return;
    setIsSavingReflection(true);
    setSaveSuccess(false);
    try {
      await onSaveReflection(entry.id, reflectionText);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving reflection:", err);
    } finally {
      setIsSavingReflection(false);
    }
  };

  const getIntensityLevel = (score: number) => {
    if (score >= 80) return translations.severeDistress || "Severe distress";
    if (score >= 50) return translations.moderateDistress || "Moderate distress";
    return translations.mildDistress || "Mild discomfort";
  };

  const getIntensityColorClass = (score: number) => {
    if (score >= 80) return "text-[#8B0053]";
    if (score >= 50) return "text-orange-400";
    return "text-emerald-400";
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16" id="analysis-results-container">
      {/* 1. Compassionate Summary Block */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-tyrian rounded-2xl p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(139,0,83,0.05)] border border-[#8B0053]/15"
        id="summary-block"
      >
        <div className="absolute top-0 right-0 p-5 opacity-10">
          <Heart className="w-24 h-24 text-[#8B0053]" />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-2.5 w-2.5 rounded-full bg-[#8B0053] animate-pulse" />
          <span className="text-[10px] tracking-widest font-mono uppercase text-[#8B0053] font-semibold">
            {translations.companionVoiceLabel}
          </span>
        </div>

        <h2 className="text-xl font-display font-bold text-white mb-3">{translations.synthesisTitle}</h2>
        <p className="text-gray-300 text-sm leading-relaxed font-sans font-light">
          {summary}
        </p>
      </motion.div>

      {/* 2. Grid containing Emotional Spectrum and Reframing Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Emotional Spectrum Mapping Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-5 glass-panel rounded-2xl p-6 flex flex-col justify-between"
          id="emotion-mapping-card"
        >
          <div>
            <span className="text-[10px] tracking-wider font-mono text-gray-500 uppercase block mb-1">
              {translations.spectrumTitle}
            </span>
            <h3 className="text-base font-display font-semibold text-white mb-6">{translations.arousalStateTitle}</h3>
          </div>

          {/* Radial intensity visual */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-zinc-900"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Foreground circle with neon Tyrian purple glow */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-[#8B0053] transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(139, 0, 83, 0.45))",
                  }}
                />
              </svg>

              {/* Inner text values */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-display font-bold text-white">{intensity}%</span>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">{translations.intensityLabel}</span>
              </div>
            </div>

            <div className="text-center mt-5 space-y-1">
              <span className="text-xs font-medium text-gray-300 block">
                {translations.primaryEmotionLabel}: <span className="text-white font-semibold">{moodState?.primaryEmotion}</span>
              </span>
              <span className={`text-[10px] font-mono ${getIntensityColorClass(intensity)}`}>
                {getIntensityLevel(intensity)}
              </span>
            </div>
          </div>

          {/* Individual secondary emotion values */}
          <div className="mt-6 pt-5 border-t border-white/5 space-y-3.5">
            {moodState?.emotionalSpectrum?.map((emo, idx) => (
              <div key={idx} className="space-y-1" id={`spectrum-bar-${idx}`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-medium">{emo.emotion}</span>
                  <span className="text-gray-400 font-mono text-[10px]">{emo.score}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#4A002C] to-[#8B0053]"
                    initial={{ width: 0 }}
                    animate={{ width: `${emo.score}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Dynamic Cognitive Reframing comparison */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-6"
          id="cognitive-reframe-card"
        >
          <div>
            <span className="text-[10px] tracking-wider font-mono text-gray-500 uppercase block mb-1">
              {translations.restructuringTitle}
            </span>
            <h3 className="text-base font-display font-semibold text-white">{translations.reframeTableTitle}</h3>
          </div>

          <div className="space-y-4">
            {/* Automatic original thought representation */}
            <div className="p-4 rounded-xl border border-[#8B0053]/15 bg-purple-950/5 relative overflow-hidden">
              <span className="text-[9px] font-mono text-[#8B0053] uppercase tracking-wider block mb-1">
                {translations.automaticTrapLabel}
              </span>
              <p className="text-xs text-gray-400 italic leading-relaxed">
                &ldquo;{entry.userInput.inputType === "structured" 
                  ? entry.userInput.thoughts 
                  : entry.userInput.textContent || "Unfiltered mind logs"}&rdquo;
              </p>
            </div>

            {/* Downward transition indicator */}
            <div className="flex justify-center my-1 text-[#8B0053] animate-pulse">
              <ArrowRight className="w-5 h-5 transform rotate-90" />
            </div>

            {/* Reconstructed Rational Alternative */}
            <div className="p-4 rounded-xl border border-emerald-500/15 bg-emerald-950/5 relative overflow-hidden">
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                {translations.rationalReframeLabel}
              </span>
              <p className="text-xs text-gray-200 leading-relaxed font-sans">
                {reframing?.rationalAlternative}
              </p>
            </div>
          </div>

          {/* Probing Self-Coaching Prompt */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
            <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#8B0053]" /> {translations.cbtProbingPromptLabel}
            </span>
            <p className="text-xs text-gray-300 leading-relaxed italic">
              &ldquo;{reframing?.cbtPrompt}&rdquo;
            </p>
          </div>
        </motion.div>
      </div>

      {/* 3. Cognitive Distortion Scanner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-6"
        id="distortion-scanner-card"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-[10px] tracking-wider font-mono text-gray-500 uppercase block mb-1">
              {translations.biasScannerTitle}
            </span>
            <h3 className="text-base font-display font-semibold text-white">{translations.distortionScannerTitle}</h3>
          </div>

          {detectedDistortions.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#8B0053]/10 border border-[#8B0053]/30 text-[#8B0053] text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>{detectedDistortions.length} {translations.distortionScannerTitle}</span>
            </div>
          )}
        </div>

        {detectedDistortions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-emerald-500/20 bg-emerald-950/5 rounded-xl">
            <ThumbsUp className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-bounce" />
            <h4 className="text-sm font-display font-semibold text-emerald-300">
              {translations.healthyFlowDetected || "Healthy Cognitive Flow Detected"}
            </h4>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
              {translations.healthyFlowDesc || "Fantastic! Gemini didn't detect any severe thinking distortions or mental loops in your reflection. Your logic is highly balanced, rational, and adaptive."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {detectedDistortions.map((distortion) => {
              const isExpanded = expandedDistortion === distortion.name;
              const localizedName = getLocalizedDistortionName(distortion.name);

              return (
                <div
                  key={distortion.name}
                  className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                    isExpanded
                      ? "bg-[#8B0053]/5 border-[#8B0053]/35"
                      : "bg-black/35 border-white/5 hover:border-white/10"
                  }`}
                  id={`detected-distortion-${distortion.name.replace(/\s+/g, "-")}`}
                >
                  <button
                    onClick={() => setExpandedDistortion(isExpanded ? null : distortion.name)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4.5 h-4.5 text-[#8B0053]" />
                      <span className="font-display font-medium text-sm text-gray-200">
                        {localizedName}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "transform rotate-90" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-4 border-t border-white/5 space-y-4 pt-3 text-xs leading-relaxed text-gray-300">
                          {/* Quote display */}
                          {distortion.quote && (
                            <div className="bg-black/40 p-3 rounded-lg border-l-2 border-[#8B0053]">
                              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">
                                {translations.identifiedInThoughts || "Identified in your thoughts:"}
                              </span>
                              <p className="italic text-gray-300">
                                &ldquo;{distortion.quote}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Explanation and advice */}
                          <div>
                            <span className="text-[10px] font-mono text-[#8B0053] uppercase tracking-widest block mb-1">
                              {translations.therapeuticBreakdown || "Therapeutic Breakdown:"}
                            </span>
                            <p className="text-gray-300">
                              {distortion.explanation}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Optional show undetected library shortcut */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowUndetected(!showUndetected)}
                id="btn-toggle-undetected"
                className="text-[10px] font-mono text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>
                  {showUndetected 
                    ? (translations.hideUndetected || "Hide undetected mental distortions") 
                    : (translations.showUndetected || "Show undetected mental distortions")
                  } ({undetectedDistortions.length})
                </span>
              </button>
            </div>

            <AnimatePresence>
              {showUndetected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 grid grid-cols-2 md:grid-cols-3 gap-2 overflow-hidden"
                  id="undetected-distortions-list"
                >
                  {undetectedDistortions.map((d) => (
                    <div
                      key={d.name}
                      className="p-2.5 rounded-lg border border-white/5 bg-black/10 text-[10px] text-gray-500 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{getLocalizedDistortionName(d.name)}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* 4. Active Interactive Discovery Exercise */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-heavy rounded-2xl p-6 border border-[#8B0053]/15 shadow-[0_4px_24px_rgba(139,0,83,0.05)] relative overflow-hidden"
        id="discovery-exercise-card"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-purple-950/50 border border-purple-500/20 text-purple-400">
            <Sparkles className="w-4.5 h-4.5 text-[#8B0053]" />
          </div>
          <div>
            <span className="text-[10px] tracking-wider font-mono text-gray-500 uppercase block">
              {translations.activeExerciseLabel}
            </span>
            <h3 className="text-base font-display font-bold text-white">
              {discoveryExercise?.title}
            </h3>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed mb-6 bg-black/20 p-3 rounded-lg border border-white/5">
          {discoveryExercise?.description}
        </p>

        {/* Steps Checklists */}
        <div className="space-y-3 mb-6">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
            {translations.workThroughSteps || "WORK THROUGH THE EXERCISE STEPS:"}
          </span>
          
          {discoveryExercise?.steps?.map((step, idx) => {
            const isCompleted = !!completedSteps[idx];
            return (
              <button
                key={idx}
                id={`btn-exercise-step-${idx}`}
                onClick={() => toggleStep(idx)}
                className="w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3.5 bg-zinc-950/40 border-white/5 hover:border-white/10 cursor-pointer"
              >
                <div
                  className={`mt-0.5 h-5.5 w-5.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isCompleted
                      ? "bg-[#8B0053] border-[#8B0053] text-white"
                      : "border-white/20 text-transparent hover:border-purple-400"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-xs leading-relaxed transition-all ${
                    isCompleted ? "text-gray-500 line-through font-light" : "text-gray-200"
                  }`}
                >
                  {step}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reflection Notepad Form */}
        <div className="space-y-3 pt-5 border-t border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#8B0053]" />
              <span>{translations.exerciseWorkspaceLabel}</span>
            </label>
            {entry.analysis?.discoveryExercise?.steps?.length === Object.values(completedSteps).filter(Boolean).length && (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 animate-pulse">
                <Check className="w-3 h-3" /> {translations.allStepsDone || "All Steps Done!"}
              </span>
            )}
          </div>

          <textarea
            id="textarea-reflection"
            placeholder={translations.exerciseWorkspacePlaceholder}
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            className="w-full min-h-[100px] p-3.5 text-xs rounded-xl glass-input text-gray-200 placeholder-gray-600 resize-y leading-relaxed font-sans"
          />

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSaveReflection}
              disabled={isSavingReflection || !reflectionText.trim()}
              id="btn-save-reflection"
              className="px-5 py-2.5 rounded-lg bg-purple-950/30 text-purple-200 border border-purple-500/30 text-xs font-medium hover:bg-purple-900/40 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-2 cursor-pointer active:scale-95 animate-fadeIn"
            >
              {isSavingReflection ? (
                <span>{translations.savingReflection || "Saving reflection..."}</span>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{translations.reflectionAppended || "Reflection Appended!"}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{translations.saveReflectionButton}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
