// ============================================================
// TIPS PAGE — FitPro
// Coach IA (chat) + Conseils personnalisés basés sur le profil IA
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Moon, Droplets, Pill, Brain, ChevronDown, ChevronUp, MessageCircle, Send, Dumbbell, Utensils, RefreshCw, Sparkles, Target, Zap, Shield, Heart } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAgent, type ChatMessage } from '../hooks/useAgent';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import { toLocalDateKey } from '../lib/nutritionEngine';
import { toast } from 'sonner';

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
  }, [messages]);

  const buildContext = () => {
    const today = toLocalDateKey(new Date());
    const todayLog = data.nutritionLogs?.[today];
    const consumed = todayLog?.entries?.reduce(
      (acc: { calories: number; proteins: number }, e: { calories: number; proteins: number }) => ({ calories: acc.calories + e.calories, proteins: acc.proteins + e.proteins }),
      { calories: 0, proteins: 0 }
    ) ?? { calories: 0, proteins: 0 };

    return {
      profile: profile ?? undefined,
      currentDay: {
        date: today,
        sessionType: (data.scheduleOverrides?.[today] ?? 'training') as string,
        consumed,
      },
    };
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const ctx = buildContext();
      let reply: string;
      if (mode === 'nutrition') {
        const res = await chatNutrition.mutateAsync({
          profile: ctx.profile ?? { name: '', age: 25, sex: 'homme', weight: 75, height: 175, goal: 'maintien', activity: 'modere', sports: [], mealsPerDay: 3, level: 'intermediaire', sessionsPerWeek: 3 },
          targets: { kcal: (aiNutritionPlan?.targets as { kcal: number; pro: number; glu: number; lip: number } | undefined)?.kcal ?? 2500, pro: (aiNutritionPlan?.targets as { kcal: number; pro: number; glu: number; lip: number } | undefined)?.pro ?? 150, glu: (aiNutritionPlan?.targets as { kcal: number; pro: number; glu: number; lip: number } | undefined)?.glu ?? 300, lip: (aiNutritionPlan?.targets as { kcal: number; pro: number; glu: number; lip: number } | undefined)?.lip ?? 70 },
          consumed: { kcal: ctx.currentDay.consumed.calories, pro: ctx.currentDay.consumed.proteins, glu: 0, lip: 0 },
          remainingMeals: 'repas restants de la journée',
          history: messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          message: userMsg.content,
        });
        reply = (res as { reply: string }).reply;
      } else {
        const res = await chatSport.mutateAsync({
          profile: ctx.profile ?? { name: '', age: 25, sex: 'homme', weight: 75, height: 175, goal: 'maintien', activity: 'modere', sports: [], mealsPerDay: 3, level: 'intermediaire', sessionsPerWeek: 3 },
          currentSession: ctx.currentDay.sessionType,
          sessionLog: '',
          history: messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          message: userMsg.content,
        });
        reply = (res as { reply: string }).reply;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: unknown) {
      toast.error('Erreur : ' + (err instanceof Error ? err.message : 'Erreur'));
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const suggestions = mode === 'nutrition'
    ? ['Que manger avant l\'entraînement ?', 'Comment atteindre mes protéines ?', 'Repas rapide post-séance ?']
    : ['Comment progresser plus vite ?', 'Exercices pour les jambes ?', 'Comment éviter les blessures ?'];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: 400 }}>
      {/* Sélecteur de mode */}
      <div className="flex gap-2 mb-4">
        {([
          { id: 'nutrition' as ChatMode, label: 'Nutrition', icon: Utensils, color: '#FF6B35' },
          { id: 'sport' as ChatMode, label: 'Sport', icon: Dumbbell, color: '#3B82F6' },
        ]).map(({ id, label, icon: Icon, color }) => (
          <button key={id} onClick={() => setMode(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: mode === id ? `${color}20` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${mode === id ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
              color: mode === id ? color : 'rgba(255,255,255,0.4)',
              fontFamily: 'Inter, sans-serif',
            }}>
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)' }}>
              <Sparkles size={24} className="text-white" />
            </div>
            <p className="text-white font-bold text-sm mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
              Coach IA — {mode === 'nutrition' ? 'Nutrition' : 'Sport'}
            </p>
            <p className="text-white/40 text-xs mb-5" style={{ fontFamily: 'Inter, sans-serif' }}>
              {profile ? `Bonjour ${profile.name} ! Pose-moi ta question.` : 'Complète l\'onboarding pour des conseils personnalisés.'}
            </p>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed`}
              style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.07)',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '18px 18px 18px 4px' }}>
              <RefreshCw size={14} className="animate-spin text-white/50" />
              <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Claude réfléchit…</span>
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
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={`Message au coach ${mode === 'nutrition' ? 'nutrition' : 'sport'}…`}
          className="flex-1 px-4 py-3 rounded-2xl text-sm text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'Inter, sans-serif' }}
        />
        <button onClick={handleSend} disabled={!input.trim() || loading}
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
          style={{ background: input.trim() && !loading ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.08)' }}>
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// CONSEILS PERSONNALISÉS (basés sur le profil IA)
// ============================================================

const UNIVERSAL_TIPS = [
  {
    key: 'sleep',
    label: 'Sommeil',
    icon: Moon,
    color: '#a855f7',
    description: 'Le muscle grandit pendant le repos, pas pendant l\'entraînement.',
    tips: [
      'Dors 7-9h par nuit — c\'est pendant le sommeil que la GH (hormone de croissance) est sécrétée.',
      'Couche-toi et lève-toi à la même heure tous les jours, même le week-end.',
      'Évite les écrans 1h avant de dormir — la lumière bleue bloque la mélatonine.',
      'La température idéale pour dormir est 18-19°C.',
      'Un manque de sommeil chronique augmente le cortisol et réduit la testostérone.',
    ],
  },
  {
    key: 'hydration',
    label: 'Hydratation',
    icon: Droplets,
    color: '#3b82f6',
    description: 'La déshydratation réduit les performances de 10-20%.',
    tips: [
      'Bois 35-40ml d\'eau par kg de poids corporel par jour.',
      'Commence chaque journée avec un grand verre d\'eau avant le café.',
      'Pendant l\'entraînement : 500ml-1L par heure selon l\'intensité.',
      'L\'urine doit être jaune paille — si elle est foncée, tu es déshydraté.',
      'Les boissons sportives ne sont utiles que pour les efforts > 60 min.',
    ],
  },
  {
    key: 'supplements',
    label: 'Suppléments',
    icon: Pill,
    color: '#22c55e',
    description: 'Seulement 4 suppléments ont des preuves solides d\'efficacité.',
    tips: [
      'Créatine monohydrate : 3-5g/jour, le supplément le plus étudié et efficace.',
      'Protéines en poudre : utiles si tu n\'atteins pas tes apports via l\'alimentation.',
      'Vitamine D3 : 1000-2000 UI/jour, surtout en hiver (déficience très commune).',
      'Caféine : 3-6mg/kg 30-60 min avant l\'entraînement pour la performance.',
      'Tout le reste (BCAA, pré-workout complexes, brûleurs) a peu ou pas de preuves.',
    ],
  },
  {
    key: 'mindset',
    label: 'Mentalité',
    icon: Brain,
    color: '#FF6B35',
    description: 'La cohérence sur 3 mois vaut mieux que 3 semaines parfaites.',
    tips: [
      'La motivation est éphémère — construis des habitudes qui ne dépendent pas d\'elle.',
      'Manquer une séance n\'est pas un échec. En manquer deux de suite, c\'est une tendance.',
      'Mesure tes progrès sur 4-6 semaines minimum, pas jour par jour.',
      'Compare-toi uniquement à toi-même il y a 3 mois, pas aux autres.',
      'Le perfectionnisme est l\'ennemi de la progression — une séance imparfaite vaut mieux qu\'aucune.',
    ],
  },
  {
    key: 'recovery',
    label: 'Récupération',
    icon: Heart,
    color: '#eab308',
    description: 'Optimiser la récupération pour maximiser les gains.',
    tips: [
      'Étire-toi 10-15 min après chaque séance — ça réduit les courbatures de 20-30%.',
      'Les bains froids (10-15°C, 10-15 min) accélèrent la récupération musculaire.',
      'Le massage ou le foam rolling améliore la circulation et réduit les tensions.',
      'Prends 1-2 jours de repos complet par semaine — le surentraînement est réel.',
      'Les courbatures (DOMS) disparaissent en 24-72h — c\'est normal et signe d\'adaptation.',
    ],
  },
  {
    key: 'performance',
    label: 'Performance',
    icon: Zap,
    color: '#f97316',
    description: 'Maximiser chaque séance pour des résultats optimaux.',
    tips: [
      'Échauffement obligatoire : 5-10 min de cardio léger + mobilité articulaire.',
      'La surcharge progressive est la clé : augmente les charges de 2.5-5% par semaine.',
      'Respecte les temps de repos : 60-90s pour l\'hypertrophie, 2-3 min pour la force.',
      'Concentre-toi sur la connexion musculaire (mind-muscle connection) plutôt que la charge.',
      'Filme tes séries pour analyser ta technique — les erreurs sont souvent invisibles en direct.',
    ],
  },
];

function TipsStaticTab() {
  const { profile, aiSportPlan } = useUserProfile();
  const [expandedCategory, setExpandedCategory] = useState<string | null>('sleep');

  // Conseils personnalisés basés sur le profil
  const personalizedTips: { icon: string; text: string }[] = [];
  if (profile) {
    if (profile.goal === 'lean_bulk') {
      personalizedTips.push({ icon: '💪', text: `Objectif lean bulk : mange en léger surplus (+200-300 kcal/j). Priorise les protéines à ${Math.round((profile.weight ?? 75) * 2)}g/j.` });
    } else if (profile.goal === 'seche') {
      personalizedTips.push({ icon: '🔥', text: `Objectif sèche : déficit calorique modéré (-300-500 kcal/j). Maintiens les protéines élevées pour préserver le muscle.` });
    } else if (profile.goal === 'recomposition') {
      personalizedTips.push({ icon: '⚡', text: 'Recomposition : mange autour de ta maintenance. Timing des glucides autour des séances pour maximiser l\'énergie et la récupération.' });
    } else if (profile.goal === 'performance') {
      personalizedTips.push({ icon: '🏆', text: 'Performance : priorité à la récupération et au timing nutritionnel. Glucides avant/après les séances intenses.' });
    }
    if (profile.level === 'debutant') {
      personalizedTips.push({ icon: '🌱', text: 'Débutant : les 3 premiers mois sont les plus importants. Maîtrise la technique avant d\'augmenter les charges.' });
    } else if (profile.level === 'avance') {
      personalizedTips.push({ icon: '🎯', text: 'Niveau avancé : la périodisation et la variation des stimuli sont essentielles pour continuer à progresser.' });
    }
    if (profile.sessionsPerWeek && profile.sessionsPerWeek >= 5) {
      personalizedTips.push({ icon: '⚠️', text: `${profile.sessionsPerWeek} séances/semaine : surveille les signes de surentraînement (fatigue persistante, baisse de performance, troubles du sommeil).` });
    }
  }

  // Semaines du programme IA
  const sportWeeks = aiSportPlan?.weeks as Array<{ weekNumber: number; focus: string; sessions: Array<{ day: string; name: string }> }> | undefined;

  return (
    <div className="space-y-5">
      {/* Conseils personnalisés si profil disponible */}
      {personalizedTips.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,51,102,0.08))', border: '1px solid rgba(255,107,53,0.2)' }}>
          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            <Target size={14} style={{ color: '#FF6B35' }} /> Conseils pour ton profil
          </h2>
          <div className="space-y-2.5">
            {personalizedTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-base flex-shrink-0">{tip.icon}</span>
                <p className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aperçu du programme sport IA */}
      {sportWeeks && sportWeeks.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            <Shield size={14} style={{ color: '#3B82F6' }} /> Ton programme — {sportWeeks.length} semaines
          </h2>
          <div className="space-y-2">
            {sportWeeks.slice(0, 3).map((week) => (
              <div key={week.weekNumber} className="flex items-center gap-3 py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                  <span className="text-xs font-bold" style={{ color: '#3B82F6', fontFamily: 'Syne, sans-serif' }}>S{week.weekNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{week.focus}</p>
                  <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{week.sessions?.length ?? 0} séances</p>
                </div>
              </div>
            ))}
            {sportWeeks.length > 3 && (
              <p className="text-white/30 text-xs text-center pt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                + {sportWeeks.length - 3} semaines supplémentaires dans l'onglet Séances
              </p>
            )}
          </div>
        </div>
      )}

      {/* Règle des 3 piliers */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 className="text-white font-bold text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>La règle des 3 piliers</h2>
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

      {/* Catégories de conseils universels */}
      <div className="space-y-3">
        {UNIVERSAL_TIPS.map(({ key, label, icon: Icon, color, description, tips }) => (
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

      {/* Erreurs à éviter */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <h3 className="text-red-400 font-bold text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          Les 5 erreurs qui sabotent les résultats
        </h3>
        <div className="space-y-2">
          {[
            'Changer de programme toutes les 2 semaines — la progression prend du temps.',
            'Sauter des repas ou manger insuffisamment de protéines.',
            'Négliger le sommeil (moins de 7h/nuit = -30% de récupération).',
            'Augmenter les charges trop vite au détriment de la technique.',
            'Faire du cardio excessif qui ronge les gains musculaires.',
          ].map((error, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-red-400 text-xs flex-shrink-0 mt-0.5">✗</span>
              <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
            </div>
          ))}
        </div>
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

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      <div className="p-5">
        <h1 className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
          Conseils
        </h1>
        <p className="text-white/50 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          Coach IA · Conseils personnalisés
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

        {/* Conseils personnalisés */}
        {activeTab === 'conseils' && <TipsStaticTab />}
      </div>
    </div>
  );
}
