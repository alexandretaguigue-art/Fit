// ============================================================
// NUTRITION PAGE — FitPro
// Journal alimentaire quotidien modifiable, régulation calorique automatique,
// plan hebdomadaire, liste de courses, récap hebdomadaire réalité/objectif
// ============================================================

import { useState, useMemo, useRef } from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2, Edit3, Check, ChevronLeft, ChevronRight, ShoppingCart, Calendar, BookOpen, AlertTriangle, TrendingUp, TrendingDown, BarChart2, CheckCircle, XCircle } from 'lucide-react';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import { programData } from '../lib/programData';
import { computeFoodMacros, MACRO_TARGETS, generateWeeklyMealPlan, toLocalDateKey, computeRemainingMacros } from '../lib/nutritionEngine';
import type { FoodEntry } from '../lib/nutritionEngine';
import { toast } from 'sonner';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Petit-déjeuner',
  morning_snack: 'Collation matinale',
  lunch: 'Déjeuner',
  snack: 'Collation après-midi',
  dinner: 'Dîner',
};

const MEAL_ICONS_MAP: Record<string, string> = {
  breakfast: '🍳',
  morning_snack: '🍌',
  lunch: '🍽️',
  snack: '🍊',
  dinner: '🌙',
};

// Photos Unsplash pour chaque repas
const MEAL_PHOTOS: Record<string, string> = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
  morning_snack: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&q=80',
  lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  snack: 'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?w=800&q=80',
  dinner: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
};

const MEAL_TIMES: Record<string, string> = {
  breakfast: '07h00',
  morning_snack: '10h30',
  lunch: '12h30',
  snack: '16h00',
  dinner: '19h30',
};

const MEAL_ORDER = ['breakfast', 'morning_snack', 'lunch', 'snack', 'dinner'];

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
// Clé localStorage pour les aliments personnalisés
const CUSTOM_FOODS_KEY = 'fitpro_custom_foods';

interface CustomFood {
  id: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

function getCustomFoods(): CustomFood[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_FOODS_KEY) || '[]'); } catch { return []; }
}

function saveCustomFood(food: CustomFood) {
  const foods = getCustomFoods();
  if (!foods.find(f => f.id === food.id)) {
    localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify([...foods, food]));
  }
}

function AddFoodModal({ onAdd, onClose, defaultMeal }: {
  onAdd: (entry: Omit<FoodEntry, 'id'>) => void;
  onClose: () => void;
  defaultMeal?: FoodEntry['meal'];
}) {
  const [tab, setTab] = useState<'search' | 'manual'>('search');
  const [search, setSearch] = useState('');
  type AnyFood = typeof programData.foodItems[0] | { id: string; name: string; per100g: { proteins: number; carbs: number; fats: number; calories: number }; category: string; relevanceScore?: number; relevanceReason?: string; tips?: string };
  const [selectedFood, setSelectedFood] = useState<AnyFood | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [meal, setMeal] = useState<FoodEntry['meal']>(defaultMeal ?? 'lunch');
  // Saisie manuelle
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProteins, setManualProteins] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFats, setManualFats] = useState('');
  const [saveCustom, setSaveCustom] = useState(true);
  const [customFoods] = useState<CustomFood[]>(() => getCustomFoods());

  const MODAL_MEAL_LABELS: Record<string, string> = {
    breakfast: 'Petit-déj.',
    morning_snack: '10h30',
    lunch: 'Déjeuner',
    snack: 'Collation',
    dinner: 'Dîner',
  };

  const allFoods = [
    ...programData.foodItems,
    ...customFoods.map(cf => ({
      id: cf.id,
      name: cf.name,
      per100g: { proteins: cf.proteins, carbs: cf.carbs, fats: cf.fats, calories: cf.calories },
      category: 'Mes aliments',
    })),
  ];

  const filtered = allFoods.filter(f =>
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

  const handleManualAdd = () => {
    const name = manualName.trim();
    const kcal = parseFloat(manualCalories);
    const prot = parseFloat(manualProteins) || 0;
    const carb = parseFloat(manualCarbs) || 0;
    const fat = parseFloat(manualFats) || 0;
    if (!name || isNaN(kcal) || kcal <= 0) {
      toast.error('Nom et calories obligatoires');
      return;
    }
    const id = `custom_${Date.now()}`;
    if (saveCustom) {
      saveCustomFood({ id, name, calories: kcal, proteins: prot, carbs: carb, fats: fat });
    }
    onAdd({ foodId: id, foodName: name, quantity: 1, meal, proteins: prot, carbs: carb, fats: fat, calories: kcal });
    toast.success(`${name} ajouté !`);
    onClose();
  };

  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif', color: 'white' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="flex-1 overflow-y-auto mt-16 mx-4 mb-4 rounded-2xl" style={{ background: '#1A1A22', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Ajouter un aliment</h3>
            <button onClick={onClose} className="text-white/50 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Fermer</button>
          </div>

          {/* Onglets Recherche / Saisie manuelle */}
          <div className="flex gap-2 mb-4 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <button onClick={() => setTab('search')} className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: tab === 'search' ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'transparent', color: tab === 'search' ? 'white' : 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif' }}>
              🔍 Rechercher
            </button>
            <button onClick={() => setTab('manual')} className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: tab === 'manual' ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'transparent', color: tab === 'manual' ? 'white' : 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif' }}>
              ✏️ Saisie manuelle
            </button>
          </div>

          {/* Sélecteur de repas */}
          <div className="mb-4">
            <p className="text-white/50 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Repas</p>
            <div className="flex flex-wrap gap-2">
              {MEAL_ORDER.map(m => (
                <button key={m} onClick={() => setMeal(m as FoodEntry['meal'])} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ background: meal === m ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.08)', color: meal === m ? 'white' : 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
                  {MODAL_MEAL_LABELS[m] ?? MEAL_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* ONGLET RECHERCHE */}
          {tab === 'search' && (
            <>
              <div className="mb-3">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un aliment..."
                  className="w-full text-white text-sm rounded-xl py-3 px-4"
                  style={inputStyle} autoFocus />
              </div>
              {!selectedFood && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {filtered.map(food => (
                    <button key={food.id} onClick={() => setSelectedFood(food)} className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <span className="text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{food.name}</span>
                        {food.category === 'Mes aliments' && <span className="ml-2 text-orange-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>★ Perso</span>}
                      </div>
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
            </>
          )}

          {/* ONGLET SAISIE MANUELLE */}
          {tab === 'manual' && (
            <div className="space-y-3">
              <div>
                <p className="text-white/50 text-xs mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Nom de l’aliment *</p>
                <input type="text" value={manualName} onChange={e => setManualName(e.target.value)}
                  placeholder="Ex: Pizza maison, Repas restaurant..."
                  className="w-full text-white text-sm rounded-xl py-3 px-4" style={inputStyle} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-white/50 text-xs mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Calories (kcal) *</p>
                  <input type="number" value={manualCalories} onChange={e => setManualCalories(e.target.value)}
                    placeholder="Ex: 450" className="w-full text-white text-sm rounded-xl py-3 px-4" style={inputStyle} min="0" />
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Protéines (g)</p>
                  <input type="number" value={manualProteins} onChange={e => setManualProteins(e.target.value)}
                    placeholder="Ex: 30" className="w-full text-white text-sm rounded-xl py-3 px-4" style={inputStyle} min="0" />
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Glucides (g)</p>
                  <input type="number" value={manualCarbs} onChange={e => setManualCarbs(e.target.value)}
                    placeholder="Ex: 50" className="w-full text-white text-sm rounded-xl py-3 px-4" style={inputStyle} min="0" />
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Lipides (g)</p>
                  <input type="number" value={manualFats} onChange={e => setManualFats(e.target.value)}
                    placeholder="Ex: 15" className="w-full text-white text-sm rounded-xl py-3 px-4" style={inputStyle} min="0" />
                </div>
              </div>
              {/* Aperçu */}
              {manualCalories && (
                <div className="grid grid-cols-4 gap-2">
                  {[{ label: 'Kcal', value: manualCalories, color: '#FF6B35' }, { label: 'Prot.', value: `${manualProteins || 0}g`, color: '#FF6B35' }, { label: 'Gluc.', value: `${manualCarbs || 0}g`, color: '#3b82f6' }, { label: 'Lip.', value: `${manualFats || 0}g`, color: '#a855f7' }].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="font-bold text-sm" style={{ color, fontFamily: 'Syne, sans-serif' }}>{value}</div>
                      <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Option enregistrer */}
              <button onClick={() => setSaveCustom(s => !s)} className="flex items-center gap-2 py-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: saveCustom ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.1)', border: saveCustom ? 'none' : '1px solid rgba(255,255,255,0.2)' }}>
                  {saveCustom && <Check size={12} className="text-white" />}
                </div>
                <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Enregistrer dans mes aliments pour réutiliser</span>
              </button>
              <button onClick={handleManualAdd} className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)', fontFamily: 'Syne, sans-serif' }}>
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
// COMPOSANT SWIPE TO DELETE
// ============================================================
function SwipeToDelete({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const startX = useRef<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [swiped, setSwiped] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setSwiped(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setOffsetX(Math.max(dx, -90));
  };

  const handleTouchEnd = () => {
    if (offsetX < -60) {
      setSwiped(true);
      setOffsetX(-90);
    } else {
      setOffsetX(0);
    }
    startX.current = null;
  };

  const handleReset = () => { setOffsetX(0); setSwiped(false); };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Fond rouge — action supprimer */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 90, background: 'rgba(239,68,68,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0 }}>
        <button onClick={onDelete} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Trash2 size={16} />
          <span style={{ fontSize: 10, fontFamily: 'Inter, sans-serif' }}>Supprimer</span>
        </button>
      </div>
      {/* Contenu glissant */}
      <div
        style={{ transform: `translateX(${offsetX}px)`, transition: offsetX === 0 || swiped ? 'transform 0.2s ease' : 'none', position: 'relative', zIndex: 1 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={swiped ? handleReset : undefined}
      >
        {children}
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
    return toLocalDateKey(d);
  }, [dateOffset]);

  const dayLog = getDayLog(dateKey);
  const balance = getDayBalance(dateKey);

  // Plan du jour (repas suggérés) — calcul robuste basé sur la date locale
  const weekMonday = useMemo(() => {
    // Calculer le lundi de la semaine qui contient dateKey
    const d = new Date(dateKey + 'T12:00:00');
    const dow = d.getDay();
    const daysBack = dow === 0 ? 6 : dow - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - daysBack);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [dateKey]);

  const weekPlan = useMemo(() => getWeeklyMealPlan(weekMonday), [weekMonday, getWeeklyMealPlan]);
  const dayPlan = useMemo(() => weekPlan.days.find(d => d.date === dateKey), [weekPlan, dateKey]);

  // Repas complétés (validés ou modifiés)
  const completedMeals = useMemo(() =>
    Object.entries(validatedMeals).filter(([, v]) => v !== null).map(([k]) => k),
    [validatedMeals]
  );

  // Ajustements automatiques des repas restants
  const mealAdjustmentsRaw = useMemo(() =>
    getMealAdjustments(dateKey, completedMeals),
    [dateKey, completedMeals, getMealAdjustments]
  );
  const mealAdjustments: Record<string, typeof mealAdjustmentsRaw[0]> = useMemo(() => {
    const map: Record<string, typeof mealAdjustmentsRaw[0]> = {};
    mealAdjustmentsRaw.forEach(a => { if (a) map[a.mealName] = a; });
    return map;
  }, [mealAdjustmentsRaw]);

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
      const name = m.name;
      if (mealKey === 'breakfast') return name === 'Petit-déjeuner';
      if (mealKey === 'morning_snack') return name === 'Collation matinale';
      if (mealKey === 'lunch') return name === 'Déjeuner';
      if (mealKey === 'snack') return name === 'Collation' || name.startsWith('Collation');
      if (mealKey === 'dinner') return name === 'Dîner' || name.startsWith('Dîner');
      return false;
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

  // Macros restantes (Prompt Ultime — ajustement automatique)
  const mealsConsumedCount = Object.values(validatedMeals).filter(v => v !== null).length;
  const remainingMacros = useMemo(() =>
    computeRemainingMacros(dayLog, mealsConsumedCount, 5),
    [dayLog, mealsConsumedCount]
  );

  // Index du repas actif dans le carousel
  const [activeMealIdx, setActiveMealIdx] = useState(0);
  const openMeal = MEAL_ORDER[activeMealIdx];
  const setOpenMeal = (meal: string | null) => {
    if (meal === null) return;
    const idx = MEAL_ORDER.indexOf(meal);
    if (idx !== -1) setActiveMealIdx(idx);
  };
  // Swipe carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const handleCarouselTouchStart = (e: React.TouchEvent) => { swipeStartX.current = e.touches[0].clientX; };
  const handleCarouselTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (dx < -50 && activeMealIdx < MEAL_ORDER.length - 1) setActiveMealIdx(i => i + 1);
    else if (dx > 50 && activeMealIdx > 0) setActiveMealIdx(i => i - 1);
    swipeStartX.current = null;
  };

  // Repas ajustés (Prompt Ultime — ajustement quantités à la demande)
  const [adjustedMeals, setAdjustedMeals] = useState<Record<string, Array<{ food: string; quantity: string; proteins: number; carbs: number; fats: number; calories: number }> | null>>({});

  const handleAdjustMeal = (mealKey: string, planMeal: { items: Array<{ food: string; quantity: string; proteins: number; carbs: number; fats: number; calories: number }>; totalCalories: number }) => {
    // Calcule le budget restant pour ce repas
    const mealIdx = MEAL_ORDER.indexOf(mealKey);
    const mealsLeftFromNow = MEAL_ORDER.length - mealIdx;
    const consumed = dayLog.entries.reduce((acc, e) => ({
      proteins: acc.proteins + e.proteins, carbs: acc.carbs + e.carbs, fats: acc.fats + e.fats, calories: acc.calories + e.calories
    }), { proteins: 0, carbs: 0, fats: 0, calories: 0 });
    const targetKey = dayLog.sessionType ?? (dayLog.isTrainingDay ? 'training' : 'rest');
    const target = MACRO_TARGETS[targetKey as keyof typeof MACRO_TARGETS] ?? MACRO_TARGETS.rest;
    const remainingCals = Math.max(target.calories - consumed.calories, 0);
    const mealBudget = Math.round(remainingCals / mealsLeftFromNow);
    if (mealBudget <= 0 || planMeal.totalCalories <= 0) {
      toast.info('Pas d\'ajustement nécessaire — tu es déjà à l\'objectif');
      return;
    }
    // Ajuster les quantités proportionnellement
    const ratio = mealBudget / planMeal.totalCalories;
    const adjusted = planMeal.items.map(item => {
      const qtyMatch = item.quantity.match(/(\d+(?:\.\d+)?)/);
      const originalQty = qtyMatch ? parseFloat(qtyMatch[1]) : 100;
      const unit = item.quantity.replace(/[\d.]+/, '').trim();
      const newQty = Math.round(originalQty * ratio / 5) * 5; // arrondi à 5g
      const newQtyStr = `${newQty}${unit}`;
      return {
        food: item.food,
        quantity: newQtyStr,
        proteins: Math.round(item.proteins * ratio * 10) / 10,
        carbs: Math.round(item.carbs * ratio * 10) / 10,
        fats: Math.round(item.fats * ratio * 10) / 10,
        calories: Math.round(item.calories * ratio),
      };
    });
    setAdjustedMeals(prev => ({ ...prev, [mealKey]: adjusted }));
    toast.success(`Repas ajusté pour ${mealBudget} kcal`);
  };

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

      {/* BANDEAU MACROS RESTANTES (Prompt Ultime) */}
      {mealsConsumedCount > 0 && remainingMacros.mealsLeft > 0 && (
        <div className="rounded-2xl p-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-400 text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>BUDGET RESTANT — {remainingMacros.mealsLeft} repas</span>
            <span className="text-blue-300/70 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{remainingMacros.calories} kcal</span>
          </div>
          <div className="flex gap-3 mb-2">
            <div className="text-center">
              <div className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{remainingMacros.proteins}g</div>
              <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Prot.</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{remainingMacros.carbs}g</div>
              <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Gluc.</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{remainingMacros.fats}g</div>
              <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Lip.</div>
            </div>
          </div>
          <p className="text-blue-300/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{remainingMacros.adjustmentMessage}</p>
        </div>
      )}

      {/* CAROUSEL REPAS — swipe horizontal, card active au premier plan */}
      <div
        ref={carouselRef}
        onTouchStart={handleCarouselTouchStart}
        onTouchEnd={handleCarouselTouchEnd}
        style={{ position: 'relative', overflow: 'hidden', paddingBottom: 8 }}
      >
        {/* Pastilles de navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
          {MEAL_ORDER.map((m, i) => (
            <button key={m} onClick={() => setActiveMealIdx(i)}
              style={{ width: i === activeMealIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === activeMealIdx ? '#FF6B35' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s ease', border: 'none', cursor: 'pointer', padding: 0 }} />
          ))}
        </div>

        {/* Piste de cards */}
        <div style={{ display: 'flex', gap: 12, transition: 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)', transform: `translateX(calc(${-activeMealIdx * 88}% - ${activeMealIdx * 12}px + 6%))`, willChange: 'transform' }}>
        {MEAL_ORDER.map((meal, mealIdx) => {
          const isActive = mealIdx === activeMealIdx;
          const entries = grouped[meal] ?? [];
          const mealCalories = entries.reduce((acc, e) => acc + e.calories, 0);
          const mealStatus = validatedMeals[meal];
          const isOpen = openMeal === meal;
          const planMeal = dayPlan?.meals.find(m => {
            const name = m.name;
            if (meal === 'breakfast') return name === 'Petit-déjeuner';
            if (meal === 'morning_snack') return name === 'Collation matinale';
            if (meal === 'lunch') return name === 'Déjeuner';
            if (meal === 'snack') return name === 'Collation' || name === 'Collation pré-entraînement' || name.startsWith('Collation');
            if (meal === 'dinner') return name === 'Dîner' || name === 'Dîner post-training' || name.startsWith('Dîner');
            return false;
          });
          const displayItems = adjustedMeals[meal] ?? planMeal?.items ?? [];
          const isAdjusted = !!adjustedMeals[meal];
          const plannedCals = planMeal?.totalCalories ?? 0;

          // Couleur de statut
          const statusColor = mealStatus === 'validated' ? '#22c55e'
            : mealStatus === 'modified' ? '#FF6B35'
            : 'rgba(255,255,255,0.15)';

          return (
            <div key={meal}
              onClick={() => !isActive && setActiveMealIdx(mealIdx)}
              style={{
                flexShrink: 0,
                width: '88%',
                borderRadius: 20,
                overflow: 'hidden',
                transform: isActive ? 'scale(1)' : 'scale(0.92)',
                opacity: isActive ? 1 : 0.55,
                transition: 'transform 0.35s ease, opacity 0.35s ease',
                border: `1px solid ${mealStatus === 'validated' ? 'rgba(34,197,94,0.35)' : mealStatus === 'modified' ? 'rgba(255,107,53,0.35)' : 'rgba(255,255,255,0.08)'}`,
                cursor: isActive ? 'default' : 'pointer',
              }}>

              {/* PHOTO EN HAUT — tap pour ouvrir/fermer */}
              <button className="w-full text-left relative" style={{ height: isActive ? 170 : 120, display: 'block', transition: 'height 0.35s ease' }} onClick={() => isActive ? setOpenMeal(isOpen ? null : meal) : undefined}>
                {/* Image de fond */}
                <img src={MEAL_PHOTOS[meal]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
                {/* Gradient sombre en bas pour lisibilité du texte */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,18,0.15) 0%, rgba(10,10,18,0.75) 100%)' }} />
                {/* Badge statut en haut à droite */}
                {mealStatus === 'validated' && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.85)', backdropFilter: 'blur(8px)' }}>
                    <Check size={10} className="text-white" />
                    <span className="text-white text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Mangé</span>
                  </div>
                )}
                {mealStatus === 'modified' && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(255,107,53,0.85)', backdropFilter: 'blur(8px)' }}>
                    <span className="text-white text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Modifié</span>
                  </div>
                )}
                {/* Flèche ouverture en haut à gauche */}
                <div className="absolute top-3 left-3">
                  <ChevronRight size={16} className="text-white/50 transition-transform" style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }} />
                </div>
                {/* Nom + heure en bas à gauche */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white font-bold text-base leading-tight" style={{ fontFamily: 'Syne, sans-serif', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>{MEAL_LABELS[meal]}</p>
                      <p className="text-white/70 text-xs" style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{MEAL_TIMES[meal]}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                        {mealCalories > 0 ? `${Math.round(mealCalories)} kcal` : plannedCals > 0 ? `~${plannedCals} kcal` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Détail — visible si ouvert (uniquement sur la card active) */}
              {isOpen && isActive && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

                  {/* Plan suggéré */}
                  {!mealStatus && planMeal && (
                    <div className="p-4" style={{ background: isAdjusted ? 'rgba(59,130,246,0.04)' : 'rgba(255,107,53,0.03)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold tracking-wide" style={{ color: isAdjusted ? '#60a5fa' : 'rgba(255,107,53,0.8)', fontFamily: 'Inter, sans-serif' }}>
                          {isAdjusted ? '🔄 REPAS AJUSTÉ' : 'PLAN SUGGÉRÉ'}
                        </span>
                        {!isAdjusted ? (
                          <button onClick={() => handleAdjustMeal(meal, planMeal)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', fontFamily: 'Inter, sans-serif' }}>
                            ⚖️ Ajuster
                          </button>
                        ) : (
                          <button onClick={() => setAdjustedMeals(prev => ({ ...prev, [meal]: null }))}
                            className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>Annuler</button>
                        )}
                      </div>

                      {/* Liste des aliments du plan */}
                      <div className="space-y-1.5 mb-4">
                        {displayItems.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <span className="text-white/80 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{item.food}</span>
                            <div className="text-right">
                              <span className="text-white/50 text-xs block" style={{ fontFamily: 'Inter, sans-serif' }}>{item.quantity}</span>
                              <span className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{item.calories} kcal · P{item.proteins}g</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Lien Ajouter un aliment sous le plan */}
                      <button onClick={() => { setAddModalMeal(meal as FoodEntry['meal']); setShowAddModal(true); }}
                        className="flex items-center gap-1.5 text-white/40 text-xs hover:text-white/60 transition-colors mt-1"
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                        <Plus size={11} /> Ajouter un aliment
                      </button>
                    </div>
                  )}

                  {/* Aliments déjà saisis — swipe gauche pour supprimer */}
                  {entries.length > 0 && (
                    <div style={{ borderTop: planMeal && !mealStatus ? '1px solid rgba(255,255,255,0.06)' : undefined }}>
                      {entries.map(entry => (
                        <div key={entry.id} className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#1A1A22' }}>
                          {editingEntry === entry.id ? (
                            <>
                              <span className="text-white/70 text-xs flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>{entry.foodName}</span>
                              <input type="number" value={editQty} onChange={e => setEditQty(Number(e.target.value))}
                                className="w-16 text-center text-white text-xs rounded-lg py-1.5"
                                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,107,53,0.4)', fontFamily: 'Inter, sans-serif' }} min="10" step="10" />
                              <span className="text-white/40 text-xs">g</span>
                              <button onClick={() => handleEditSave(entry.id, entry)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
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
                                  <span className="text-white/80 text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{entry.foodName}</span>
                                  <span className="text-white/40 text-xs">{entry.quantity}g</span>
                                </div>
                                <div className="flex gap-2 mt-0.5">
                                  <span className="text-white/50 text-xs">{Math.round(entry.calories)} kcal</span>
                                  <span className="text-white/30 text-xs">P:{Math.round(entry.proteins)}g G:{Math.round(entry.carbs)}g L:{Math.round(entry.fats)}g</span>
                                </div>
                              </div>
                              <button onClick={() => { setEditingEntry(entry.id); setEditQty(entry.quantity); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <Edit3 size={11} className="text-white/40" />
                              </button>
                              <button onClick={() => { deleteFoodEntry(dateKey, entry.id); toast.success('Supprimé'); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                                <Trash2 size={11} className="text-red-400" />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bouton ajouter — uniquement si repas déjà validé ou modifié */}
                  {mealStatus && (
                    <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <button onClick={() => { setAddModalMeal(meal as FoodEntry['meal']); setShowAddModal(true); }}
                        className="flex items-center gap-1.5 text-white/40 text-xs hover:text-white/70 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <Plus size={12} /> Ajouter un aliment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>{/* fin piste de cards */}
      </div>{/* fin carousel */}

      {/* Gros bouton vert Valider ce repas */}
      {(() => {
        const activeMeal = MEAL_ORDER[activeMealIdx];
        const activeDayLog = dayLog;
        const activePlanMeal = dayPlan?.meals.find(m => {
          const n = m.name;
          if (activeMeal === 'breakfast') return n === 'Petit-déjeuner';
          if (activeMeal === 'morning_snack') return n === 'Collation matinale' || n === 'Collation';
          if (activeMeal === 'lunch') return n === 'Déjeuner';
          if (activeMeal === 'afternoon_snack') return n === 'Collation' || n === 'Collation pré-entraînement' || n === 'Collation après-midi';
          if (activeMeal === 'dinner') return n === 'Dîner' || n === 'Dîner post-training';
          return false;
        });
        const activeMealStatus = validatedMeals[activeMeal] || (activeDayLog.entries.some(e => e.meal === activeMeal) ? 'modified' : null);
        if (activeMealStatus === 'validated') return (
          <div className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', fontFamily: 'Syne, sans-serif', color: '#22c55e' }}>
            <CheckCircle size={18} /> Repas validé
          </div>
        );
        return (
          <button onClick={() => {
            if (!activePlanMeal) { toast.error('Aucun plan pour ce repas'); return; }
            const itemsToValidate = adjustedMeals[activeMeal] ?? activePlanMeal.items;
            activeDayLog.entries.filter(e => e.meal === activeMeal).forEach(e => deleteFoodEntry(dateKey, e.id));
            (itemsToValidate as Array<{food: string; quantity: string; calories: number; proteins: number; carbs: number; fats: number}>).forEach(item => {
              const food = programData.foodItems.find(f => f.name.toLowerCase().includes(item.food.toLowerCase().split(' ')[0]));
              const qtyMatch = item.quantity.match(/(\d+(?:\.\d+)?)/);
              const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 100;
              if (food) { const macros = computeFoodMacros(food.id, food.name, qty, food.per100g); addFoodEntry(dateKey, { ...macros, meal: activeMeal as FoodEntry['meal'], id: nanoid() }); }
              else { addFoodEntry(dateKey, { id: nanoid(), foodId: item.food, foodName: item.food, quantity: qty, meal: activeMeal as FoodEntry['meal'], proteins: item.proteins, carbs: item.carbs, fats: item.fats, calories: item.calories }); }
            });
            setValidatedMeals(prev => ({ ...prev, [activeMeal]: 'validated' }));
            setOpenMeal(null);
            toast.success(`${MEAL_LABELS[activeMeal]} validé ✓`);
          }}
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', fontFamily: 'Syne, sans-serif', boxShadow: '0 8px 30px rgba(34,197,94,0.25)' }}>
          <CheckCircle size={18} /> Valider ce repas
        </button>
        );
      })()}

      {showAddModal && <AddFoodModal onAdd={handleAdd} onClose={() => setShowAddModal(false)} defaultMeal={addModalMeal} />}
    </div>
  );
}

// ============================================================
// ONGLET PLAN HEBDOMADAIRE — Vue 7 jours en avance
// ============================================================
function PlanTab() {
  const { getWeeklyMealPlan, getCurrentWeekMonday, getWeeklyNutritionSummary } = useFitnessTracker();
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  const weekMonday = useMemo(() => {
    const monday = getCurrentWeekMonday();
    monday.setDate(monday.getDate() + weekOffset * 7);
    return monday;
  }, [weekOffset, getCurrentWeekMonday]);

  const plan = useMemo(() => getWeeklyMealPlan(weekMonday), [weekMonday, getWeeklyMealPlan]);
  const weekStartKey = toLocalDateKey(weekMonday);
  const summary = getWeeklyNutritionSummary(weekStartKey);

  const today = toLocalDateKey(new Date());

  const weekLabel = weekOffset === 0 ? 'Cette semaine'
    : weekOffset === 1 ? 'Semaine prochaine'
    : weekOffset === -1 ? 'Semaine dernière'
    : `Semaine du ${weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;

  const DAY_EMOJIS: Record<string, string> = {
    'Lundi': '📅', 'Mardi': '📅', 'Mercredi': '📅', 'Jeudi': '📅',
    'Vendredi': '📅', 'Samedi': '📅', 'Dimanche': '📅',
  };

  const MEAL_ICONS: Record<string, string> = {
    'Petit-déjeuner': '🍳', 'Déjeuner': '🍽️', 'Collation': '🍊', 'Díner': '🌙', 'Avant de dormir': '💤',
  };

  return (
    <div className="space-y-3">
      {/* Navigation semaine */}
      <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => { setWeekOffset(w => w - 1); setExpandedDay(null); }} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ChevronLeft size={18} className="text-white/70" />
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{weekLabel}</p>
          <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            {weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — {new Date(weekMonday.getTime() + 6 * 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => { setWeekOffset(w => w + 1); setExpandedDay(null); }} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ChevronRight size={18} className="text-white/70" />
        </button>
      </div>

      {/* Raccourcis semaine rapide */}
      <div className="flex gap-2">
        {[-1, 0, 1, 2].map(offset => (
          <button key={offset} onClick={() => { setWeekOffset(offset); setExpandedDay(null); }}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: weekOffset === offset ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
              color: weekOffset === offset ? '#FF6B35' : 'rgba(255,255,255,0.35)',
              border: weekOffset === offset ? '1px solid rgba(255,107,53,0.25)' : '1px solid rgba(255,255,255,0.06)',
              fontFamily: 'Inter, sans-serif',
            }}>
            {offset === -1 ? 'Préc.' : offset === 0 ? 'Cette sem.' : offset === 1 ? 'Prochaine' : 'S+2'}
          </button>
        ))}
      </div>

      {/* Bilan semaine si données */}
      {summary.weeklyConsumed.calories > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.15)' }}>
          <p className="text-orange-400 font-semibold text-sm mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Bilan semaine enregistré</p>
          <div className="grid grid-cols-3 gap-3 mb-2">
            {[
              { label: 'Moy. kcal/j', value: Math.round(summary.weeklyConsumed.calories / 7) },
              { label: 'Moy. prot./j', value: `${Math.round(summary.weeklyConsumed.proteins / 7)}g` },
              { label: 'Prot. adéquation', value: `${Math.round((summary.weeklyConsumed.proteins / summary.weeklyTarget.proteins) * 100)}%` }
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</div>
                <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</div>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{summary.globalRecommendation}</p>
        </div>
      )}

      {/* 7 jours */}
      {plan.days.map(day => {
        const isToday = day.date === today;
        const isPast = day.date < today;
        const isExpanded = expandedDay === day.date;

        return (
          <div key={day.date} className="rounded-2xl overflow-hidden"
            style={{
              background: isToday ? 'rgba(255,107,53,0.06)' : 'rgba(255,255,255,0.03)',
              border: isToday ? '1px solid rgba(255,107,53,0.3)' : isExpanded ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.07)',
              opacity: isPast && !isToday ? 0.7 : 1,
            }}>
            {/* En-tête du jour */}
            <button className="w-full p-4 flex items-center gap-3 text-left" onClick={() => setExpandedDay(isExpanded ? null : day.date)}>
              {/* Date badge */}
              <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                style={{ background: isToday ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.06)', border: isToday ? '1px solid rgba(255,107,53,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-xs font-bold" style={{ color: isToday ? '#FF6B35' : 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
                  {new Date(day.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}
                </span>
                <span className="text-white font-black text-lg leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {new Date(day.date + 'T12:00:00').getDate()}
                </span>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{day.dayName}</span>
                  {isToday && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,107,53,0.2)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>Aujourd'hui</span>}
                  {day.isTrainingDay && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>🏋️ {day.sessionName}</span>}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white/70 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{Math.round(day.totalMacros.calories)} kcal</span>
                  <span className="text-white/35 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>P:{Math.round(day.totalMacros.proteins)}g</span>
                  <span className="text-white/35 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>G:{Math.round(day.totalMacros.carbs)}g</span>
                  <span className="text-white/35 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>L:{Math.round(day.totalMacros.fats)}g</span>
                </div>
              </div>
              <span className="text-white/30 text-xl flex-shrink-0">{isExpanded ? '−' : '+'}</span>
            </button>

            {/* Détail des repas */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {day.meals.map((meal, idx) => {
                  const mealKey = `${day.date}-${idx}`;
                  const isMealExpanded = expandedMeal === mealKey;
                  return (
                    <div key={idx} style={{ borderBottom: idx < day.meals.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      {/* En-tête repas */}
                      <button className="w-full px-4 py-3 flex items-center justify-between text-left" onClick={() => setExpandedMeal(isMealExpanded ? null : mealKey)}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{MEAL_ICONS[meal.name] ?? '🍽️'}</span>
                          <div>
                            <span className="text-white/80 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{meal.time} — {meal.name}</span>
                            <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{meal.totalCalories} kcal · {meal.items.length} aliments</p>
                          </div>
                        </div>
                        <span className="text-white/25 text-sm">{isMealExpanded ? '−' : '+'}</span>
                      </button>

                      {/* Détail aliments */}
                      {isMealExpanded && (
                        <div className="px-4 pb-3 space-y-2">
                          {meal.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#FF6B35' }} />
                                <span className="text-white/80 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{item.food}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-white/60 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{item.quantity}</span>
                                <p className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{item.calories} kcal · P:{item.proteins}g</p>
                              </div>
                            </div>
                          ))}
                          {/* Total repas */}
                          <div className="flex justify-between pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Total repas</span>
                            <div className="flex gap-3">
                              <span className="text-white/60 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{meal.totalCalories} kcal</span>
                              <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>P:{meal.items.reduce((s, i) => s + i.proteins, 0)}g</span>
                              <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>G:{meal.items.reduce((s, i) => s + i.carbs, 0)}g</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
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

  const verdictColors: Record<string, string> = { optimal: '#22c55e', surplus: '#eab308', deficit: '#3b82f6', protein_low: '#ef4444' };
  const verdictLabels: Record<string, string> = { optimal: '✅ Optimal', surplus: '📈 Surplus', deficit: '📉 Déficit', protein_low: '⚠️ Protéines faibles' };
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
      <div className="rounded-2xl p-5" style={{ background: `${verdictColors[recap.weeklyStatus] ?? '#FF6B35'}08`, border: `1px solid ${verdictColors[recap.weeklyStatus] ?? '#FF6B35'}25` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: verdictColors[recap.weeklyStatus] ?? '#FF6B35' }}>
            {verdictLabels[recap.weeklyStatus] ?? '📊'}
          </div>
          <div>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{recap.globalRecommendation}</p>
          </div>
        </div>
      </div>

      {/* Totaux semaine — Réalité vs Objectif */}
      {recap.weeklyConsumed.calories > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white/60 text-xs uppercase tracking-wider mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Totaux semaine — Réalité / Objectif</p>
          <div className="space-y-3">
            {[
              { label: 'Calories', consumed: recap.weeklyConsumed.calories, target: recap.weeklyTarget.calories, unit: 'kcal', color: '#FF6B35' },
              { label: 'Protéines', consumed: recap.weeklyConsumed.proteins, target: recap.weeklyTarget.proteins, unit: 'g', color: '#ef4444' },
              { label: 'Glucides', consumed: recap.weeklyConsumed.carbs, target: recap.weeklyTarget.carbs, unit: 'g', color: '#3b82f6' },
              { label: 'Lipides', consumed: recap.weeklyConsumed.fats, target: recap.weeklyTarget.fats, unit: 'g', color: '#a855f7' },
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
            <span className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: (recap.weeklyConsumed.proteins / recap.weeklyTarget.proteins) >= 0.9 ? '#22c55e' : (recap.weeklyConsumed.proteins / recap.weeklyTarget.proteins) >= 0.75 ? '#eab308' : '#ef4444' }}>
              {Math.round((recap.weeklyConsumed.proteins / recap.weeklyTarget.proteins) * 100)}%
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Surplus/Déficit semaine</span>
            <span className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: Math.abs(recap.weeklyConsumed.calories - recap.weeklyTarget.calories) < 500 ? '#22c55e' : '#eab308' }}>
              {recap.weeklyConsumed.calories - recap.weeklyTarget.calories > 0 ? '+' : ''}{Math.round(recap.weeklyConsumed.calories - recap.weeklyTarget.calories)} kcal
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
                <span className="text-xs font-semibold" style={{ color: Math.abs(day.consumed.calories - day.target.calories) < 200 ? '#22c55e' : '#eab308', fontFamily: 'Inter, sans-serif' }}>
                  {day.consumed.calories - day.target.calories > 0 ? '+' : ''}{Math.round(day.consumed.calories - day.target.calories)} kcal
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
                    className="rounded-2xl overflow-hidden transition-all duration-200"
                    style={{ background: isChecked ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.04)', border: isChecked ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.08)', opacity: isChecked ? 0.55 : 1 }}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Checkbox */}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer"
                        style={{ background: isChecked ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)', border: isChecked ? '2px solid rgba(34,197,94,0.5)' : '1px solid rgba(255,255,255,0.15)' }}
                        onClick={() => toggleItem(itemKey)}>
                        {isChecked && <Check size={13} className="text-green-400" />}
                      </div>
                      {/* Photo produit */}
                      {item.imageUrl && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => toggleItem(itemKey)}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      )}
                      {/* Infos produit */}
                      <div className="flex-1 min-w-0" onClick={() => toggleItem(itemKey)} style={{ cursor: 'pointer' }}>
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
                      {/* Lien Intermarché */}
                      {item.shopUrl && (
                        <a href={item.shopUrl} target="_blank" rel="noopener noreferrer"
                          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.2)' }}
                          onClick={e => e.stopPropagation()}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
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
