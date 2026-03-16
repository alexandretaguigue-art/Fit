// DESIGN: "Coach Nocturne" — Page Conseils
// Conseils avancés + Chat IA (nutrition / sport) selon contexte

import { useState, useRef, useEffect } from 'react';
import { advancedTips, programData } from '../lib/programData';
import { Moon, Droplets, Pill, Brain, ChevronDown, ChevronUp, Calendar, MessageCircle, Send, Dumbbell, Utensils, RefreshCw, Sparkles } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAgent, type ChatMessage } from '../hooks/useAgent';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import { toLocalDateKey } from '../lib/nutritionEngine';
import { toast } from 'sonner';

const tipCategories = [
  {
    key: 'sleep',
    label: 'Sommeil',
    icon: Moon,
    color: '#a855f7',
    description: 'Le muscle grandit pendant le repos, pas pendant l\'entraînement.',
    tips: advancedTips.sleep,
  },
  {
    key: 'hydration',
    label: 'Hydratation',
    icon: Droplets,
    color: '#3b82f6',
    description: 'La déshydratation réduit les performances de 10-20%.',
    tips: advancedTips.hydration,
  },
  {
    key: 'supplements',
    label: 'Suppléments',
    icon: Pill,
    color: '#22c55e',
    description: 'Seulement 4 suppléments ont des preuves solides d\'efficacité.',
    tips: advancedTips.supplements,
  },
  {
    key: 'mindset',
    label: 'Mentalité',
    icon: Brain,
    color: '#FF6B35',
    description: 'La cohérence sur 3 mois vaut mieux que 3 semaines parfaites.',
    tips: advancedTips.mindset,
  },
  {
    key: 'recovery',
    label: 'Récupération',
    icon: Moon,
    color: '#eab308',
    description: 'Optimiser la récupération pour maximiser les gains.',
    tips: advancedTips.recovery,
  },
];

const phaseDetails = [
  {
    phase: programData.phases[0],
    details: [
      "Semaines 1-2 : Commence à 60-70% de ta charge maximale estimée. L'objectif est d'apprendre les mouvements, pas de te détruire.",
      "Semaines 3-4 : Augmente progressivement jusqu'à 75-80% de ta charge max. Tu devrais commencer à sentir les exercices.",
      "Fin de phase : Tu dois avoir établi tes charges de base sur tous les exercices. Note-les soigneusement.",
    ],
    keyMetric: "Maîtrise technique sur 8 exercices fondamentaux",
  },
  {
    phase: programData.phases[1],
    details: [
      "Semaines 5-6 : Augmente le volume (+1 série sur les exercices principaux). Charges à 80-85% du max.",
      "Semaines 7-8 : Intensité maximale de la phase. Chaque séance doit être légèrement plus difficile que la précédente.",
      "Fin de phase : Tu devrais avoir augmenté tes charges de 10-20% sur les exercices principaux.",
    ],
    keyMetric: "+10-20% de charge sur squat, développé couché, tractions",
  },
  {
    phase: programData.phases[2],
    details: [
      "Semaines 9-11 : Introduction des drop sets (après la dernière série, réduis la charge de 30% et continue jusqu'à l'échec).",
      "Semaine 12 : DÉCHARGE OBLIGATOIRE. Réduis le volume de 40% (moins de séries) mais garde l'intensité. Ton corps a besoin de récupérer pour la super-compensation.",
      "Après la semaine 12 : Prends 1 semaine de repos complet, puis recommence avec un nouveau programme.",
    ],
    keyMetric: "Super-compensation en semaine 12 — gains visibles",
  },
];

// ============================================================
// CHAT IA
// ============================================================

type ChatMode = 'nutrition' | 'sport';

function AiCoachChat() {
  const { profile, aiNutritionPlan } = useUserProfile();
  const { chatNutrition, chatSport } = useAgent();
  const { data } = useFitnessTracker();
  const [mode, setMode] = useState<ChatMode>('nutrition');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const defaultTargets = { kcal: 2500, pro: 180, glu: 280, lip: 70 };
  const targets = aiNutritionPlan?.targets ?? defaultTargets;

  // Calcul des macros consommées aujourd'hui
  const todayKey = toLocalDateKey(new Date());
  const todayLog = data.nutritionLogs[todayKey];
  const consumed = todayLog
    ? todayLog.entries.reduce(
        (acc, e) => ({ kcal: acc.kcal + e.calories, pro: acc.pro + e.proteins, glu: acc.glu + e.carbs, lip: acc.lip + e.fats }),
        { kcal: 0, pro: 0, glu: 0, lip: 0 }
      )
    : { kcal: 0, pro: 0, glu: 0, lip: 0 };

  const remainingMeals = `${Math.round(targets.kcal - consumed.kcal)} kcal restantes`;

  const send = async () => {
    if (!input.trim() || loading) return;
    if (!profile) {
      toast.error('Configure ton profil dans l\'onglet Nutrition d\'abord');
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      let reply: string;
      if (mode === 'nutrition') {
        const res = await chatNutrition.mutateAsync({
          profile,
          targets,
          consumed,
          remainingMeals,
          history: messages,
          message: input.trim(),
        });
        reply = res.reply;
      } else {
        const res = await chatSport.mutateAsync({
          profile,
          history: messages,
          message: input.trim(),
        });
        reply = res.reply;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      toast.error('Erreur coach IA : ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => setMessages([]);

  const quickQuestions = mode === 'nutrition'
    ? ['Que manger ce soir ?', 'Suis-je en déficit ?', 'Idée de snack riche en protéines']
    : ['Comment progresser sur le squat ?', 'Récupération après séance intense', 'Exercices pour les jambes'];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: 400 }}>
      {/* Mode switcher */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMode('nutrition')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: mode === 'nutrition' ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.04)',
            border: mode === 'nutrition' ? 'none' : '1px solid rgba(255,255,255,0.08)',
            color: mode === 'nutrition' ? 'white' : 'rgba(255,255,255,0.4)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Utensils size={12} /> Nutritionniste
        </button>
        <button
          onClick={() => setMode('sport')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: mode === 'sport' ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.04)',
            border: mode === 'sport' ? 'none' : '1px solid rgba(255,255,255,0.08)',
            color: mode === 'sport' ? 'white' : 'rgba(255,255,255,0.4)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Dumbbell size={12} /> Coach Sport
        </button>
      </div>

      {/* Context pill */}
      {profile && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Sparkles size={12} style={{ color: '#FF6B35' }} />
          <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            {profile.name} · {profile.weight}kg · {mode === 'nutrition' ? `${Math.round(consumed.kcal)}/${targets.kcal} kcal` : profile.level}
          </span>
          {messages.length > 0 && (
            <button onClick={clearChat} className="ml-auto text-white/30 hover:text-white/60">
              <RefreshCw size={12} />
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)' }}>
              <MessageCircle size={20} className="text-white" />
            </div>
            <p className="text-white/50 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              {mode === 'nutrition' ? 'Ton nutritionniste IA' : 'Ton coach sport IA'}
            </p>
            <div className="space-y-2">
              {quickQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="block w-full text-left px-3 py-2 rounded-xl text-xs"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
              style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.06)',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '18px 18px 18px 4px' }}>
              <RefreshCw size={14} className="animate-spin text-white/40" />
              <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>En train de réfléchir…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'nutrition' ? 'Demande à ton nutritionniste…' : 'Demande à ton coach…'}
          className="flex-1 px-4 py-3 rounded-2xl text-sm text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif' }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)' }}
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

type TipsTab = 'chat' | 'conseils';

export default function TipsPage() {
  const [activeTab, setActiveTab] = useState<TipsTab>('chat');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('sleep');
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      <div className="p-5">
        <h1 className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
          Conseils
        </h1>
        <p className="text-white/50 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          Coach IA · Conseils avancés
        </p>

        {/* Onglets */}
        <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {([
            { id: 'chat' as TipsTab, label: 'Coach IA', icon: MessageCircle },
            { id: 'conseils' as TipsTab, label: 'Conseils', icon: Brain },
          ]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: activeTab === id ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'transparent',
                color: activeTab === id ? 'white' : 'rgba(255,255,255,0.4)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Icon size={12} />{label}
            </button>
          ))}
        </div>

        {/* Chat IA */}
        {activeTab === 'chat' && <AiCoachChat />}

        {/* Conseils statiques */}
        {activeTab === 'conseils' && (
          <>
            {/* Règle des 3 piliers */}
            <div
              className="rounded-2xl p-4 mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.08), rgba(255, 51, 102, 0.08))',
                border: '1px solid rgba(255, 107, 53, 0.2)',
              }}
            >
              <h2 className="text-white font-bold text-base mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
                La règle des 3 piliers
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🏋️', label: 'Entraînement', value: '33%', color: '#FF6B35' },
                  { icon: '🍽️', label: 'Nutrition', value: '33%', color: '#FF3366' },
                  { icon: '😴', label: 'Récupération', value: '33%', color: '#a855f7' },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="font-bold text-sm" style={{ color, fontFamily: 'Syne, sans-serif' }}>{value}</div>
                    <div className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Catégories de conseils */}
            <div className="space-y-3 mb-6">
              {tipCategories.map(({ key, label, icon: Icon, color, description, tips }) => (
                <div key={key} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    className="w-full flex items-center gap-3 p-4"
                    onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{label}</p>
                      <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{description}</p>
                    </div>
                    {expandedCategory === key ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                  </button>
                  {expandedCategory === key && (
                    <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="pt-3 space-y-2.5">
                        {tips.map((tip: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: color }} />
                            <p className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Phases du programme */}
            <div className="mb-6">
              <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                <Calendar size={16} style={{ color: '#FF6B35' }} /> Phases du programme
              </h2>
              <div className="space-y-3">
                {phaseDetails.map(({ phase, details, keyMetric }) => (
                  <div key={phase.id} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      className="w-full flex items-center gap-3 p-4"
                      onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${phase.color}20` }}>
                        <span className="font-bold text-sm" style={{ color: phase.color, fontFamily: 'Syne, sans-serif' }}>P{phase.id.slice(-1)}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{phase.name}</p>
                        <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{phase.weeks}</p>
                      </div>
                      {expandedPhase === phase.id ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                    </button>
                    {expandedPhase === phase.id && (
                      <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="pt-3 space-y-2.5">
                          {details.map((detail, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: phase.color }} />
                              <p className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{detail}</p>
                            </div>
                          ))}
                          <div className="mt-3 p-3 rounded-xl" style={{ background: `${phase.color}10`, border: `1px solid ${phase.color}25` }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: phase.color, fontFamily: 'Inter, sans-serif' }}>Métrique clé de la phase</p>
                            <p className="text-white/70 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{keyMetric}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Erreurs à éviter */}
            <div className="mt-6 rounded-2xl p-4" style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h3 className="text-red-400 font-bold text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
                Les 5 erreurs qui sabotent les résultats
              </h3>
              <div className="space-y-2">
                {[
                  "Changer de programme toutes les 2 semaines — la progression prend du temps.",
                  "Sauter des repas ou manger insuffisamment de protéines.",
                  "Négliger le sommeil (moins de 7h/nuit = -30% de récupération).",
                  "Augmenter les charges trop vite au détriment de la technique.",
                  "Faire du cardio excessif qui ronge les gains musculaires.",
                ].map((error, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-red-400 text-xs flex-shrink-0 mt-0.5">✗</span>
                    <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
