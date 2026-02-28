// DESIGN: "Coach Nocturne" — Navigation principale
// Barre de navigation fixe en bas sur mobile, sidebar sur desktop

import { useLocation } from 'wouter';
import { Dumbbell, Utensils, TrendingUp, Lightbulb, Home } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Accueil', icon: Home },
  { path: '/workout', label: 'Séances', icon: Dumbbell },
  { path: '/nutrition', label: 'Nutrition', icon: Utensils },
  { path: '/progress', label: 'Progrès', icon: TrendingUp },
  { path: '/tips', label: 'Conseils', icon: Lightbulb },
];

export default function Nav() {
  const [location, navigate] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: 'rgba(12, 12, 18, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200"
              style={{
                background: isActive ? 'rgba(255, 107, 53, 0.12)' : 'transparent',
              }}
            >
              <Icon
                size={20}
                style={{
                  color: isActive ? '#FF6B35' : 'rgba(255,255,255,0.4)',
                  transition: 'color 0.2s ease',
                }}
              />
              <span
                className="text-xs font-medium"
                style={{
                  color: isActive ? '#FF6B35' : 'rgba(255,255,255,0.4)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  transition: 'color 0.2s ease',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
