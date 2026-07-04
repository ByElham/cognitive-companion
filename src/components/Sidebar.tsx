import React, { useState } from "react";
import { Brain, Search, Trash2, Plus, Smile, History, AlertTriangle, Sparkles, Calendar } from "lucide-react";
import { HistoryEntry, UiTranslations } from "../types";

interface SidebarProps {
  history: HistoryEntry[];
  selectedId: string | null;
  translations: UiTranslations;
  onSelectEntry: (entry: HistoryEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (id: string) => void;
}

export default function Sidebar({
  history,
  selectedId,
  translations,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [emotionFilter, setEmotionFilter] = useState("");
  const [distortionFilter, setDistortionFilter] = useState("");

  // Get unique emotions in history for filter dropdown
  const uniqueEmotions = Array.from(
    new Set(history.map((entry) => entry.analysis?.moodState?.primaryEmotion).filter(Boolean))
  );

  // Get unique distortions in history for filter dropdown
  const uniqueDistortions = Array.from(
    new Set(
      history.flatMap((entry) =>
        (entry.analysis?.cognitiveDistortions || [])
          .filter((d) => d.detected)
          .map((d) => d.name)
      )
    )
  );

  // Filter the history list based on search term, emotion, and distortion
  const filteredHistory = history.filter((entry) => {
    const textMatches =
      entry.userInput.textContent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.userInput.situation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.userInput.thoughts?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.analysis?.summary?.toLowerCase().includes(searchTerm.toLowerCase());

    const emotionMatches = !emotionFilter || entry.analysis?.moodState?.primaryEmotion === emotionFilter;

    const distortionMatches =
      !distortionFilter ||
      entry.analysis?.cognitiveDistortions?.some((d) => d.detected && d.name === distortionFilter);

    return textMatches && emotionMatches && distortionMatches;
  });

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return "bg-[#8B0053]/20 text-[#8B0053] border-[#8B0053]/40";
    if (intensity >= 50) return "bg-orange-950/30 text-orange-400 border-orange-500/20";
    return "bg-emerald-950/30 text-emerald-400 border-emerald-500/20";
  };

  const getPreviewText = (entry: HistoryEntry) => {
    if (entry.userInput.inputType === "structured") {
      return entry.userInput.situation || "";
    }
    return entry.userInput.textContent || "";
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full md:w-80 h-full flex flex-col glass-panel border-r border-[#8B0053]/10 text-white overflow-hidden" id="sidebar-container">
      {/* App Logo / Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#4A002C] to-[#8B0053] shadow-[0_0_15px_rgba(139,0,83,0.35)]">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Cognitive <span className="text-[#8B0053]">Companion</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">Self-Discovery Engine</p>
          </div>
        </div>
      </div>

      {/* New Session Button */}
      <div className="p-4">
        <button
          onClick={onNewEntry}
          id="btn-new-entry"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4A002C] via-[#66023C] to-[#8B0053] text-white font-medium hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-[0_4px_12px_rgba(139,0,83,0.25)]"
        >
          <Plus className="w-4 h-4" />
          <span>{translations.newReflection}</span>
        </button>
      </div>

      {/* Filters Area */}
      <div className="px-4 pb-4 space-y-2 border-b border-white/5">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="sidebar-search"
            placeholder={translations.searchReflections}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg glass-input text-gray-200 placeholder-gray-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Emotion filter dropdown */}
          <select
            id="filter-emotion"
            value={emotionFilter}
            onChange={(e) => setEmotionFilter(e.target.value)}
            className="w-full p-2 text-[11px] rounded-lg bg-zinc-950 border border-white/10 text-gray-300 focus:border-[#8B0053] outline-none cursor-pointer"
          >
            <option value="">{translations.allEmotions}</option>
            {uniqueEmotions.map((em) => (
              <option key={em} value={em}>
                {em}
              </option>
            ))}
          </select>

          {/* Distortion filter dropdown */}
          <select
            id="filter-distortion"
            value={distortionFilter}
            onChange={(e) => setDistortionFilter(e.target.value)}
            className="w-full p-2 text-[11px] rounded-lg bg-zinc-950 border border-white/10 text-gray-300 focus:border-[#8B0053] outline-none cursor-pointer"
          >
            <option value="">{translations.allDistortions}</option>
            {uniqueDistortions.map((dist) => (
              <option key={dist} value={dist}>
                {dist.length > 15 ? `${dist.slice(0, 15)}...` : dist}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Log Feed List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400 font-mono">
          <History className="w-3.5 h-3.5" />
          <span className="uppercase">{translations.pastReflections || "Past Reflections"} ({filteredHistory.length})</span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
            <p className="text-xs text-gray-500">No reflections found.</p>
            {(searchTerm || emotionFilter || distortionFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setEmotionFilter("");
                  setDistortionFilter("");
                }}
                className="mt-2 text-[11px] text-[#8B0053] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2" id="history-list">
            {filteredHistory.map((entry) => {
              const isSelected = selectedId === entry.id;
              const hasDistortions = entry.analysis?.cognitiveDistortions?.some((d) => d.detected);
              const previewText = getPreviewText(entry);
              const primaryEmotion = entry.analysis?.moodState?.primaryEmotion || "Calm";
              const intensity = entry.analysis?.moodState?.intensity ?? 50;

              return (
                <div
                  key={entry.id}
                  id={`history-entry-${entry.id}`}
                  onClick={() => onSelectEntry(entry)}
                  className={`group relative p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col gap-2 ${
                    isSelected
                      ? "bg-gradient-to-br from-[#1e0213] to-[#0c0008] border-[#8B0053]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(139,0,83,0.15)]"
                      : "bg-zinc-950/40 border-white/5 hover:bg-zinc-900/40 hover:border-white/10"
                  }`}
                >
                  {/* Top line: Emotion Tag & Intensity & Delete */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium font-display px-2 py-0.5 rounded-md bg-white/5 text-gray-300 flex items-center gap-1">
                      <Smile className="w-3 h-3 text-[#8B0053]" />
                      {primaryEmotion}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border ${getIntensityColor(intensity)}`}>
                        {intensity}%
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEntry(entry.id);
                        }}
                        id={`btn-delete-${entry.id}`}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 hover:text-red-400 transition-all text-gray-500 cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Preview Text */}
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {previewText}
                  </p>

                  {/* Footer metadata: Date & Distortions alert */}
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.timestamp)}
                    </span>

                    {hasDistortions && (
                      <span className="text-[#8B0053] flex items-center gap-0.5" title="Cognitive distortion detected">
                        <AlertTriangle className="w-3 h-3 animate-pulse" />
                        <span>Distortion</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Companion Stats Footer */}
      <div className="p-4 border-t border-white/5 bg-black/40 text-xs text-gray-400 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#8B0053]" />
          <span>{translations.statusProtected || "Status: Protected"}</span>
        </span>
        <span className="text-[10px] text-gray-500">
          V2.0.0
        </span>
      </div>
    </div>
  );
}
