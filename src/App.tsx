import React, { useState, useEffect } from "react";
import { Brain, Sparkles, Compass, Languages, ChevronDown } from "lucide-react";
import { HistoryEntry, AnalysisData, UiTranslations } from "./types";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import AnalysisView from "./components/AnalysisView";
import HelpInfo from "./components/HelpInfo";
import AuthView from "./components/AuthView";
import { LOCALIZED_DICTS, SUPPORTED_LANGUAGES } from "./localization";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("cognitive_session_token"));
  const [user, setUser] = useState<{ id: string; email: string } | null>(() => {
    const stored = localStorage.getItem("cognitive_user");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // High-level navigation tab: "analyze" or "library"
  const [navTab, setNavTab] = useState<"analyze" | "library">("analyze");

  // Multi-language state - Default is English
  const [language, setLanguage] = useState<string>("English");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Clear session on logout
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setHistory([]);
    setSelectedEntry(null);
    localStorage.removeItem("cognitive_session_token");
    localStorage.removeItem("cognitive_user");
  };

  // Set session on successful authentication
  const handleAuthSuccess = (newToken: string, newUser: { id: string; email: string }) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("cognitive_session_token", newToken);
    localStorage.setItem("cognitive_user", JSON.stringify(newUser));
  };

  // Load history from Express server on mount
  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/history", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setHistory(json.data);
        if (json.data.length > 0 && !selectedEntry) {
          setSelectedEntry(json.data[0]);
        }
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to load history from server:", err);
    }
  };

  // Verify session on mount or token changes
  useEffect(() => {
    const verifySession = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          handleLogout();
        } else {
          fetchHistory();
        }
      } catch (err) {
        console.error("Session verification failed:", err);
        fetchHistory();
      }
    };

    if (token) {
      verifySession();
    }
  }, [token]);

  // Sync language selection when reviewing an entry that contains detected language
  useEffect(() => {
    if (selectedEntry?.analysis?.detectedLanguage) {
      const detected = selectedEntry.analysis.detectedLanguage;
      if (SUPPORTED_LANGUAGES.includes(detected)) {
        setLanguage(detected);
      }
    }
  }, [selectedEntry]);

  // Determine active UI translations dictionary
  const translations: UiTranslations = {
    ...(selectedEntry?.analysis?.translatedUi || {}),
    ...(LOCALIZED_DICTS[language] || LOCALIZED_DICTS["English"])
  };

  // Request thought analysis from server
  const handleAnalyzeThought = async (payload: any) => {
    if (!token) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setSelectedEntry(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "An unknown error occurred during analysis.");
      }

      const analysisResult: AnalysisData = json.data;

      const newEntryId = "entry_" + Math.random().toString(36).substring(2, 11);
      const newEntry: HistoryEntry = {
        id: newEntryId,
        timestamp: new Date().toISOString(),
        userInput: payload,
        analysis: analysisResult,
      };

      const saveRes = await fetch("/api/history", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newEntry),
      });
      const saveJson = await saveRes.json();

      if (saveJson.success) {
        await fetchHistory();
        setSelectedEntry(newEntry);
      } else {
        setHistory((prev) => [newEntry, ...prev]);
        setSelectedEntry(newEntry);
      }
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setAnalysisError(err.message || "The Gemini analysis service failed. Please check your API configuration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Append a reflection workbook text to a past analysis log
  const handleSaveReflection = async (id: string, reflectionText: string) => {
    if (!token) return;
    const entryToUpdate = history.find((e) => e.id === id);
    if (!entryToUpdate) return;

    const updatedEntry: HistoryEntry = {
      ...entryToUpdate,
      analysis: {
        ...entryToUpdate.analysis,
        summary: `${entryToUpdate.analysis.summary}\n\n[USER REFLECTION RECORDED on ${new Date().toLocaleDateString()}]: ${reflectionText}`,
      },
    };

    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedEntry),
      });
      
      const json = await res.json();
      if (json.success) {
        setHistory((prev) => prev.map((e) => (e.id === id ? updatedEntry : e)));
        setSelectedEntry(updatedEntry);
      }
    } catch (err) {
      console.error("Failed to append reflection:", err);
    }
  };

  // Delete a logged session
  const handleDeleteEntry = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/history/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        if (selectedEntry?.id === id) {
          setSelectedEntry(null);
        }
        setHistory((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  // Reset workspace to write a new reflection
  const handleNewEntry = () => {
    setSelectedEntry(null);
    setAnalysisError(null);
    setNavTab("analyze");
  };

  if (!token || !user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#050305] text-white overflow-hidden font-sans" id="app-root-container">
      {/* Background ambient decorative Tyrian Purple glows */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full ambient-tyrian-glow pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full ambient-tyrian-glow-secondary pointer-events-none" />

      {/* Main Container */}
      <div className="flex flex-1 flex-col md:flex-row relative z-10 overflow-hidden h-full">
        
        {/* Left Side Navigation Panel (History, Filters, Actions) */}
        <Sidebar
          history={history}
          selectedId={selectedEntry?.id || null}
          translations={translations}
          onSelectEntry={(entry) => {
            setSelectedEntry(entry);
            setNavTab("analyze");
          }}
          onNewEntry={handleNewEntry}
          onDeleteEntry={handleDeleteEntry}
        />

        {/* Main Application Workstage */}
        <div className="flex-1 flex flex-col h-full overflow-hidden" id="main-workstage">
          
          {/* Workstage Header Bar */}
          <header className="p-5 border-b border-white/5 flex items-center justify-between bg-black/35 backdrop-blur-md relative z-30">
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-[#8B0053]" />
              <div className="text-[10px] md:text-xs font-mono font-medium text-gray-400 flex items-center gap-2">
                {selectedEntry ? (
                  <span>{translations.statusProtected || "REVIEWING ARCHIVED REFLECTION"}</span>
                ) : (
                  <span>{translations.statusProtected || "ACTIVE MIND LAB WORKSPACE"}</span>
                )}
                <span className="hidden sm:inline-block text-[10px] text-gray-500">•</span>
                <span className="hidden sm:inline-block text-[10px] text-[#8B0053]/80 font-semibold uppercase font-mono">{user?.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 text-[10px] text-red-400 hover:text-red-300 font-mono border border-red-950/30 hover:border-red-500/30 bg-red-950/10 hover:bg-red-950/20 rounded-xl cursor-pointer transition-all active:scale-95"
                title="Sign out from session"
                id="btn-sign-out"
              >
                Sign Out
              </button>
              {/* Language Selector Dropdown */}
              <div className="relative z-50">
                <button
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-zinc-950/80 border border-white/5 rounded-xl hover:border-[#8B0053]/40 hover:bg-zinc-900 transition-all cursor-pointer"
                  id="language-select-btn"
                >
                  <Languages className="w-3.5 h-3.5 text-[#8B0053]" />
                  <span className="text-gray-300 font-medium">{language}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>

                {isLangDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsLangDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-36 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setLanguage(lang);
                            setIsLangDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-[#8B0053]/20 hover:text-white ${
                            language === lang ? "text-[#8B0053] font-bold bg-[#8B0053]/5" : "text-gray-400"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* High-level navigation buttons */}
              <div className="flex items-center gap-2 p-1 bg-black/50 border border-white/5 rounded-xl">
                <button
                  onClick={() => setNavTab("analyze")}
                  id="btn-nav-analyze"
                  className={`px-3 py-1.5 text-xs font-display font-medium rounded-lg transition-all cursor-pointer ${
                    navTab === "analyze"
                      ? "bg-[#8B0053]/10 text-white border border-[#8B0053]/25"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {translations.mindAnalyzer}
                </button>

                <button
                  onClick={() => setNavTab("library")}
                  id="btn-nav-library"
                  className={`px-3 py-1.5 text-xs font-display font-medium rounded-lg transition-all cursor-pointer ${
                    navTab === "library"
                      ? "bg-[#8B0053]/10 text-white border border-[#8B0053]/25"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {translations.distortionLibrary}
                </button>
              </div>
            </div>
          </header>

          {/* Scrolling Content Stage */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <AnimatePresence mode="wait">
              {navTab === "analyze" ? (
                selectedEntry ? (
                  /* Render full interactive CBT analysis results */
                  <motion.div
                    key="analysis-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Visual header for loaded past entries */}
                    <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                      <div>
                        <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                          {translations.mindAnalyzer} - {translations.detectedLanguageBadge || "CBT Feedback"}
                        </h2>
                        <p className="text-xs text-gray-400 font-mono">
                          {new Date(selectedEntry.timestamp).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={handleNewEntry}
                        id="btn-start-fresh"
                        className="text-xs self-start bg-zinc-900 border border-white/10 hover:border-[#8B0053]/30 text-gray-300 hover:text-white px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        {translations.newReflection}
                      </button>
                    </div>

                    <AnalysisView
                      entry={selectedEntry}
                      translations={translations}
                      onSaveReflection={handleSaveReflection}
                    />
                  </motion.div>
                ) : (
                  /* Render thoughts input dashboard */
                  <motion.div
                    key="input-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isAnalyzing ? (
                      /* High-craft Loading Matrix screen while Gemini analyzes */
                      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 space-y-6" id="loading-stage">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border border-[#8B0053]/20 flex items-center justify-center animate-spin border-t-[#8B0053]" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-[#8B0053] animate-pulse" />
                          </div>
                        </div>

                        <div className="space-y-2 max-w-sm">
                          <h3 className="text-sm font-display font-semibold text-gray-200 uppercase tracking-widest flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#8B0053] animate-pulse" />
                            {translations.deconstructingMind}
                          </h3>
                          <p className="text-xs text-gray-400 leading-relaxed font-sans">
                            {translations.loadingSubtitle}
                          </p>
                        </div>

                        {/* Animated loading telemetry statements */}
                        <div className="p-3 px-5 rounded-lg bg-purple-950/5 border border-purple-900/10 text-[10px] font-mono text-purple-400/80 tracking-wide uppercase">
                          Running Cognitive Distortion Analyzer v2.0 (Tyrian Edition)
                        </div>
                      </div>
                    ) : (
                      <Dashboard
                        onAnalyze={handleAnalyzeThought}
                        isLoading={isAnalyzing}
                        error={analysisError}
                        translations={translations}
                        language={language}
                      />
                    )}
                  </motion.div>
                )
              ) : (
                /* Educational Library view */
                <motion.div
                  key="library-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-2xl mx-auto"
                >
                  <HelpInfo language={language} translations={translations} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
