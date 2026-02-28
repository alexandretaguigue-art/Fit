// DESIGN: "Coach Nocturne" — Page Nutrition
// Scores de pertinence des aliments, macros cibles, plan journalier

import { useState } from 'react';
import { programData, macroTargets } from '../lib/programData';
import ScoreRing from '../components/ScoreRing';

const NUTRITION_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/nutrition-bg-TRiDYw5MPXJqdp69uT6rs4.webp";

const categoryLabels: Record<string, string> = {
  proteins: 'Protéines',
  carbs: 'Glucides',
  fats: 'Lipides',
  vegetables: 'Légumes',
};

const categoryColors: Record<string, string> = {
  proteins: '#FF6B35',
  carbs: '#3b82f6',
  fats: '#a855f7',
  vegetables: '#22c55e',
};

const mealPlan = [
  {
    time: '07h00',
    name: 'Petit-déjeuner',
    items: ['100g flocons d\'avoine', '30g Whey Isolate', '1 banane', '1 poignée d\'amandes'],
    macros: { proteins: 45, carbs: 95, fats: 15, calories: 695 },
  },
  {
    time: '12h30',
    name: 'Déjeuner',
    items: ['150g blanc de poulet', '300g patate douce', 'Légumes verts à volonté', '1 c.s. huile d\'olive'],
    macros: { proteins: 45, carbs: 65, fats: 15, calories: 575 },
  },
  {
    time: '16h00',
    name: 'Collation pré-training',
    items: ['2 œufs durs', '1 pomme', '30g amandes'],
    macros: { proteins: 18, carbs: 30, fats: 18, calories: 346 },
  },
  {
    time: '19h30',
    name: 'Dîner post-training',
    items: ['150g saumon', '100g riz basmati (cru)', 'Légumes verts à volonté'],
    macros: { proteins: 38, carbs: 90, fats: 20, calories: 692 },
  },
  {
    time: '22h00',
    name: 'Avant de dormir',
    items: ['250g fromage blanc 0%', 'Fruits rouges (optionnel)'],
    macros: { proteins: 20, carbs: 10, fats: 0, calories: 120 },
  },
];

export default function NutritionPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedFood, setExpandedFood] = useState<string | null>(null);

  const categories = ['all', 'proteins', 'carbs', 'fats', 'vegetables'];
  const filteredFoods = activeCategory === 'all'
    ? programData.foodItems
    : programData.foodItems.filter(f => f.category === activeCategory);

  const totalMacros = mealPlan.reduce(
    (acc, meal) => ({
      proteins: acc.proteins + meal.macros.proteins,
      carbs: acc.carbs + meal.macros.carbs,
      fats: acc.fats + meal.macros.fats,
      calories: acc.calories + meal.macros.calories,
    }),
    { proteins: 0, carbs: 0, fats: 0, calories: 0 }
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      {/* Header */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={NUTRITION_IMAGE}
          alt="Nutrition"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.45)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(15,15,20,0.3), rgba(15,15,20,1))' }}
        />
        <div className="absolute bottom-4 left-5">
          <p className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Plan nutritionnel</p>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Nutrition
          </h1>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-2">
        {/* Macros cibles */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-white/50 text-xs uppercase tracking-wider mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Objectifs journaliers
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calories', value: macroTargets.calories, unit: 'kcal', color: '#FF6B35', percent: 100 },
              { label: 'Protéines', value: macroTargets.proteins, unit: 'g', color: '#FF6B35', percent: (macroTargets.proteins * 4 / macroTargets.calories) * 100 },
              { label: 'Glucides', value: macroTargets.carbs, unit: 'g', color: '#3b82f6', percent: (macroTargets.carbs * 4 / macroTargets.calories) * 100 },
              { label: 'Lipides', value: macroTargets.fats, unit: 'g', color: '#a855f7', percent: (macroTargets.fats * 9 / macroTargets.calories) * 100 },
            ].map(({ label, value, unit, color, percent }) => (
              <div
                key={label}
                className="p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-white font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color }}>
                    {value}
                  </span>
                  <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{unit}</span>
                </div>
                <div className="h-1.5 rounded-full mb-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${Math.min(percent, 100)}%`, background: color }}
                  />
                </div>
                <p className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</p>
              </div>
            ))}
          </div>
          <div
            className="mt-3 p-3 rounded-xl"
            style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.15)' }}
          >
            <p className="text-orange-400/80 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="font-semibold">Principe clé :</span> Léger surplus calorique de ~300 kcal/jour pour favoriser la prise de muscle tout en limitant la prise de gras. Ajuste selon ton évolution toutes les 2 semaines.
            </p>
          </div>
        </div>

        {/* Plan journalier type */}
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Journée type — {totalMacros.calories} kcal
          </p>
          <div className="space-y-2">
            {mealPlan.map((meal, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}
                    >
                      {meal.time}
                    </span>
                    <h4 className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {meal.name}
                    </h4>
                  </div>
                  <span
                    className="text-white/60 text-xs font-semibold"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {meal.macros.calories} kcal
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  {meal.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#FF6B35' }} />
                      <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  {[
                    { label: 'P', value: meal.macros.proteins, color: '#FF6B35' },
                    { label: 'G', value: meal.macros.carbs, color: '#3b82f6' },
                    { label: 'L', value: meal.macros.fats, color: '#a855f7' },
                  ].map(({ label, value, color }) => (
                    <span
                      key={label}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${color}15`, color, fontFamily: 'Inter, sans-serif' }}
                    >
                      {label}: {value}g
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aliments et scores */}
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Scores de pertinence des aliments
          </p>
          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                style={{
                  background: activeCategory === cat
                    ? (cat === 'all' ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : `${categoryColors[cat]}25`)
                    : 'rgba(255,255,255,0.06)',
                  color: activeCategory === cat
                    ? (cat === 'all' ? 'white' : categoryColors[cat])
                    : 'rgba(255,255,255,0.5)',
                  border: activeCategory === cat && cat !== 'all'
                    ? `1px solid ${categoryColors[cat]}40`
                    : '1px solid transparent',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {cat === 'all' ? 'Tous' : categoryLabels[cat]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredFoods.sort((a, b) => b.relevanceScore - a.relevanceScore).map(food => (
              <div
                key={food.id}
                className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: expandedFood === food.id
                    ? `1px solid ${categoryColors[food.category]}40`
                    : '1px solid rgba(255,255,255,0.08)',
                }}
                onClick={() => setExpandedFood(expandedFood === food.id ? null : food.id)}
              >
                <div className="p-3 flex items-center gap-3">
                  <ScoreRing score={food.relevanceScore} size={52} strokeWidth={4} showLabel={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {food.name}
                      </h4>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: `${categoryColors[food.category]}15`,
                          color: categoryColors[food.category],
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {categoryLabels[food.category]}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        P: {food.per100g.proteins}g
                      </span>
                      <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        G: {food.per100g.carbs}g
                      </span>
                      <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        L: {food.per100g.fats}g
                      </span>
                      <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {food.per100g.calories} kcal
                      </span>
                    </div>
                  </div>
                </div>
                {expandedFood === food.id && (
                  <div
                    className="px-4 pb-4 space-y-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="pt-3">
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Pourquoi ce score ?
                      </p>
                      <p className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {food.relevanceReason}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-xl"
                      style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.15)' }}
                    >
                      <p className="text-orange-400/80 text-xs font-medium mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Conseil
                      </p>
                      <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {food.tips}
                      </p>
                    </div>
                    {food.timing && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Meilleur moment :
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: 'rgba(255, 107, 53, 0.12)',
                            color: '#FF6B35',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {food.timing}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
