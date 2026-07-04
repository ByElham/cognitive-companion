import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Mic, AlertCircle, FileText, Sparkles, Volume2, ArrowRight, Play, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UiTranslations } from "../types";

interface DashboardProps {
  onAnalyze: (payload: any) => void;
  isLoading: boolean;
  error: string | null;
  translations: UiTranslations;
  language: string;
}

// Preset voice diary recordings translated/localized
const VOICE_PRESETS: Record<string, { label: string; transcript: string; duration: number }[]> = {
  English: [
    {
      label: "Professional Anxiety",
      transcript: "My manager was really brief in their email reply today and didn't include any normal friendly signoff. I'm completely spiraling, thinking I did a terrible job on the report and they're secretly preparing to let me go.",
      duration: 6000,
    },
    {
      label: "Relationship Insecurity",
      transcript: "My partner hasn't replied to my messages since this morning. I feel this deep knot in my stomach. I'm convinced they are growing bored of me and are probably planning to break things off soon.",
      duration: 5500,
    },
    {
      label: "Productivity Guilt",
      transcript: "I spent the entire Sunday just resting and watching movies because I was exhausted. But now I feel like a complete failure. I should be working on my side project. I'm wasting my potential.",
      duration: 6500,
    }
  ],
  Persian: [
    {
      label: "اضطراب شغلی",
      transcript: "مدیرم امروز در ایمیل پاسخی بسیار کوتاه داد و هیچ کلام دوستانه معمولی ننوشت. من کاملاً به هم ریخته‌ام و فکر می‌کنم گزارش من افتضاح بوده و او مخفیانه در حال آماده‌سازی اخراج من است.",
      duration: 6000,
    },
    {
      label: "ناامنی عاطفی",
      transcript: "همسرم از صبح به پیام‌های من پاسخ نداده است. گره عمیقی در معده‌ام احساس می‌کنم. مطمئنم که از من خسته شده و به زودی قصد دارد رابطه را تمام کند.",
      duration: 5500,
    },
    {
      label: "عذاب‌وجدان بهره‌وری",
      transcript: "تمام یکشنبه را فقط استراحت کردم و فیلم دیدم چون خسته بودم. اما حالا احساس شکست کامل می‌کنم. من باید روی پروژه جانبی‌ام کار می‌کردم. استعدادهایم را تلف می‌کنم.",
      duration: 6500,
    }
  ],
  Spanish: [
    {
      label: "Ansiedad Laboral",
      transcript: "Mi jefe fue muy breve hoy en su correo y no incluyó ningún saludo cordial. Estoy totalmente paralizado, pensando que hice un pésimo trabajo y que se están preparando para despedirme.",
      duration: 6000,
    },
    {
      label: "Inseguridad de Pareja",
      transcript: "Mi pareja no ha respondido mis mensajes desde la mañana. Siento un nudo en el estómago. Estoy convencido de que se está aburriendo de mí y que planea terminar la relación.",
      duration: 5500,
    },
    {
      label: "Culpa de Productividad",
      transcript: "Pasé todo el domingo descansando y viendo películas porque estaba exhausto. Pero ahora me siento como un fracaso total. Debería haber estado trabajando en mi proyecto.",
      duration: 6500,
    }
  ],
  French: [
    {
      label: "Anxiété Professionnelle",
      transcript: "Mon manager a été très bref dans son email aujourd'hui sans aucune formule amicale. Je stresse totalement, je pense que j'ai fait un mauvais travail et qu'ils préparent mon licenciement.",
      duration: 6000,
    },
    {
      label: "Insécurité Affective",
      transcript: "Mon partenaire n'a pas répondu à mes messages depuis ce matin. J'ai un nœud à l'estomac. Je suis persuadé qu'il s'ennuie avec moi et qu'il va me quitter.",
      duration: 5500,
    },
    {
      label: "Culpabilité et Repos",
      transcript: "J'ai passé tout le dimanche à me reposer et regarder des films car j'étais épuisé. Mais maintenant je culpabilise. Je devrais travailler sur mes projets personnels.",
      duration: 6500,
    }
  ],
  German: [
    {
      label: "Berufliche Angst",
      transcript: "Mein Chef hat mir heute extrem kurz geantwortet, ohne freundliche Grüße. Ich mache mir riesige Sorgen, dass mein Bericht schlecht war und er mich kündigen will.",
      duration: 6000,
    },
    {
      label: "Beziehungs-Unsicherheit",
      transcript: "Mein Partner hat seit heute Morgen nicht geantwortet. Ich habe ein mulmiges Gefühl und denke, dass er das Interesse verloren hat und sich trennen will.",
      duration: 5500,
    },
    {
      label: "Produktivitäts-Schuld",
      transcript: "Ich habe den ganzen Sonntag nur ausgeruht, weil ich erschöpft war. Aber jetzt fühle ich mich schlecht. Ich hätte an meinen Projekten arbeiten sollen.",
      duration: 6500,
    }
  ]
};

const LOCALIZED_TEMPLATES: Record<string, { situation: string; thoughts: string; feelings: string; freeform: string }> = {
  English: {
    situation: "I had a conversation with my brother and he criticized my career progress, saying I should be more settled by now.",
    thoughts: "He's right, I'm behind everyone else my age. I've wasted my 20s and I'll never build a successful career or be financially secure.",
    feelings: "Insecure, deep shame, anxiety, and frustration.",
    freeform: "I am feeling extremely overwhelmed tonight. My friend cancelled our dinner plans last minute, and my immediate reaction was that they must find me boring and don't really want to spend time with me. Now I can't focus on anything and feel like isolating myself."
  },
  Persian: {
    situation: "با برادرم صحبت کردم و او از پیشرفت شغلی من انتقاد کرد و گفت باید تا الان مستقل‌تر و مستقرتر می‌شدم.",
    thoughts: "حق با اوست، من از بقیه هم‌سن‌هایم عقب هستم. دهه ۲۰ زندگی‌ام را هدر دادم و هرگز نمی‌توانم شغل موفقی بسازم یا امنیت مالی داشته باشم.",
    feelings: "ناامنی، شرم عمیق، اضطراب و ناامیدی.",
    freeform: "امشب احساس غرق‌شدگی شدیدی دارم. دوستم برنامه شام ما را در آخرین لحظه لغو کرد و اولین واکنش من این بود که حتماً من برایش خسته‌کننده هستم و دوست ندارد وقتش را با من بگذراند. حالا نمی‌توانم روی هیچ چیز تمرکز کنم و می‌خواهم خودم را منزوی کنم."
  },
  Spanish: {
    situation: "Tuve una conversación con mi hermano y criticó mi progreso laboral, diciendo que ya debería estar más estable.",
    thoughts: "Tiene razón, estoy atrasado con respecto a los demás de mi edad. Desperdicié mis 20 años y nunca construiré una carrera exitosa o segura.",
    feelings: "Inseguro, profunda vergüenza, ansiedad y frustración.",
    freeform: "Me siento extremadamente abrumado esta noche. Mi amigo canceló nuestros planes de cena a último minuto y mi reacción inmediata fue pensar que le aburro y no quiere pasar tiempo conmigo."
  },
  French: {
    situation: "J'ai eu une discussion avec mon frère et il a critiqué mes progrès professionnels, disant que je devrais être plus stable à mon âge.",
    thoughts: "Il a raison, je suis en retard par rapport à tout le monde. J'ai gâché ma vingtaine et je ne réussirai jamais professionnellement.",
    feelings: "Insécurité, honte profonde, anxiété et frustration.",
    freeform: "Je me sens extrêmement submergé ce soir. Mon ami a annulé nos plans à la dernière minute et ma réaction immédiate a été de penser que je l'ennuie."
  },
  German: {
    situation: "Ich hatte ein Gespräch mit meinem Bruder und er kritisierte meinen beruflichen Fortschritt.",
    thoughts: "Er hat recht, ich hinke allen in meinem Alter hinterher. Ich habe meine 20er verschwendet.",
    feelings: "Unsicher, tiefe Scham, Angst und Frustration.",
    freeform: "Ich fühle mich heute Abend extrem überfordert. Mein Freund hat unsere Pläne in letzter Minute abgesagt."
  }
};

export default function Dashboard({ onAnalyze, isLoading, error, translations, language }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"freeform" | "structured" | "voice">("freeform");

  // Freeform text entry
  const [freeformText, setFreeformText] = useState("");

  // Structured CBT fields
  const [situation, setSituation] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [feelings, setFeelings] = useState("");

  // Voice journal states
  const [voiceText, setVoiceText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("Idle");
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(24).fill(4));
  
  const speechRecognitionRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  const activePresets = VOICE_PRESETS[language] || VOICE_PRESETS["English"];
  const activeTemplate = LOCALIZED_TEMPLATES[language] || LOCALIZED_TEMPLATES["English"];

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      
      // Map language name to speech recognition locales
      const localeMap: Record<string, string> = {
        English: "en-US",
        Persian: "fa-IR",
        Spanish: "es-ES",
        French: "fr-FR",
        German: "de-DE"
      };
      rec.lang = localeMap[language] || "en-US";

      rec.onstart = () => {
        setRecordingStatus(language === "Persian" ? "در حال گوش دادن به صدا..." : "Listening to voice...");
      };

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setVoiceText((prev) => prev + " " + finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === "not-allowed") {
          setRecordingStatus(language === "Persian" ? "دسترسی میکروفون مسدود است" : "Microphone blocked. Use preset simulations below!");
        } else {
          setRecordingStatus(`Error: ${event.error}`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        if (!isRecording) {
          setRecordingStatus("Stopped");
        }
      };

      speechRecognitionRef.current = rec;
    }
  }, [language, isRecording]);

  // Handle active audio wave animations
  useEffect(() => {
    if (isRecording) {
      const animateWave = () => {
        setWaveformBars(() =>
          Array(24)
            .fill(0)
            .map(() => Math.floor(Math.random() * 28) + 4)
        );
        animationFrameRef.current = requestAnimationFrame(animateWave);
      };
      animateWave();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setWaveformBars(Array(24).fill(4));
    }
  }, [isRecording]);

  // Real Mic Recording handler
  const toggleRealRecording = () => {
    if (!speechRecognitionRef.current) {
      setRecordingStatus("Speech API not supported. Try the simulation presets!");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      try {
        speechRecognitionRef.current.stop();
      } catch (e) { }
    } else {
      setIsRecording(true);
      setVoiceText("");
      setRecordingStatus("Accessing microphone...");
      try {
        speechRecognitionRef.current.start();
      } catch (err) {
        console.error("Start speech recognition failed", err);
        setRecordingStatus("Mic access failed inside Frame.");
        setIsRecording(false);
      }
    }
  };

  // Preset Voice Simulator
  const simulateVoicePreset = (preset: { label: string; transcript: string; duration: number }) => {
    if (isRecording) return;
    
    setIsRecording(true);
    setVoiceText("");
    setRecordingStatus(language === "Persian" ? "در حال تایپ خودکار شبیه‌ساز صدا..." : "Streaming preset vocal recording...");

    let currentLength = 0;
    const fullText = preset.transcript;
    const intervalTime = preset.duration / fullText.length;

    const timer = setInterval(() => {
      currentLength += 2; 
      if (currentLength >= fullText.length) {
        setVoiceText(fullText);
        clearInterval(timer);
        setIsRecording(false);
        setRecordingStatus(language === "Persian" ? "شبیه‌سازی کامل شد." : "Vocal preset fully transcribed.");
      } else {
        setVoiceText(fullText.slice(0, currentLength));
      }
    }, intervalTime * 2);
  };

  // Submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (activeTab === "freeform") {
      if (!freeformText.trim()) return;
      onAnalyze({
        inputType: "freeform",
        textContent: freeformText,
      });
    } else if (activeTab === "structured") {
      if (!situation.trim() || !thoughts.trim() || !feelings.trim()) return;
      onAnalyze({
        inputType: "structured",
        situation,
        thoughts,
        feelings,
      });
    } else {
      if (!voiceText.trim()) return;
      onAnalyze({
        inputType: "freeform",
        textContent: voiceText,
      });
    }
  };

  // Populate helper templates to kickstart journaling
  const loadCbtTemplate = () => {
    setSituation(activeTemplate.situation);
    setThoughts(activeTemplate.thoughts);
    setFeelings(activeTemplate.feelings);
    setActiveTab("structured");
  };

  const loadFreeformTemplate = () => {
    setFreeformText(activeTemplate.freeform);
    setActiveTab("freeform");
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" id="dashboard-workspace">
      {/* Tab selection */}
      <div className="flex border-b border-white/5 p-1 bg-black/40 rounded-xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("freeform")}
          className={`flex-1 py-2 text-xs font-display font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "freeform"
              ? "bg-[#66023C]/20 text-[#ffebf3] border border-[#8B0053]/20 shadow-[0_2px_8px_rgba(139,0,83,0.15)]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{translations.freeJournalTab}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("structured")}
          className={`flex-1 py-2 text-xs font-display font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "structured"
              ? "bg-[#66023C]/20 text-[#ffebf3] border border-[#8B0053]/20 shadow-[0_2px_8px_rgba(139,0,83,0.15)]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{translations.cbtAnalyzerTab}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("voice")}
          className={`flex-1 py-2 text-xs font-display font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "voice"
              ? "bg-[#66023C]/20 text-[#ffebf3] border border-[#8B0053]/20 shadow-[0_2px_8px_rgba(139,0,83,0.15)]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>{translations.voiceJournalTab || "Voice Journal"}</span>
        </button>
      </div>

      {/* Main interactive form */}
      <form onSubmit={handleSubmit} className="space-y-6" id="journal-input-form">
        <div className="glass-panel-heavy rounded-2xl p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Form Header */}
          <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B0053] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8B0053]"></span>
              </span>
              <h2 className="text-sm font-display font-semibold text-gray-200">
                {activeTab === "freeform" && (language === "Persian" ? "جریان خام افکار خود را جاری کنید" : "Pour Out Your Unfiltered Thoughts")}
                {activeTab === "structured" && (language === "Persian" ? "تحلیل شناختی ساختاریافته (مدل ABC)" : "Structured Cognitive Analysis (ABC Model)")}
                {activeTab === "voice" && (language === "Persian" ? "ثبت یادداشت صوتی خود" : "Dictate or Stream Your Voice Note")}
              </h2>
            </div>

            <button
              type="button"
              onClick={activeTab === "structured" ? loadCbtTemplate : loadFreeformTemplate}
              className="text-[11px] font-mono text-[#8B0053] hover:text-[#8B0053]/80 flex items-center gap-1.5 border border-[#8B0053]/20 px-2.5 py-1.5 rounded-lg bg-[#8B0053]/5 hover:bg-[#8B0053]/10 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>{translations.loadSampleButton}</span>
            </button>
          </div>

          {/* Render inputs based on tab */}
          <AnimatePresence mode="wait">
            {activeTab === "freeform" && (
              <motion.div
                key="freeform-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <label className="block text-xs font-mono text-gray-400 mb-1">
                  {language === "Persian" ? "ثبت یادداشت" : "LOG AN ENTRY"}
                </label>
                <textarea
                  id="textarea-freeform"
                  placeholder={translations.writeFreelyPlaceholder}
                  value={freeformText}
                  onChange={(e) => setFreeformText(e.target.value)}
                  className="w-full min-h-[160px] p-4 text-sm rounded-xl glass-input text-gray-200 placeholder-gray-600 resize-y leading-relaxed font-sans"
                />
              </motion.div>
            )}

            {activeTab === "structured" && (
              <motion.div
                key="structured-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                    {translations.situationLabel}
                  </label>
                  <textarea
                    id="input-situation"
                    placeholder={translations.situationPlaceholder}
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    className="w-full min-h-[60px] p-3 text-sm rounded-xl glass-input text-gray-200 placeholder-gray-600 resize-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                    {translations.thoughtsLabel}
                  </label>
                  <textarea
                    id="input-thoughts"
                    placeholder={translations.thoughtsPlaceholder}
                    value={thoughts}
                    onChange={(e) => setThoughts(e.target.value)}
                    className="w-full min-h-[60px] p-3 text-sm rounded-xl glass-input text-gray-200 placeholder-gray-600 resize-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                    {translations.feelingsLabel}
                  </label>
                  <textarea
                    id="input-feelings"
                    placeholder={translations.feelingsPlaceholder}
                    value={feelings}
                    onChange={(e) => setFeelings(e.target.value)}
                    className="w-full min-h-[60px] p-3 text-sm rounded-xl glass-input text-gray-200 placeholder-gray-600 resize-none font-sans"
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "voice" && (
              <motion.div
                key="voice-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Voice recording cockpit */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-white/5 bg-zinc-950/40 relative overflow-hidden">
                  
                  {/* Pulse waveform visualizer */}
                  <div className="h-12 flex items-center justify-center gap-1.5 mb-6 w-full max-w-md">
                    {waveformBars.map((height, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-[#8B0053]/80 rounded-full"
                        style={{ height: `${height}px` }}
                        animate={isRecording ? { height: `${height}px` } : { height: "4px" }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Recording Button */}
                    <button
                      type="button"
                      onClick={toggleRealRecording}
                      id="btn-voice-record"
                      className={`h-14 w-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative ${
                        isRecording
                          ? "bg-[#8B0053] shadow-[0_0_20px_rgba(139,0,83,0.5)] scale-95"
                          : "bg-zinc-900 border border-white/10 hover:border-[#8B0053]/50 text-[#8B0053] hover:bg-zinc-800"
                      }`}
                    >
                      {isRecording ? (
                        <span className="w-4 h-4 bg-white rounded-xs animate-pulse" />
                      ) : (
                        <Mic className="w-6 h-6 text-[#8B0053]" />
                      )}
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-gray-400 mt-4 tracking-wider uppercase">
                    {recordingStatus}
                  </span>
                </div>

                {/* Transcribed text window */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-[#8B0053]" />
                    <span>{language === "Persian" ? "متن یادداشت صوتی" : "TRANSCRIBED VOCAL LOG"}</span>
                  </label>
                  <textarea
                    id="textarea-voice"
                    placeholder={language === "Persian" ? "میکروفون را برای ضبط بزنید یا از دکمه‌های شبیه‌ساز سناریوهای زیر استفاده کنید..." : "Click the microphone to record your thoughts, or select one of our structured CBT scenarios below to watch the Voice dictation simulator in action!"}
                    value={voiceText}
                    onChange={(e) => setVoiceText(e.target.value)}
                    className="w-full min-h-[100px] p-4 text-sm rounded-xl glass-input text-gray-200 placeholder-gray-600 resize-y leading-relaxed font-sans"
                  />
                </div>

                {/* Simulated vocal preset selection */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                    {language === "Persian" ? "سناریوهای شبیه‌سازی صوتی" : "Vocal Simulation Scenarios (Highly Recommended)"}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {activePresets.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        id={`btn-preset-${index}`}
                        onClick={() => simulateVoicePreset(preset)}
                        disabled={isRecording}
                        className="text-left p-2.5 rounded-lg border border-white/5 bg-zinc-950/20 hover:bg-zinc-900/40 hover:border-[#8B0053]/30 transition-all text-xs flex flex-col justify-between gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <span className="font-display font-medium text-gray-300 flex items-center gap-1.5">
                          <Play className="w-3 h-3 text-[#8B0053]" /> {preset.label}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1 italic">
                          {preset.transcript}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Validation Alert */}
          {error && (
            <div className="mt-4 p-3 rounded-lg border border-red-900/30 bg-red-950/15 flex items-center gap-2.5 text-xs text-red-200 animate-fadeIn" id="analysis-error-banner">
              <AlertCircle className="w-4 h-4 text-[#8B0053] shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Big Action Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            id="btn-analyze-mind"
            disabled={
              isLoading ||
              (activeTab === "freeform" && !freeformText.trim()) ||
              (activeTab === "structured" && (!situation.trim() || !thoughts.trim() || !feelings.trim())) ||
              (activeTab === "voice" && !voiceText.trim())
            }
            className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#4A002C] via-[#66023C] to-[#8B0053] text-white font-medium hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 text-sm cursor-pointer shadow-[0_4px_20px_rgba(139,0,83,0.3)]"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{translations.deconstructingMind}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4.5 h-4.5 text-white" />
                <span>{translations.deconstructButton}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Introductory Companion Tip Card */}
      <div className="rounded-xl border border-white/5 bg-zinc-950/20 p-4 flex gap-3 text-xs leading-relaxed text-gray-400" id="intro-tip-card">
        <Info className="w-5 h-5 text-[#8B0053] shrink-0" />
        <div>
          <span className="font-display font-medium text-gray-200 block mb-0.5">{translations.howItWorksTitle}</span>
          {translations.howItWorksDesc}
        </div>
      </div>
    </div>
  );
}
