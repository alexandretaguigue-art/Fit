// ============================================================
// DESIGN: "Coach Nocturne" — Hook de gestion du journal fitness
// Gère la persistance des données dans localStorage
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { SessionLog, ProgressEntry } from '../lib/programData';

interface FitnessData {
  sessionLogs: SessionLog[];
  progressEntries: ProgressEntry[];
  currentWeek: number;
  startDate: string | null;
}

const STORAGE_KEY = 'fitpro_data';

const defaultData: FitnessData = {
  sessionLogs: [],
  progressEntries: [],
  currentWeek: 1,
  startDate: null,
};

export function useFitnessTracker() {
  const [data, setData] = useState<FitnessData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading fitness data:', e);
    }
    return defaultData;
  });

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving fitness data:', e);
    }
  }, [data]);

  // Démarrer le programme
  const startProgram = useCallback(() => {
    setData(prev => ({
      ...prev,
      startDate: new Date().toISOString(),
      currentWeek: 1,
    }));
  }, []);

  // Calculer la semaine courante
  const getCurrentWeek = useCallback((): number => {
    if (!data.startDate) return 1;
    const start = new Date(data.startDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(1, Math.floor(diffDays / 7) + 1), 12);
  }, [data.startDate]);

  // Enregistrer une séance
  const logSession = useCallback((log: SessionLog) => {
    setData(prev => ({
      ...prev,
      sessionLogs: [...prev.sessionLogs.filter(l => l.sessionId !== log.sessionId || l.date !== log.date), log],
    }));
  }, []);

  // Récupérer les logs d'une séance
  const getSessionLogs = useCallback((sessionId: string): SessionLog[] => {
    return data.sessionLogs
      .filter(l => l.sessionId === sessionId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.sessionLogs]);

  // Récupérer le dernier log d'une séance
  const getLastSessionLog = useCallback((sessionId: string): SessionLog | null => {
    const logs = getSessionLogs(sessionId);
    return logs.length > 0 ? logs[0] : null;
  }, [getSessionLogs]);

  // Ajouter une entrée de progression
  const addProgressEntry = useCallback((entry: ProgressEntry) => {
    setData(prev => ({
      ...prev,
      progressEntries: [...prev.progressEntries, entry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    }));
  }, []);

  // Calculer la progression d'un exercice
  const getExerciseProgress = useCallback((exerciseId: string) => {
    const allLogs = data.sessionLogs.flatMap(log =>
      log.exercises
        .filter(e => e.exerciseId === exerciseId)
        .map(e => ({
          date: log.date,
          maxWeight: Math.max(...e.sets.map(s => s.weight), 0),
          totalVolume: e.sets.reduce((acc, s) => acc + s.weight * s.reps, 0),
        }))
    );
    return allLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data.sessionLogs]);

  // Analyser la performance d'une séance et donner des conseils
  const analyzeSession = useCallback((log: SessionLog): {
    verdict: 'excellent' | 'good' | 'average' | 'poor';
    score: number;
    feedback: string[];
    suggestions: string[];
  } => {
    const completedSets = log.exercises.flatMap(e => e.sets.filter(s => s.completed));
    const totalSets = log.exercises.flatMap(e => e.sets);
    const completionRate = totalSets.length > 0 ? completedSets.length / totalSets.length : 0;

    const score = Math.round(
      (completionRate * 40) +
      (log.perceivedDifficulty >= 7 ? 30 : log.perceivedDifficulty * 3) +
      (log.energyLevel >= 6 ? 30 : log.energyLevel * 5)
    );

    const feedback: string[] = [];
    const suggestions: string[] = [];

    if (completionRate < 0.8) {
      feedback.push(`Tu as complété ${Math.round(completionRate * 100)}% des séries prévues.`);
      suggestions.push("Réduis légèrement les charges pour la prochaine séance afin de compléter toutes les séries.");
    } else if (completionRate === 1) {
      feedback.push("Toutes les séries complétées — excellent travail !");
      suggestions.push("Si la difficulté était ≤ 7/10, augmente les charges de 2.5-5kg la prochaine fois.");
    }

    if (log.perceivedDifficulty < 6) {
      suggestions.push("La séance était trop facile. Augmente les charges ou réduis les temps de repos.");
    } else if (log.perceivedDifficulty > 9) {
      suggestions.push("La séance était très difficile. Assure-toi de bien dormir et de manger suffisamment avant la prochaine.");
    }

    if (log.energyLevel < 5) {
      suggestions.push("Niveau d'énergie bas — vérifie ton alimentation pré-training et ton sommeil.");
    }

    const verdict: 'excellent' | 'good' | 'average' | 'poor' =
      score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'average' : 'poor';

    return { verdict, score, feedback, suggestions };
  }, []);

  // Calculer le poids suggéré pour la prochaine séance
  const getSuggestedWeight = useCallback((exerciseId: string, currentWeight: number, completedAllSets: boolean, difficulty: number): {
    suggestedWeight: number;
    message: string;
    direction: 'up' | 'same' | 'down';
  } => {
    if (!completedAllSets) {
      return {
        suggestedWeight: Math.max(currentWeight - 2.5, 0),
        message: "Tu n'as pas complété toutes les séries. Réduis légèrement la charge.",
        direction: 'down',
      };
    }

    if (difficulty <= 6) {
      const increase = currentWeight >= 40 ? 5 : 2.5;
      return {
        suggestedWeight: currentWeight + increase,
        message: `Séance trop facile ! Augmente de ${increase}kg la prochaine fois.`,
        direction: 'up',
      };
    }

    if (difficulty >= 8 && completedAllSets) {
      return {
        suggestedWeight: currentWeight + 2.5,
        message: "Toutes les séries complétées avec une bonne difficulté. Augmente de 2.5kg.",
        direction: 'up',
      };
    }

    return {
      suggestedWeight: currentWeight,
      message: "Garde la même charge et concentre-toi sur la qualité d'exécution.",
      direction: 'same',
    };
  }, []);

  // Statistiques globales
  const getStats = useCallback(() => {
    const totalSessions = data.sessionLogs.length;
    const totalVolume = data.sessionLogs.reduce((acc, log) =>
      acc + log.exercises.reduce((eAcc, e) =>
        eAcc + e.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.weight * s.reps : 0), 0), 0), 0);

    const latestProgress = data.progressEntries[data.progressEntries.length - 1];
    const firstProgress = data.progressEntries[0];

    const weightGain = latestProgress && firstProgress
      ? latestProgress.weight - firstProgress.weight
      : 0;

    const armGain = latestProgress?.armCircumference && firstProgress?.armCircumference
      ? latestProgress.armCircumference - firstProgress.armCircumference
      : 0;

    const thighGain = latestProgress?.thighCircumference && firstProgress?.thighCircumference
      ? latestProgress.thighCircumference - firstProgress.thighCircumference
      : 0;

    return {
      totalSessions,
      totalVolume,
      weightGain,
      armGain,
      thighGain,
      currentWeek: getCurrentWeek(),
    };
  }, [data, getCurrentWeek]);

  return {
    data,
    startProgram,
    getCurrentWeek,
    logSession,
    getSessionLogs,
    getLastSessionLog,
    addProgressEntry,
    getExerciseProgress,
    analyzeSession,
    getSuggestedWeight,
    getStats,
  };
}
