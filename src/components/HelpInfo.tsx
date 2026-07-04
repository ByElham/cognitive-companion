import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UiTranslations } from "../types";

interface DistortionItem {
  name: string;
  definition: string;
  example: string;
  reframe: string;
}

interface HelpInfoProps {
  language: string;
  translations: UiTranslations;
}

const LOCALIZED_DISTORTIONS: Record<string, DistortionItem[]> = {
  English: [
    {
      name: "Catastrophizing (Magnifying)",
      definition: "Expecting the worst-case scenario to happen, regardless of how unlikely it actually is, and believing you won't be able to cope.",
      example: "If I make one mistake during this presentation, my entire career will be ruined and I will never find another job.",
      reframe: "Even if I make a minor mistake, people rarely judge an entire career on one slide. I can prepare well and handle any small slip-ups."
    },
    {
      name: "All-or-Nothing Thinking",
      definition: "Viewing things in black-and-white categories. If a situation falls short of perfect, you see it as a total failure.",
      example: "I didn't stick to my diet perfectly today, so I've completely blown it. I might as well eat whatever I want.",
      reframe: "Eating one unplanned snack isn't a total failure. I've eaten healthy meals most of the day, and I can choose to get right back on track."
    },
    {
      name: "Mind Reading",
      definition: "Arbitrarily concluding that someone is reacting negatively to you, without bothering to check it out or have concrete proof.",
      example: "My colleague was quiet in the meeting today. I know they must be angry with me about my proposal.",
      reframe: "They might just be tired, stressed about their own work, or distracted. Unless they say something, I don't need to assume it's about me."
    },
    {
      name: "Emotional Reasoning",
      definition: "Assuming that your negative emotions necessarily reflect the way things really are: 'I feel it, therefore it must be true.'",
      example: "I feel incredibly inadequate and stupid, so I must be bad at my job.",
      reframe: "Feelings are real reactions to thoughts, but they aren't objective facts. I can feel anxious while still being fully competent."
    },
    {
      name: "Should & Must Statements",
      definition: "Trying to motivate yourself or others with 'shoulds' and 'shouldn'ts'. This often leads to guilt, frustration, and resentment.",
      example: "I should always be productive. I must never feel tired or need a break.",
      reframe: "It's natural to need rest. Taking a break is healthy and will help me regain focus. I prefer to work productively, but I can't be a machine."
    }
  ],
  Persian: [
    {
      name: "فاجعه‌سازی (بزرگ‌نمایی)",
      definition: "انتظار رخ دادن بدترین سناریوی ممکن، بدون توجه به میزان واقعی احتمال آن، و این باور که شما قادر به مقابله نخواهید بود.",
      example: "اگر یک اشتباه در این ارائه انجام دهم، کل آینده شغلی‌ام نابود خواهد شد و هرگز شغل دیگری پیدا نخواهم کرد.",
      reframe: "حتی اگر یک اشتباه کوچک مرتکب شوم، مردم به ندرت کل یک مسیر شغلی را بر اساس یک ارائه قضاوت می‌کنند. می‌توانم به خوبی آماده شوم."
    },
    {
      name: "تفکر همه یا هیچ (سیاه و سفید)",
      definition: "دیدن مسائل در دسته‌بندی‌های مطلق سیاه و سفید. اگر یک موقعیت تا حد کمال پیش نرود، آن را شکست کامل می‌دانید.",
      example: "امروز رژیم غذایی‌ام را کاملاً رعایت نکردم، پس همه چیز خراب شد. بهتر است هر چه می‌خواهم بخورم.",
      reframe: "خوردن یک میان‌وعده برنامه‌ریزی‌نشده به معنای شکست کامل نیست. من در بیشتر روز سالم غذا خورده‌ام و می‌توانم دوباره به مسیر برگردم."
    },
    {
      name: "ذهن‌خوانی",
      definition: "نتیجه‌گیری خودسرانه مبنی بر اینکه کسی واکنش منفی به شما نشان می‌دهد، بدون اینکه آن را بررسی کنید یا مدرک مشخصی داشته باشید.",
      example: "همکارم امروز در جلسه ساکت بود. می‌دانم حتماً بابت پیشنهاد من از دستم عصبانی است.",
      reframe: "او ممکن است فقط خسته، نگران کارهای خودش یا حواس‌پرت باشد. تا زمانی که چیزی نگفته، نیازی نیست فرض کنم درباره من است."
    },
    {
      name: "استدلال احساسی",
      definition: "فرض بر اینکه احساسات منفی شما لزوماً واقعیت امور را منعکس می‌کنند: 'من چنین احساسی دارم، پس حتماً درست است.'",
      example: "احساس می‌کنم فوق‌العاده بی‌کفایت و نادان هستم، پس حتماً در کارم ضعیف و بد هستم.",
      reframe: "احساسات واکنش‌هایی به افکار ما هستند، اما واقعیت‌های عینی نیستند. من می‌توانم احساس اضطراب کنم در حالی که کاملاً توانمندم."
    },
    {
      name: "بایدهای تحمیلی (بایدها و نبایدها)",
      definition: "تلاش برای ایجاد انگیزه در خود یا دیگران با استفاده از کلمات 'باید' و 'نباید'. این کار اغلب منجر به گناه، سرخوردگی و رنجش می‌شود.",
      example: "من باید همیشه سازنده باشم. من هرگز نباید احساس خستگی کنم یا نیاز به استراحت داشته باشم.",
      reframe: "نیاز به استراحت کاملاً طبیعی است. وقفه کوتاه به من کمک می‌کند تمرکزم را بازیابم. ترجیح می‌دهم سازنده باشم، اما ماشین نیستم."
    }
  ],
  Spanish: [
    {
      name: "Catastrofismo (Magnificación)",
      definition: "Esperar el peor de los casos, independientemente de lo improbable que sea, y creer que no podrás afrontarlo.",
      example: "Si cometo un error en esta presentación, mi carrera se arruinará y nunca encontraré otro trabajo.",
      reframe: "Incluso si cometo un pequeño error, rara vez se juzga toda una carrera por una diapositiva. Puedo prepararme bien."
    },
    {
      name: "Pensamiento de Todo o Nada",
      definition: "Ver las cosas en categorías de blanco o negro. Si una situación no es perfecta, se ve como un fracaso total.",
      example: "No seguí mi dieta a la perfección hoy, así que la arruiné por completo. Debería comer lo que quiera.",
      reframe: "Comer un bocadillo no planeado no es un fracaso absoluto. He comido sano la mayor parte del día y puedo retomar el camino."
    },
    {
      name: "Lectura de Pensamiento",
      definition: "Concluir arbitrariamente que alguien está reaccionando negativamente hacia ti, sin tener pruebas concretas.",
      example: "Mi colega estuvo callado en la reunión de hoy. Sé que debe estar enojado conmigo por mi propuesta.",
      reframe: "Podría estar cansado, estresado por su propio trabajo o distraído. No tengo que asumir que se trata de mí."
    },
    {
      name: "Razonamiento Emocional",
      definition: "Asumir que tus emociones negativas reflejan cómo son las cosas en realidad: 'Lo siento, por lo tanto debe ser verdad.'",
      example: "Me siento increíblemente inadecuado y tonto, por lo tanto debo ser malo en mi trabajo.",
      reframe: "Las emociones son reales pero no son hechos objetivos. Puedo sentirme ansioso y seguir siendo totalmente competente."
    },
    {
      name: "Declaraciones de 'Debería'",
      definition: "Tratar de motivarte a ti mismo o a otros con exigencias rígidas. Esto a menudo genera culpa y frustración.",
      example: "Siempre debería ser productivo. Nunca debería sentirme cansado o necesitar un descanso.",
      reframe: "Es natural necesitar descanso. Tomar un descanso es saludable y me ayudará a recuperar la concentración."
    }
  ],
  French: [
    {
      name: "Catastrophisme (Amplification)",
      definition: "S'attendre au pire scénario possible, peu importe sa faible probabilité, et croire que vous ne pourrez pas y faire face.",
      example: "Si je fais une erreur dans cette présentation, ma carrière sera ruinée et je ne retrouverai jamais de travail.",
      reframe: "Même si je fais une erreur, on juge rarement une carrière sur une diapositive. Je peux me préparer au mieux."
    },
    {
      name: "Pensée Tout-ou-Rien",
      definition: "Voir les choses de manière binaire (noir ou blanc). Si une situation n'est pas parfaite, elle est considérée comme un échec total.",
      example: "Je n'ai pas suivi mon régime aujourd'hui, donc c'est fichu. Je ferais mieux de manger tout ce que je veux.",
      reframe: "Un écart n'est pas un échec total. J'ai mangé sainement le reste de la journée et je peux reprendre mes bonnes habitudes."
    },
    {
      name: "Lecture de Pensées",
      definition: "Décider arbitrairement que quelqu'un réagit négativement à votre égard, sans vérifier ou en avoir la preuve.",
      example: "Mon collègue était silencieux en réunion aujourd'hui. Je sais qu'il m'en veut à cause de ma proposition.",
      reframe: "Il est peut-être fatigué, stressé par son propre travail ou distrait. Sans preuve, je n'ai pas à penser que c'est lié à moi."
    },
    {
      name: "Raisonnement Émotionnel",
      definition: "Présumer que vos émotions négatives reflètent la réalité : 'Je le ressens, donc cela doit être vrai.'",
      example: "Je me sens tellement incompétent et stupide, je dois donc être très mauvais dans mon travail.",
      reframe: "Les sentiments sont des réactions aux pensées, pas des faits. Je peux stresser tout en restant parfaitement compétent."
    },
    {
      name: "Formulations Rigides ('Je devrais')",
      definition: "Essayer de se motiver avec des 'je devrais' ou 'il faut'. Cela génère de la culpabilité, de la frustration et du ressentiment.",
      example: "Je devrais toujours être productif. Je ne devrais jamais être fatigué ni avoir besoin d'une pause.",
      reframe: "Il est naturel de se reposer. Faire une pause est sain et m'aidera à retrouver ma concentration."
    }
  ],
  German: [
    {
      name: "Katastrophisieren",
      definition: "Sich das schlimmstmögliche Szenario ausmalen und glauben, dass man es unmöglich bewältigen kann.",
      example: "Wenn ich bei dieser Präsentation einen Fehler mache, ist meine Karriere vorbei und ich finde nie wieder Arbeit.",
      reframe: "Auch bei einem kleinen Fehler wird selten eine ganze Karriere beurteilt. Ich bereite mich gut vor."
    },
    {
      name: "Alles-oder-Nichts-Denken",
      definition: "Dinge in Schwarz-Weiß-Kategorien sehen. Wenn eine Situation nicht perfekt ist, wird sie als totaler Fehlschlag gewertet.",
      example: "Ich habe meine Diät heute nicht perfekt eingehalten, also ist alles umsonst. Ich kann essen, was ich will.",
      reframe: "Ein kleiner Fehler ist kein Totalausfall. Ich habe mich den restlichen Tag gesund ernährt und mache einfach weiter."
    },
    {
      name: "Gedankenlesen",
      definition: "Willkürlich annehmen, dass jemand negativ auf einen reagiert, ohne Beweise dafür zu haben.",
      example: "Mein Kollege war heute im Meeting sehr ruhig. Er ist bestimmt wütend auf mich wegen meines Vorschlags.",
      reframe: "Er könnte müde, gestresst oder abgelenkt sein. Ich muss nicht annehmen, dass es an mir liegt."
    },
    {
      name: "Gefühlsbetontes Begründen",
      definition: "Annehmen, dass negative Gefühle die Realität widerspiegeln: 'Ich fühle es, also muss es wahr sein.'",
      example: "Ich fühle mich unfähig und dumm, also muss ich schlecht in meinem Job sein.",
      reframe: "Gefühle sind Reaktionen auf Gedanken, keine Fakten. Ich kann nervös sein und trotzdem kompetente Arbeit leisten."
    },
    {
      name: "Sollte-Vorschriften",
      definition: "Sich selbst oder andere mit starren Regeln motivieren wollen. Das führt oft zu Schuldgefühlen und Frust.",
      example: "Ich sollte immer produktiv sein. Ich darf nie müde sein oder eine Pause brauchen.",
      reframe: "Ruhepausen sind wichtig und gesund. Eine Pause hilft mir, meine Konzentration wiederzufinden."
    }
  ]
};

export default function HelpInfo({ language, translations }: HelpInfoProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const activeDistortions = LOCALIZED_DISTORTIONS[language] || LOCALIZED_DISTORTIONS["English"];

  return (
    <div className="w-full" id="distortion-library">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-purple-950/40 border border-[#8B0053]/20 text-[#8B0053]">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold text-white">{translations.distortionLibrary || "Cognitive Distortion Library"}</h2>
          <p className="text-xs text-gray-400">
            {language === "Persian" ? "هر یک از خطاهای شناختی را باز کنید تا یاد بگیرید ذهنتان چگونه شما را فریب می‌دهد." : "Expand each distortion to learn how your mind might play tricks on you."}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {activeDistortions.map((distortion, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              id={`distortion-item-${index}`}
              className="rounded-xl border transition-all duration-300"
              style={{
                borderColor: isOpen ? "rgba(139, 0, 83, 0.3)" : "rgba(255, 255, 255, 0.05)",
                background: isOpen ? "rgba(30, 2, 19, 0.4)" : "rgba(10, 10, 10, 0.3)",
              }}
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isOpen ? "bg-[#8B0053] animate-pulse" : "bg-gray-600"}`} />
                  <span className="font-display font-medium text-sm text-gray-200 hover:text-white transition-colors">
                    {distortion.name}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 border-t border-white/5 space-y-4 text-xs text-gray-300 leading-relaxed">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#8B0053] font-semibold block mb-1">
                          {language === "Persian" ? "تعریف" : "Definition"}
                        </span>
                        <p className="text-gray-300 bg-black/30 p-2.5 rounded-lg border border-white/5">
                          {distortion.definition}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-purple-950/10 p-3 rounded-lg border border-[#8B0053]/10">
                          <span className="text-[10px] uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5 mb-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> {language === "Persian" ? "خطای شناختی رایج" : "Typical Distortion"}
                          </span>
                          <p className="italic text-gray-400">
                            &ldquo;{distortion.example}&rdquo;
                          </p>
                        </div>

                        <div className="bg-emerald-950/10 p-3 rounded-lg border border-emerald-900/10">
                          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> {language === "Persian" ? "بازسازی شناختی منطقی" : "Rational Reframe"}
                          </span>
                          <p className="italic text-gray-300">
                            &ldquo;{distortion.reframe}&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
