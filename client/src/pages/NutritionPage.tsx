// DESIGN: "Coach Nocturne" — Page Nutrition v2
// Journal alimentaire quotidien modifiable, régulation calorique automatique,
// plan hebdomadaire, liste de courses

import { useState, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2, Edit3, Check, ChevronLeft, ChevronRight, ShoppingCart, Calendar, BookOpen, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import { programData, macroTargets } from '../lib/programData';
import { computeFoodMacros, MACRO_TARGETS } from '../lib/nutritionEngine';
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

type ActiveTab = 'journal' | 'plan' | 'courses';

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
        <span
          className="text-xs font-semibold"
          style={{ color: over ? '#ef4444' : 'rgba(255,255,255,0.8)', fontFamily: 'Inter, sans-serif' }}
        >
          {Math.round(consumed)}g / {target}g
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: over ? '#ef4444' : color }}
        />
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT AJOUT D'ALIMENT
// ============================================================
function AddFoodModal({ onAdd, onClose }: {
  onAdd: (entry: Omit<FoodEntry, 'id'>) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<typeof programData.foodItems[0] | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [meal, setMeal] = useState<FoodEntry['meal']>('lunch');

  const filtered = programData.foodItems.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const preview = selectedFood
    ? computeFoodMacros(selectedFood.id, selectedFood.name, quantity, selectedFood.per100g)
    : null;

  const handleAdd = () => {
    if (!selectedFood || quantity <= 0) return;
    const macros = computeFoodMacros(selectedFood.id, selectedFood.name, quantity, selectedFood.per100g);
    onAdd({ ...macros, meal });
    toast.success(`${selectedFood.name} ajouté !`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="flex-1 overflow-y-auto mt-16 mx-4 mb-4 rounded-2xl"
        style={{ background: '#1A1A22', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
              Ajouter un aliment
            </h3>
            <button onClick={onClose} className="text-white/50 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Fermer
            </button>
          </div>

          {/* Repas */}
          <div className="mb-4">
            <p className="text-white/50 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Repas</p>
            <div className="flex flex-wrap gap-2">
              {MEAL_ORDER.map(m => (
                <button
                  key={m}
                  onClick={() => setMeal(m as FoodEntry['meal'])}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: meal === m ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.08)',
                    color: meal === m ? 'white' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {MEAL_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Recherche */}
          <div className="mb-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un aliment..."
              className="w-full text-white text-sm rounded-xl py-3 px-4"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'Inter, sans-serif',
              }}
              autoFocus
            />
          </div>

          {/* Résultats */}
          {!selectedFood && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {filtered.map(food => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{food.name}</span>
                  <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {food.per100g.proteins}g P · {food.per100g.calories} kcal
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Aliment sélectionné */}
          {selectedFood && (
            <div className="space-y-4">
              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255, 107, 53, 0.08)', border: '1px solid rgba(255, 107, 53, 0.2)' }}
              >
                <span className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {selectedFood.name}
                </span>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-white/40 text-xs"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Changer
                </button>
              </div>

              {/* Quantité */}
              <div>
                <p className="text-white/50 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Quantité (g)</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(10, q - 10))}
                    className="w-10 h-10 rounded-xl text-white font-bold"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="flex-1 text-center text-white font-bold text-lg rounded-xl py-2"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    min="10"
                    step="10"
                  />
                  <button
                    onClick={() => setQuantity(q => q + 10)}
                    className="w-10 h-10 rounded-xl text-white font-bold"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Aperçu macros */}
              {preview && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Kcal', value: preview.calories, color: '#FF6B35' },
                    { label: 'Prot.', value: `${preview.proteins}g`, color: '#FF6B35' },
                    { label: 'Gluc.', value: `${preview.carbs}g`, color: '#3b82f6' },
                    { label: 'Lip.', value: `${preview.fats}g`, color: '#a855f7' },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="text-center p-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div className="font-bold text-sm" style={{ color, fontFamily: 'Syne, sans-serif' }}>{value}</div>
                      <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleAdd}
                className="w-full py-3 rounded-xl font-bold text-white text-sm"
                style={{
                  background: 'linear-gradient(135deg, #FF6B35, #FF3366)',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
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
// ONGLET JOURNAL
// ============================================================
function JournalTab() {
  const { getTodayKey, getDayLog, getDayBalance, addFoodEntry, deleteFoodEntry, updateFoodEntry } = useFitnessTracker();
  const [dateOffset, setDateOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);

  const dateKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d.toISOString().split('T')[0];
  }, [dateOffset]);

  const dayLog = getDayLog(dateKey);
  const balance = getDayBalance(dateKey);

  const dateLabel = useMemo(() => {
    if (dateOffset === 0) return 'Aujourd\'hui';
    if (dateOffset === -1) return 'Hier';
    return new Date(dateKey + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [dateOffset, dateKey]);

  const handleAdd = (entry: Omit<FoodEntry, 'id'>) => {
    addFoodEntry(dateKey, { ...entry, id: nanoid() });
  };

  const handleEditSave = (entryId: string, entry: FoodEntry) => {
    // Recalcule les macros avec la nouvelle quantité
    const food = programData.foodItems.find(f => f.id === entry.foodId);
    if (food) {
      const macros = computeFoodMacros(food.id, food.name, editQty, food.per100g);
      updateFoodEntry(dateKey, entryId, { ...macros, quantity: editQty });
    } else {
      // Aliment non trouvé dans la base — mise à l'échelle proportionnelle
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

  const grouped = MEAL_ORDER.reduce((acc, meal) => {
    acc[meal] = dayLog.entries.filter(e => e.meal === meal);
    return acc;
  }, {} as Record<string, FoodEntry[]>);

  const statusColors = {
    optimal: '#22c55e',
    surplus: '#eab308',
    deficit: '#3b82f6',
    protein_low: '#ef4444',
  };

  return (
    <div className="space-y-4">
      {/* Navigation date */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setDateOffset(d => d - 1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <ChevronLeft size={16} className="text-white/60" />
        </button>
        <div className="text-center">
          <p className="text-white font-semibold text-sm capitalize" style={{ fontFamily: 'Syne, sans-serif' }}>
            {dateLabel}
          </p>
          <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            {dayLog.isTrainingDay ? '🏋️ Jour training' : '😴 Jour de repos'}
          </p>
        </div>
        <button
          onClick={() => setDateOffset(d => Math.min(d + 1, 0))}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          disabled={dateOffset === 0}
        >
          <ChevronRight size={16} className={dateOffset === 0 ? 'text-white/20' : 'text-white/60'} />
        </button>
      </div>

      {/* Bilan calorique */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${statusColors[balance.status]}30`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-3xl font-bold"
                style={{ fontFamily: 'Syne, sans-serif', color: statusColors[balance.status] }}
              >
                {Math.round(balance.consumed.calories)}
              </span>
              <span className="text-white/40 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                / {balance.target.calories} kcal
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {balance.surplus.calories > 0
                ? <TrendingUp size={12} style={{ color: '#eab308' }} />
                : balance.surplus.calories < 0
                  ? <TrendingDown size={12} style={{ color: '#3b82f6' }} />
                  : <Check size={12} style={{ color: '#22c55e' }} />
              }
              <span
                className="text-xs"
                style={{
                  color: Math.abs(balance.surplus.calories) < 200 ? '#22c55e' : '#eab308',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {balance.surplus.calories > 0 ? '+' : ''}{balance.surplus.calories} kcal
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-xs mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Protéines
            </div>
            <div
              className="text-lg font-bold"
              style={{
                fontFamily: 'Syne, sans-serif',
                color: balance.proteinAdequacy >= 90 ? '#22c55e' : balance.proteinAdequacy >= 70 ? '#eab308' : '#ef4444',
              }}
            >
              {Math.round(balance.consumed.proteins)}g
            </div>
            <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              {balance.proteinAdequacy}% objectif
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <MacroBar label="Protéines" consumed={balance.consumed.proteins} target={balance.target.proteins} color="#FF6B35" />
          <MacroBar label="Glucides" consumed={balance.consumed.carbs} target={balance.target.carbs} color="#3b82f6" />
          <MacroBar label="Lipides" consumed={balance.consumed.fats} target={balance.target.fats} color="#a855f7" />
        </div>

        {/* Recommandation */}
        <div
          className="mt-3 p-3 rounded-xl flex items-start gap-2"
          style={{ background: `${statusColors[balance.status]}10` }}
        >
          {balance.status !== 'optimal' && (
            <AlertTriangle size={14} style={{ color: statusColors[balance.status], flexShrink: 0, marginTop: 1 }} />
          )}
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>
            {balance.recommendation}
          </p>
        </div>
      </div>

      {/* Repas */}
      {MEAL_ORDER.map(meal => {
        const entries = grouped[meal] ?? [];
        const mealCalories = entries.reduce((acc, e) => acc + e.calories, 0);

        return (
          <div
            key={meal}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between p-3.5">
              <div>
                <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {MEAL_TIMES[meal]}
                </span>
                <h4 className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {MEAL_LABELS[meal]}
                </h4>
              </div>
              <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                {mealCalories > 0 ? `${Math.round(mealCalories)} kcal` : '—'}
              </span>
            </div>

            {entries.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {entries.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 px-3.5 py-2.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {editingEntry === entry.id ? (
                      <>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-white/70 text-xs flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {entry.foodName}
                          </span>
                          <input
                            type="number"
                            value={editQty}
                            onChange={e => setEditQty(Number(e.target.value))}
                            className="w-16 text-center text-white text-xs rounded-lg py-1.5"
                            style={{
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255, 107, 53, 0.4)',
                              fontFamily: 'Inter, sans-serif',
                            }}
                            min="10"
                            step="10"
                          />
                          <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>g</span>
                        </div>
                        <button
                          onClick={() => handleEditSave(entry.id, entry)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(34, 197, 94, 0.15)' }}
                        >
                          <Check size={12} className="text-green-400" />
                        </button>
                        <button
                          onClick={() => setEditingEntry(null)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          <span className="text-white/40 text-xs">✕</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-white/80 text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {entry.foodName}
                            </span>
                            <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {entry.quantity}g
                            </span>
                          </div>
                          <div className="flex gap-2 mt-0.5">
                            <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {Math.round(entry.calories)} kcal
                            </span>
                            <span className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                              P:{Math.round(entry.proteins)}g G:{Math.round(entry.carbs)}g L:{Math.round(entry.fats)}g
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => { setEditingEntry(entry.id); setEditQty(entry.quantity); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          <Edit3 size={11} className="text-white/40" />
                        </button>
                        <button
                          onClick={() => { deleteFoodEntry(dateKey, entry.id); toast.success('Supprimé'); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(239, 68, 68, 0.08)' }}
                        >
                          <Trash2 size={11} className="text-red-400/60" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Bouton ajouter */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #FF6B35, #FF3366)',
          fontFamily: 'Syne, sans-serif',
          boxShadow: '0 8px 30px rgba(255, 107, 53, 0.2)',
        }}
      >
        <Plus size={18} />
        Ajouter un aliment
      </button>

      {showAddModal && (
        <AddFoodModal onAdd={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
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

  const weekLabel = weekOffset === 0 ? 'Cette semaine'
    : weekOffset === 1 ? 'Semaine prochaine'
    : weekOffset === -1 ? 'Semaine dernière'
    : `Semaine du ${weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;

  return (
    <div className="space-y-4">
      {/* Navigation semaine */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <ChevronLeft size={16} className="text-white/60" />
        </button>
        <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
          {weekLabel}
        </p>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <ChevronRight size={16} className="text-white/60" />
        </button>
      </div>

      {/* Bilan hebdomadaire (si données) */}
      {summary.avgDailyCalories > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.15)' }}
        >
          <p className="text-orange-400 font-semibold text-sm mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Bilan semaine
          </p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'Moy. kcal/j', value: summary.avgDailyCalories },
              { label: 'Moy. prot./j', value: `${summary.avgDailyProteins}g` },
              { label: 'Adéquation prot.', value: `${summary.proteinAdequacyAvg}%` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</div>
                <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</div>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            {summary.recommendation}
          </p>
        </div>
      )}

      {/* Jours de la semaine */}
      {plan.days.map(day => (
        <div
          key={day.date}
          className="rounded-2xl overflow-hidden cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: expandedDay === day.date
              ? '1px solid rgba(255, 107, 53, 0.3)'
              : '1px solid rgba(255,255,255,0.08)',
          }}
          onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
        >
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold uppercase"
                  style={{ color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}
                >
                  {day.dayName}
                </span>
                {day.isTrainingDay && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255, 107, 53, 0.12)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}
                  >
                    🏋️ {day.sessionName}
                  </span>
                )}
              </div>
              <div className="flex gap-3 mt-1">
                <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {Math.round(day.totalMacros.calories)} kcal
                </span>
                <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  P: {Math.round(day.totalMacros.proteins)}g
                </span>
              </div>
            </div>
            <span className="text-white/30 text-lg">{expandedDay === day.date ? '−' : '+'}</span>
          </div>

          {expandedDay === day.date && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {day.meals.map((meal, idx) => (
                <div
                  key={idx}
                  className="p-4"
                  style={{ borderBottom: idx < day.meals.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}
                    >
                      {meal.time} — {meal.name}
                    </span>
                    <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {meal.totalCalories} kcal
                    </span>
                  </div>
                  <div className="space-y-1">
                    {meal.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#FF6B35' }} />
                          <span className="text-white/70 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {item.food}
                          </span>
                        </div>
                        <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {item.quantity}
                        </span>
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
// ONGLET LISTE DE COURSES
// ============================================================
function CoursesTab() {
  const { getShoppingList, getNextWeekMonday, getCurrentWeekMonday } = useFitnessTracker();
  const [forNextWeek, setForNextWeek] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const weekMonday = forNextWeek ? getNextWeekMonday() : getCurrentWeekMonday();
  const shoppingList = useMemo(() => getShoppingList(weekMonday), [weekMonday, getShoppingList]);

  const toggleItem = (name: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const categories = Array.from(new Set(shoppingList.items.map(i => i.category)));
  const checkedCount = checkedItems.size;
  const totalCount = shoppingList.items.length;

  const weekLabel = forNextWeek
    ? `Semaine du ${weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
    : `Semaine courante`;

  return (
    <div className="space-y-4">
      {/* Toggle semaine */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
              Liste de courses
            </h3>
            <p className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              {weekLabel}
            </p>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255, 107, 53, 0.12)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}
          >
            {shoppingList.totalEstimatedBudget}
          </span>
        </div>

        {/* Toggle semaine courante / prochaine */}
        <div className="flex gap-2">
          <button
            onClick={() => setForNextWeek(false)}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: !forNextWeek ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.06)',
              color: !forNextWeek ? 'white' : 'rgba(255,255,255,0.5)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Cette semaine
          </button>
          <button
            onClick={() => setForNextWeek(true)}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: forNextWeek ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.06)',
              color: forNextWeek ? 'white' : 'rgba(255,255,255,0.5)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Semaine prochaine
          </button>
        </div>

        {/* Progression */}
        <div className="mt-3">
          <div className="flex justify-between mb-1">
            <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              Articles cochés
            </span>
            <span className="text-white/70 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
              {checkedCount}/{totalCount}
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(checkedCount / totalCount) * 100}%`,
                background: 'linear-gradient(90deg, #FF6B35, #22c55e)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Conseils drive */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.15)' }}
      >
        <p className="text-orange-400 font-semibold text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          💡 Conseils drive (commande samedi, récupération lundi)
        </p>
        <div className="space-y-1.5">
          {shoppingList.storeTips.map((tip, i) => (
            <p key={i} className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {tip}
            </p>
          ))}
        </div>
      </div>

      {/* Articles par catégorie */}
      {categories.map(category => {
        const items = shoppingList.items.filter(i => i.category === category);
        return (
          <div key={category}>
            <p
              className="text-white/50 text-xs uppercase tracking-wider mb-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {category}
            </p>
            <div className="space-y-2">
              {items.map(item => {
                const isChecked = checkedItems.has(item.name);
                return (
                  <button
                    key={item.name}
                    onClick={() => toggleItem(item.name)}
                    className="w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all duration-200"
                    style={{
                      background: isChecked ? 'rgba(34, 197, 94, 0.06)' : 'rgba(255,255,255,0.04)',
                      border: isChecked ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: isChecked ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.08)',
                        border: isChecked ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      {isChecked && <Check size={11} className="text-green-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="text-sm font-medium leading-tight"
                          style={{
                            color: isChecked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
                            textDecoration: isChecked ? 'line-through' : 'none',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {item.name}
                        </span>
                        <div className="flex-shrink-0 text-right">
                          <div
                            className="text-xs font-semibold"
                            style={{ color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}
                          >
                            {item.quantity} {item.unit}
                          </div>
                          <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {item.estimatedPrice}
                          </div>
                        </div>
                      </div>
                      {!isChecked && (
                        <p className="text-white/40 text-xs mt-1 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Bouton tout décocher */}
      {checkedCount > 0 && (
        <button
          onClick={() => setCheckedItems(new Set())}
          className="w-full py-3 rounded-xl text-white/50 text-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Inter, sans-serif' }}
        >
          Tout décocher
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
    { id: 'plan' as ActiveTab, label: 'Plan semaine', icon: Calendar },
    { id: 'courses' as ActiveTab, label: 'Courses', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      <div className="p-5">
        <h1 className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
          Nutrition
        </h1>
        <p className="text-white/50 text-sm mb-5" style={{ fontFamily: 'Inter, sans-serif' }}>
          Journal · Plan semaine · Liste de courses
        </p>

        {/* Onglets */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: activeTab === id ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'transparent',
                color: activeTab === id ? 'white' : 'rgba(255,255,255,0.4)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'journal' && <JournalTab />}
        {activeTab === 'plan' && <PlanTab />}
        {activeTab === 'courses' && <CoursesTab />}
      </div>
    </div>
  );
}
