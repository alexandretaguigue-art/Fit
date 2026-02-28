// ============================================================
// NUTRITION PAGE — FitPro
// Journal alimentaire quotidien modifiable, régulation calorique automatique,
// plan hebdomadaire, liste de courses, récap hebdomadaire réalité/objectif
// ============================================================

import { useState, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2, Edit3, Check, ChevronLeft, ChevronRight, ShoppingCart, Calendar, BookOpen, AlertTriangle, TrendingUp, TrendingDown, BarChart2, CheckCircle, XCircle } from 'lucide-react';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import { programData } from '../lib/programData';
import { computeFoodMacros, MACRO_TARGETS, generateWeeklyMealPlan } from '../lib/nutritionEngine';
import type { FoodEntry } from '../lib/nutritionEngine';
import { toast } from 'sonner';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
  before_sleep: 'Avant de dormir',
};

const MEAL_TIMES: Record<string, string> = {
  breakfast: '07h00',
  lunch: '12h30',
  snack: '16h00',
  dinner: '19h30',
  before_sleep: '22h00',
};

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner', 'before_sleep'];

type ActiveTab = 'journal' | 'plan' | 'recap' | 'courses';

// ============================================================
// COMPOSANT BARRE DE MACRO
// ============================================================
function MacroBar({ label, consumed, target, color }: {
  label: string; consumed: number; target: number; color: string;
}) {
  const pct = Math.min((consumed / target) * 100, 100);
  const over = consumed > target;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: over ? '#ef4444' : 'rgba(255,255,255,0.8)', fontFamily: 'Inter, sans-serif' }}>
          {Math.round(consumed)}g / {target}g
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: over ? '#ef4444' : color }} />
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT AJOUT D'ALIMENT
// ============================================================
function AddFoodModal({ onAdd, onClose, defaultMeal }: {
  onAdd: (entry: Omit<FoodEntry, 'id'>) => void;
  onClose: () => void;
  defaultMeal?: FoodEntry['meal'];
}) {
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<typeof programData.foodItems[0] | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [meal, setMeal] = useState<FoodEntry['meal']>(defaultMeal ?? 'lunch');

  const filtered = programData.foodItems.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const preview = selectedFood ? computeFoodMacros(selectedFood.id, selectedFood.name, quantity, selectedFood.per100g) : null;

  const handleAdd = () => {
    if (!selectedFood || quantity <= 0) return;
    const macros = computeFoodMacros(selectedFood.id, selectedFood.name, quantity, selectedFood.per100g);
    onAdd({ ...macros, meal });
    toast.success(`${selectedFood.name} ajouté !`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="flex-1 overflow-y-auto mt-16 mx-4 mb-4 rounded-2xl" style={{ background: '#1A1A22', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Ajouter un aliment</h3>
            <button onClick={onClose} className="text-white/50 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Fermer</button>
          </div>
          <div className="mb-4">
            <p className="text-white/50 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Repas</p>
            <div className="flex flex-wrap gap-2">
              {MEAL_ORDER.map(m => (
                <button key={m} onClick={() => setMeal(m as FoodEntry['meal'])} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ background: meal === m ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.08)', color: meal === m ? 'white' : 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
                  {MEAL_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un aliment..."
              className="w-full text-white text-sm rounded-xl py-3 px-4"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif' }} autoFocus />
          </div>
          {!selectedFood && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {filtered.map(food => (
                <button key={food.id} onClick={() => setSelectedFood(food)} className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{food.name}</span>
                  <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{food.per100g.proteins}g P · {food.per100g.calories} kcal</span>
                </button>
              ))}
            </div>
          )}
          {selectedFood && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255, 107, 53, 0.08)', border: '1px solid rgba(255, 107, 53, 0.2)' }}>
                <span className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{selectedFood.name}</span>
                <button onClick={() => setSelectedFood(null)} className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Changer</button>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Quantité (g)</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(q => Math.max(10, q - 10))} className="w-10 h-10 rounded-xl text-white font-bold" style={{ background: 'rgba(255,255,255,0.08)' }}>−</button>
                  <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="flex-1 text-center text-white font-bold text-lg rounded-xl py-2"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif' }} min="10" step="10" />
                  <button onClick={() => setQuantity(q => q + 10)} className="w-10 h-10 rounded-xl text-white font-bold" style={{ background: 'rgba(255,255,255,0.08)' }}>+</button>
                </div>
              </div>
              {preview && (
                <div className="grid grid-cols-4 gap-2">
                  {[{ label: 'Kcal', value: preview.calories, color: '#FF6B35' }, { label: 'Prot.', value: `${preview.proteins}g`, color: '#FF6B35' }, { label: 'Gluc.', value: `${preview.carbs}g`, color: '#3b82f6' }, { label: 'Lip.', value: `${preview.fats}g`, color: '#a855f7' }].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="font-bold text-sm" style={{ color, fontFamily: 'Syne, sans-serif' }}>{value}</div>
                      <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleAdd} className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)', fontFamily: 'Syne, sans-serif' }}>
                Ajouter au journal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ONGLET JOURNAL — avec validation des repas du plan + compensation
// ============================================================
function JournalTab() {
  const { getTodayKey, getDayLog, getDayBalance, addFoodEntry, deleteFoodEntry, updateFoodEntry, getWeeklyMealPlan, getCurrentWeekMonday, getMealAdjustments } = useFitnessTracker();
  const [dateOffset, setDateOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalMeal, setAddModalMeal] = useState<FoodEntry['meal']>('lunch');
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  // Repas validés (mangé comme prévu) ou invalidés (modifié)
  const [validatedMeals, setValidatedMeals] = useState<Record<string, 'validated' | 'modified' | null>>({});

  const dateKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d.toISOString().split('T')[0];
  }, [dateOffset]);

  const dayLog = getDayLog(dateKey);
  const balance = getDayBalance(dateKey);

  // Plan du jour (repas suggérés)
  const weekMonday = useMemo(() => {
    const monday = getCurrentWeekMonday();
    if (dateOffset < 0) monday.setDate(monday.getDate() + Math.floor(dateOffset / 7) * 7);
    return monday;
  }, [dateOffset, getCurrentWeekMonday]);

  const weekPlan = useMemo(() => getWeeklyMealPlan(weekMonday), [weekMonday, getWeeklyMealPlan]);
  const dayPlan = useMemo(() => weekPlan.days.find(d => d.date === dateKey), [weekPlan, dateKey]);

  // Repas complétés (validés ou modifiés)
  const completedMeals = useMemo(() =>
    Object.entries(validatedMeals).filter(([, v]) => v !== null).map(([k]) => k),
    [validatedMeals]
  );

  // Ajustements automatiques des repas restants
  const mealAdjustments = useMemo(() =>
    getMealAdjustments(dateKey, completedMeals),
    [dateKey, completedMeals, getMealAdjustments]
  );

  const dateLabel = useMemo(() => {
    if (dateOffset === 0) return 'Aujourd\'hui';
    if (dateOffset === -1) return 'Hier';
    return new Date(dateKey + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [dateOffset, dateKey]);

  const handleAdd = (entry: Omit<FoodEntry, 'id'>) => {
    addFoodEntry(dateKey, { ...entry, id: nanoid() });
  };

  const handleEditSave = (entryId: string, entry: FoodEntry) => {
    const food = programData.foodItems.find(f => f.id === entry.foodId);
    if (food) {
      const macros = computeFoodMacros(food.id, food.name, editQty, food.per100g);
      updateFoodEntry(dateKey, entryId, { ...macros, quantity: editQty });
    } else {
      const factor = editQty / entry.quantity;
      updateFoodEntry(dateKey, entryId, {
        quantity: editQty,
        proteins: Math.round(entry.proteins * factor * 10) / 10,
        carbs: Math.round(entry.carbs * factor * 10) / 10,
        fats: Math.round(entry.fats * factor * 10) / 10,
        calories: Math.round(entry.calories * factor),
      });
    }
    setEditingEntry(null);
    toast.success('Quantité mise à jour');
  };

  // Valider un repas du plan (l'ajouter automatiquement au journal)
  const handleValidateMeal = (mealKey: string) => {
    const planMeal = dayPlan?.meals.find(m => {
      const mealKeyMap: Record<string, string> = { 'Petit-déjeuner': 'breakfast', 'Déjeuner': 'lunch', 'Collation': 'snack', 'Dîner': 'dinner', 'Avant de dormir': 'before_sleep' };
      return mealKeyMap[m.name] === mealKey;
    });
    if (!planMeal) return;

    // Supprimer les entrées existantes pour ce repas
    dayLog.entries.filter(e => e.meal === mealKey).forEach(e => deleteFoodEntry(dateKey, e.id));

    // Ajouter les items du plan
    planMeal.items.forEach(item => {
      const food = programData.foodItems.find(f => f.name.toLowerCase().includes(item.food.toLowerCase().split(' ')[0]));
      const qtyMatch = item.quantity.match(/(\d+(?:\.\d+)?)/);
      const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 100;
      if (food) {
        const macros = computeFoodMacros(food.id, food.name, qty, food.per100g);
        addFoodEntry(dateKey, { ...macros, meal: mealKey as FoodEntry['meal'], id: nanoid() });
      } else {
        // Aliment non trouvé : ajouter avec les macros du plan
        addFoodEntry(dateKey, {
          id: nanoid(), foodId: item.food, foodName: item.food, quantity: qty,
          meal: mealKey as FoodEntry['meal'], proteins: item.proteins, carbs: item.carbs, fats: item.fats, calories: item.calories,
        });
      }
    });

    setValidatedMeals(prev => ({ ...prev, [mealKey]: 'validated' }));
    toast.success(`${MEAL_LABELS[mealKey]} validé ✓`);
  };

  // Invalider un repas (marquer comme modifié — l'utilisateur saisit ce qu'il a vraiment mangé)
  const handleInvalidateMeal = (mealKey: string) => {
    setValidatedMeals(prev => ({ ...prev, [mealKey]: 'modified' }));
    setAddModalMeal(mealKey as FoodEntry['meal']);
    setShowAddModal(true);
    toast.info(`Saisis ce que tu as vraiment mangé pour le ${MEAL_LABELS[mealKey].toLowerCase()}`);
  };

  const grouped = MEAL_ORDER.reduce((acc, meal) => {
    acc[meal] = dayLog.entries.filter(e => e.meal === meal);
    return acc;
  }, {} as Record<string, FoodEntry[]>);

  const statusColors = { optimal: '#22c55e', surplus: '#eab308', deficit: '#3b82f6', protein_low: '#ef4444' };

  return (
    <div className="space-y-4">
      {/* Navigation date */}
      <div className="flex items-center justify-between">
        <button onClick={() => setDateOffset(d => d - 1)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <ChevronLeft size={16} className="text-white/60" />
        </button>
        <div className="text-center">
          <p className="text-white font-semibold text-sm capitalize" style={{ fontFamily: 'Syne, sans-serif' }}>{dateLabel}</p>
          <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{dayLog.isTrainingDay ? '🏋️ Jour training' : '😴 Jour de repos'}</p>
        </div>
        <button onClick={() => setDateOffset(d => Math.min(d + 1, 0))} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }} disabled={dateOffset === 0}>
          <ChevronRight size={16} className={dateOffset === 0 ? 'text-white/20' : 'text-white/60'} />
        </button>
      </div>

      {/* Bilan calorique */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${statusColors[balance.status]}30` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: statusColors[balance.status] }}>{Math.round(balance.consumed.calories)}</span>
              <span className="text-white/40 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>/ {balance.target.calories} kcal</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {balance.surplus.calories > 0 ? <TrendingUp size={12} style={{ color: '#eab308' }} /> : balance.surplus.calories < 0 ? <TrendingDown size={12} style={{ color: '#3b82f6' }} /> : <Check size={12} style={{ color: '#22c55e' }} />}
              <span className="text-xs" style={{ color: Math.abs(balance.surplus.calories) < 200 ? '#22c55e' : '#eab308', fontFamily: 'Inter, sans-serif' }}>
                {balance.surplus.calories > 0 ? '+' : ''}{balance.surplus.calories} kcal
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-xs mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Protéines</div>
            <div className="text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif', color: balance.proteinAdequacy >= 90 ? '#22c55e' : balance.proteinAdequacy >= 70 ? '#eab308' : '#ef4444' }}>
              {Math.round(balance.consumed.proteins)}g
            </div>
            <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{balance.proteinAdequacy}% objectif</div>
          </div>
        </div>
        <div className="space-y-2.5">
          <MacroBar label="Protéines" consumed={balance.consumed.proteins} target={balance.target.proteins} color="#FF6B35" />
          <MacroBar label="Glucides" consumed={balance.consumed.carbs} target={balance.target.carbs} color="#3b82f6" />
          <MacroBar label="Lipides" consumed={balance.consumed.fats} target={balance.target.fats} color="#a855f7" />
        </div>
        <div className="mt-3 p-3 rounded-xl flex items-start gap-2" style={{ background: `${statusColors[balance.status]}10` }}>
          {balance.status !== 'optimal' && <AlertTriangle size={14} style={{ color: statusColors[balance.status], flexShrink: 0, marginTop: 1 }} />}
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>{balance.recommendation}</p>
        </div>
      </div>

      {/* Repas — avec validation du plan et compensation automatique */}
      {MEAL_ORDER.map(meal => {
        const entries = grouped[meal] ?? [];
        const mealCalories = entries.reduce((acc, e) => acc + e.calories, 0);
        const mealStatus = validatedMeals[meal];
        const adjustment = mealAdjustments[meal];
        const planMeal = dayPlan?.meals.find(m => {
          const mealKeyMap: Record<string, string> = { 'Petit-déjeuner': 'breakfast', 'Déjeuner': 'lunch', 'Collation': 'snack', 'Dîner': 'dinner', 'Avant de dormir': 'before_sleep' };
          return mealKeyMap[m.name] === meal;
        });

        return (
          <div key={meal} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: mealStatus === 'validated' ? '1px solid rgba(34,197,94,0.25)' : mealStatus === 'modified' ? '1px solid rgba(255,107,53,0.25)' : '1px solid rgba(255,255,255,0.08)' }}>
            {/* Header repas */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{MEAL_TIMES[meal]}</span>
                <h4 className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{MEAL_LABELS[meal]}</h4>
              </div>
              <div className="flex items-center gap-2">
                {mealStatus === 'validated' && <span className="text-green-400 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>✓ Validé</span>}
                {mealStatus === 'modified' && <span className="text-orange-400 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>✎ Modifié</span>}
                <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{mealCalories > 0 ? `${Math.round(mealCalories)} kcal` : '—'}</span>
              </div>
            </div>

            {/* Plan suggéré (si pas encore validé) */}
            {!mealStatus && planMeal && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-3.5 py-2" style={{ background: 'rgba(255,107,53,0.04)' }}>
                  <p className="text-orange-400/70 text-xs font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Plan suggéré · {planMeal.totalCalories} kcal</p>
                  {planMeal.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-0.5">
                      <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>• {item.food}</span>
                      <span className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{item.quantity}</span>
                    </div>
                  ))}
                  {/* Boutons validation */}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleValidateMeal(meal)} className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', fontFamily: 'Inter, sans-serif' }}>
                      <CheckCircle size={12} /> J'ai mangé ça ✓
                    </button>
                    <button onClick={() => handleInvalidateMeal(meal)} className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      style={{ background: 'rgba(255,107,53,0.08)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)', fontFamily: 'Inter, sans-serif' }}>
                      <XCircle size={12} /> J'ai mangé autre chose
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Ajustement automatique (repas restants) */}
            {!mealStatus && adjustment && (
              <div className="px-3.5 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(59,130,246,0.04)' }}>
                <p className="text-blue-400/70 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  🔄 Budget ajusté : <strong>{adjustment.calorieBudget} kcal</strong> · P:{adjustment.proteinTarget}g G:{adjustment.carbTarget}g L:{adjustment.fatTarget}g
                </p>
                <p className="text-blue-300/50 text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>{adjustment.message}</p>
              </div>
            )}

            {/* Entrées saisies */}
            {entries.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {entries.map(entry => (
                  <div key={entry.id} className="flex items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {editingEntry === entry.id ? (
                      <>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-white/70 text-xs flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>{entry.foodName}</span>
                          <input type="number" value={editQty} onChange={e => setEditQty(Number(e.target.value))} className="w-16 text-center text-white text-xs rounded-lg py-1.5"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255, 107, 53, 0.4)', fontFamily: 'Inter, sans-serif' }} min="10" step="10" />
                          <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>g</span>
                        </div>
                        <button onClick={() => handleEditSave(entry.id, entry)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                          <Check size={12} className="text-green-400" />
                        </button>
                        <button onClick={() => setEditingEntry(null)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <span className="text-white/40 text-xs">✕</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-white/80 text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{entry.foodName}</span>
                            <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{entry.quantity}g</span>
                          </div>
                          <div className="flex gap-2 mt-0.5">
                            <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{Math.round(entry.calories)} kcal</span>
                            <span className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>P:{Math.round(entry.proteins)}g G:{Math.round(entry.carbs)}g L:{Math.round(entry.fats)}g</span>
                          </div>
                        </div>
                        <button onClick={() => { setEditingEntry(entry.id); setEditQty(entry.quantity); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <Edit3 size={11} className="text-white/40" />
                        </button>
                        <button onClick={() => { deleteFoodEntry(dateKey, entry.id); toast.success('Supprimé'); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                          <Trash2 size={11} className="text-red-400/60" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bouton ajouter manuellement */}
            <div className="px-3.5 py-2.5" style={{ borderTop: entries.length > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
              <button onClick={() => { setAddModalMeal(meal as FoodEntry['meal']); setShowAddModal(true); }} className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/60 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                <Plus size={12} /> Ajouter manuellement
              </button>
            </div>
          </div>
        );
      })}

      {/* Bouton ajouter global */}
      <button onClick={() => { setAddModalMeal('lunch'); setShowAddModal(true); }} className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
        style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)', fontFamily: 'Syne, sans-serif', boxShadow: '0 8px 30px rgba(255, 107, 53, 0.2)' }}>
        <Plus size={18} /> Ajouter un aliment
      </button>

      {showAddModal && <AddFoodModal onAdd={handleAdd} onClose={() => setShowAddModal(false)} defaultMeal={addModalMeal} />}
    </div>
  );
}

// ============================================================
// ONGLET PLAN HEBDOMADAIRE
// ============================================================
function PlanTab() {
  const { getWeeklyMealPlan, getCurrentWeekMonday, getWeeklyNutritionSummary } = useFitnessTracker();
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const weekMonday = useMemo(() => {
    const monday = getCurrentWeekMonday();
    monday.setDate(monday.getDate() + weekOffset * 7);
    return monday;
  }, [weekOffset, getCurrentWeekMonday]);

  const plan = useMemo(() => getWeeklyMealPlan(weekMonday), [weekMonday, getWeeklyMealPlan]);
  const weekStartKey = weekMonday.toISOString().split('T')[0];
  const summary = getWeeklyNutritionSummary(weekStartKey);

  const weekLabel = weekOffset === 0 ? 'Cette semaine' : weekOffset === 1 ? 'Semaine prochaine' : weekOffset === -1 ? 'Semaine dernière'
    : `Semaine du ${weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset(w => w - 1)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <ChevronLeft size={16} className="text-white/60" />
        </button>
        <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{weekLabel}</p>
        <button onClick={() => setWeekOffset(w => w + 1)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <ChevronRight size={16} className="text-white/60" />
        </button>
      </div>

      {summary.avgDailyCalories > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.15)' }}>
          <p className="text-orange-400 font-semibold text-sm mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Bilan semaine enregistré</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[{ label: 'Moy. kcal/j', value: summary.avgDailyCalories }, { label: 'Moy. prot./j', value: `${summary.avgDailyProteins}g` }, { label: 'Adéquation prot.', value: `${summary.proteinAdequacyAvg}%` }].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</div>
                <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</div>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{summary.recommendation}</p>
        </div>
      )}

      {plan.days.map(day => (
        <div key={day.date} className="rounded-2xl overflow-hidden cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.04)', border: expandedDay === day.date ? '1px solid rgba(255, 107, 53, 0.3)' : '1px solid rgba(255,255,255,0.08)' }}
          onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase" style={{ color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>{day.dayName}</span>
                {day.isTrainingDay && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255, 107, 53, 0.12)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>🏋️ {day.sessionName}</span>}
              </div>
              <div className="flex gap-3 mt-1">
                <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{Math.round(day.totalMacros.calories)} kcal</span>
                <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>P: {Math.round(day.totalMacros.proteins)}g</span>
              </div>
            </div>
            <span className="text-white/30 text-lg">{expandedDay === day.date ? '−' : '+'}</span>
          </div>
          {expandedDay === day.date && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {day.meals.map((meal, idx) => (
                <div key={idx} className="p-4" style={{ borderBottom: idx < day.meals.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>{meal.time} — {meal.name}</span>
                    <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{meal.totalCalories} kcal</span>
                  </div>
                  <div className="space-y-1">
                    {meal.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#FF6B35' }} />
                          <span className="text-white/70 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{item.food}</span>
                        </div>
                        <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// ONGLET RÉCAP HEBDOMADAIRE — Réalité vs Objectif
// ============================================================
function RecapTab() {
  const { getWeeklyRecap, getCurrentWeekMonday } = useFitnessTracker();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekMonday = useMemo(() => {
    const monday = getCurrentWeekMonday();
    monday.setDate(monday.getDate() + weekOffset * 7);
    return monday;
  }, [weekOffset, getCurrentWeekMonday]);

  const recap = useMemo(() => getWeeklyRecap(weekMonday), [weekMonday, getWeeklyRecap]);

  const weekLabel = weekOffset === 0 ? 'Cette semaine' : weekOffset === -1 ? 'Semaine dernière' : `Semaine du ${weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;

  const verdictColors = { excellent: '#22c55e', good: '#84cc16', average: '#eab308', poor: '#ef4444' };
  const verdictLabels = { excellent: 'Excellent', good: 'Bien', average: 'À améliorer', poor: 'Insuffisant' };
  const statusColors = { optimal: '#22c55e', surplus: '#eab308', deficit: '#3b82f6', protein_low: '#ef4444', no_data: 'rgba(255,255,255,0.2)' };
  const statusLabels = { optimal: '✓', surplus: '↑', deficit: '↓', protein_low: '⚠', no_data: '—' };

  const pct = (consumed: number, target: number) => Math.min(Math.round((consumed / target) * 100), 150);

  return (
    <div className="space-y-4">
      {/* Navigation semaine */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset(w => w - 1)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <ChevronLeft size={16} className="text-white/60" />
        </button>
        <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{weekLabel}</p>
        <button onClick={() => setWeekOffset(w => Math.min(w + 1, 0))} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }} disabled={weekOffset === 0}>
          <ChevronRight size={16} className={weekOffset === 0 ? 'text-white/20' : 'text-white/60'} />
        </button>
      </div>

      {/* Verdict global */}
      <div className="rounded-2xl p-5" style={{ background: `${verdictColors[recap.verdict]}08`, border: `1px solid ${verdictColors[recap.verdict]}25` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: verdictColors[recap.verdict] }}>
            {verdictLabels[recap.verdict]}
          </div>
          <div>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{recap.verdictMessage}</p>
          </div>
        </div>
        <p className="text-white/50 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
          💡 {recap.nextWeekRecommendation}
        </p>
      </div>

      {/* Totaux semaine — Réalité vs Objectif */}
      {recap.totals.consumed.calories > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white/60 text-xs uppercase tracking-wider mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Totaux semaine — Réalité / Objectif</p>
          <div className="space-y-3">
            {[
              { label: 'Calories', consumed: recap.totals.consumed.calories, target: recap.totals.target.calories, unit: 'kcal', color: '#FF6B35' },
              { label: 'Protéines', consumed: recap.totals.consumed.proteins, target: recap.totals.target.proteins, unit: 'g', color: '#ef4444' },
              { label: 'Glucides', consumed: recap.totals.consumed.carbs, target: recap.totals.target.carbs, unit: 'g', color: '#3b82f6' },
              { label: 'Lipides', consumed: recap.totals.consumed.fats, target: recap.totals.target.fats, unit: 'g', color: '#a855f7' },
            ].map(({ label, consumed, target, unit, color }) => {
              const p = pct(consumed, target);
              const over = consumed > target;
              return (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
                    <span className="text-xs font-semibold" style={{ color: over ? '#eab308' : 'rgba(255,255,255,0.8)', fontFamily: 'Inter, sans-serif' }}>
                      {Math.round(consumed)}{unit} / {Math.round(target)}{unit} ({p}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(p, 100)}%`, background: over ? '#eab308' : color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Adéquation protéines</span>
            <span className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: recap.totals.proteinAdequacy >= 90 ? '#22c55e' : recap.totals.proteinAdequacy >= 75 ? '#eab308' : '#ef4444' }}>
              {recap.totals.proteinAdequacy}%
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Surplus/Déficit semaine</span>
            <span className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: Math.abs(recap.totals.surplusCalories) < 500 ? '#22c55e' : '#eab308' }}>
              {recap.totals.surplusCalories > 0 ? '+' : ''}{recap.totals.surplusCalories} kcal
            </span>
          </div>
        </div>
      )}

      {/* Détail jour par jour */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="p-4 pb-2">
          <p className="text-white/60 text-xs uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Détail jour par jour</p>
        </div>
        {recap.days.map((day, i) => (
          <div key={day.date} className="px-4 py-3" style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>{day.dayName}</span>
                {day.isTrainingDay && <span className="text-xs text-white/30" style={{ fontFamily: 'Inter, sans-serif' }}>🏋️</span>}
              </div>
              <div className="flex items-center gap-2">
                {day.status !== 'no_data' && (
                  <span className="text-xs font-bold" style={{ color: statusColors[day.status], fontFamily: 'Inter, sans-serif' }}>
                    {statusLabels[day.status]}
                  </span>
                )}
                <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {day.status === 'no_data' ? 'Pas de données' : `${Math.round(day.consumed.calories)} / ${day.target.calories} kcal`}
                </span>
              </div>
            </div>
            {day.status !== 'no_data' && (
              <div className="flex gap-3">
                <span className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>P:{Math.round(day.consumed.proteins)}g</span>
                <span className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>G:{Math.round(day.consumed.carbs)}g</span>
                <span className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>L:{Math.round(day.consumed.fats)}g</span>
                <span className="text-xs font-semibold" style={{ color: Math.abs(day.surplusCalories) < 200 ? '#22c55e' : '#eab308', fontFamily: 'Inter, sans-serif' }}>
                  {day.surplusCalories > 0 ? '+' : ''}{day.surplusCalories} kcal
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Produits Intermarché avec photos et liens
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Viandes': { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' },
  'Poissons & Fruits de mer': { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', text: '#3b82f6' },
  'Produits laitiers & Œufs': { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', text: '#eab308' },
  'Féculents & Légumineuses': { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', text: '#eab308' },
  'Légumes': { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', text: '#22c55e' },
  'Fruits': { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', text: '#22c55e' },
  'Lipides & Oléagineux': { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', text: '#3b82f6' },
  'Condiments & Divers': { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)', text: '#a855f7' },
  'Suppléments': { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)', text: '#a855f7' },
  'Divers': { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.5)' },
};

// ============================================================
// ONGLET LISTE DE COURSES — générée depuis le plan réel
// ============================================================
function CoursesTab() {
  const { getNextWeekMonday, getCurrentWeekMonday, getShoppingList, getWeeklyMealPlan } = useFitnessTracker();
  const [forNextWeek, setForNextWeek] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Lundi de la semaine cible
  const weekMonday = forNextWeek ? getNextWeekMonday() : getCurrentWeekMonday();
  const weekLabel = weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Générer la liste depuis le plan réel de la semaine
  const weekPlan = getWeeklyMealPlan(weekMonday);
  const shoppingList = getShoppingList(weekMonday);
  const items = shoppingList.items;

  // Regrouper par catégorie
  const categories = Array.from(new Set(items.map(i => i.category)));
  const checkedCount = checkedItems.size;
  const totalCount = items.length;

  const toggleItem = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Calcul du budget estimé
  const totalBudget = shoppingList.totalEstimatedBudget;

  // Rappel drive : commande samedi, récupération lundi midi → courses disponibles lundi soir
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=dim, 6=sam
  const isSaturday = dayOfWeek === 6;
  const isMonday = dayOfWeek === 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Drive Intermarché Venelles</h3>
            <p className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              Semaine du {weekLabel} · {totalBudget}
            </p>
            <p className="text-white/40 text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
              {totalCount} articles · générés depuis ton plan alimentaire
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(255, 107, 53, 0.12)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>{checkedCount}/{totalCount}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setForNextWeek(false); setCheckedItems(new Set()); }} className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: !forNextWeek ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.06)', color: !forNextWeek ? 'white' : 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
            Cette semaine
          </button>
          <button onClick={() => { setForNextWeek(true); setCheckedItems(new Set()); }} className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: forNextWeek ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.06)', color: forNextWeek ? 'white' : 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
            Semaine prochaine 🛒
          </button>
        </div>
        <div className="mt-3">
          <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%`, background: 'linear-gradient(90deg, #FF6B35, #22c55e)' }} />
          </div>
        </div>
      </div>

      {/* Rappel drive */}
      <div className="rounded-2xl p-4" style={{ background: isSaturday ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.04)', border: isSaturday ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
        <p className="font-semibold text-xs mb-2" style={{ color: isSaturday ? '#FF6B35' : 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>
          {isSaturday ? "🛒 C'est samedi — commande ton drive maintenant !" : isMonday ? '📦 Récupération lundi midi — courses disponibles ce soir !' : '🚗 Drive Intermarché Venelles'}
        </p>
        <div className="space-y-1">
          {['✔ Commande le samedi sur intermarche.com', '✔ Récupération le lundi à midi — courses disponibles lundi soir', '✔ Congèle viandes et poissons en portions de 150-180g', '✔ Surgelés = même valeur nutritive que le frais, moins chers', '✔ Prépare riz, patates douces et légumes en batch le lundi soir'].map((tip, i) => (
            <p key={i} className="text-white/50 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{tip}</p>
          ))}
        </div>
      </div>

      {/* Conseils supplémentaires */}
      {shoppingList.storeTips.length > 0 && (
        <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/40 text-xs font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Conseils du coach</p>
          {shoppingList.storeTips.slice(0, 3).map((tip, i) => (
            <p key={i} className="text-white/40 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{tip}</p>
          ))}
        </div>
      )}

      {/* Liste par catégorie */}
      {categories.map(category => {
        const catItems = items.filter(i => i.category === category);
        const catColors = CATEGORY_COLORS[category] ?? { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#fff' };
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1" style={{ background: catColors.border }} />
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: catColors.bg, color: catColors.text, border: `1px solid ${catColors.border}`, fontFamily: 'Inter, sans-serif' }}>{category}</span>
              <div className="h-px flex-1" style={{ background: catColors.border }} />
            </div>
            <div className="space-y-2">
              {catItems.map((item) => {
                const itemKey = `${category}-${item.name}`;
                const isChecked = checkedItems.has(itemKey);
                const priorityColor = item.priority === 'essential' ? '#22c55e' : item.priority === 'recommended' ? '#eab308' : '#6b7280';
                return (
                  <div key={itemKey}
                    className="rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
                    style={{ background: isChecked ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.04)', border: isChecked ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.08)', opacity: isChecked ? 0.55 : 1 }}
                    onClick={() => toggleItem(itemKey)}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Checkbox */}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                        style={{ background: isChecked ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)', border: isChecked ? '2px solid rgba(34,197,94,0.5)' : '1px solid rgba(255,255,255,0.15)' }}>
                        {isChecked && <Check size={13} className="text-green-400" />}
                      </div>
                      {/* Infos produit */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-white font-semibold text-sm leading-tight" style={{ fontFamily: 'Syne, sans-serif', textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'rgba(255,255,255,0.4)' : 'white' }}>
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: catColors.bg, color: catColors.text, fontFamily: 'Inter, sans-serif' }}>
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{item.estimatedPrice}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${priorityColor}15`, color: priorityColor, fontFamily: 'Inter, sans-serif' }}>
                            {item.priority === 'essential' ? 'Essentiel' : item.priority === 'recommended' ? 'Recommandé' : 'Optionnel'}
                          </span>
                        </div>
                        {!isChecked && item.notes && (
                          <p className="text-white/30 text-xs mt-1 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{item.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Whey — rappel commande en ligne */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
        <p className="text-purple-400 font-semibold text-xs mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>💊 Suppléments — Commander en ligne</p>
        <div className="space-y-2">
          {[
            { name: 'Whey Isolate', detail: '1 kg (~30 doses)', price: '~25-35€', link: 'https://www.myprotein.com/fr-fr/sports-nutrition/impact-whey-isolate/10852482.html', tip: "Myprotein ou Bulk — 2× moins cher qu'en magasin." },
            { name: 'Créatine monohydrate', detail: '500g (~100 doses)', price: '~15-20€', link: 'https://www.myprotein.com/fr-fr/sports-nutrition/creatine-monohydrate/10852430.html', tip: '5g/jour avec eau. Meilleur supplément prouvé scientifiquement.' },
          ].map((supp) => (
            <div key={supp.name} className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <p className="text-white/80 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{supp.name} — {supp.detail}</p>
                <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{supp.price} · {supp.tip}</p>
              </div>
              <a href={supp.link} target="_blank" rel="noopener noreferrer"
                className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)', fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}
                onClick={e => e.stopPropagation()}>
                Commander ↗
              </a>
            </div>
          ))}
        </div>
      </div>

      {checkedCount > 0 && (
        <button onClick={() => setCheckedItems(new Set())} className="w-full py-3 rounded-xl text-white/50 text-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Inter, sans-serif' }}>
          Tout décocher ({checkedCount} articles)
        </button>
      )}
    </div>
  );
}
// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function NutritionPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('journal');

  const tabs = [
    { id: 'journal' as ActiveTab, label: 'Journal', icon: BookOpen },
    { id: 'plan' as ActiveTab, label: 'Plan', icon: Calendar },
    { id: 'recap' as ActiveTab, label: 'Récap', icon: BarChart2 },
    { id: 'courses' as ActiveTab, label: 'Courses', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      <div className="p-5">
        <h1 className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Nutrition</h1>
        <p className="text-white/50 text-sm mb-5" style={{ fontFamily: 'Inter, sans-serif' }}>Journal · Plan · Récap · Courses</p>

        {/* Onglets */}
        <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{ background: activeTab === id ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'transparent', color: activeTab === id ? 'white' : 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'journal' && <JournalTab />}
        {activeTab === 'plan' && <PlanTab />}
        {activeTab === 'recap' && <RecapTab />}
        {activeTab === 'courses' && <CoursesTab />}
      </div>
    </div>
  );
}
