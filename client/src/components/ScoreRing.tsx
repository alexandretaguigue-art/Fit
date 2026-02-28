// DESIGN: "Coach Nocturne" — Composant ScoreRing
// Jauge circulaire animée pour les scores de pertinence

import { useEffect, useRef } from 'react';

interface ScoreRingProps {
  score: number; // 0-100
  size?: number; // px
  strokeWidth?: number;
  label?: string;
  showLabel?: boolean;
  animate?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#84cc16';
  if (score >= 60) return '#eab308';
  return '#ef4444';
}

function getScoreLabel(score: number): string {
  if (score >= 95) return 'Optimal';
  if (score >= 85) return 'Excellent';
  if (score >= 75) return 'Très bon';
  if (score >= 60) return 'Bon';
  return 'Acceptable';
}

export default function ScoreRing({
  score,
  size = 80,
  strokeWidth = 6,
  label,
  showLabel = true,
  animate = true,
}: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  useEffect(() => {
    if (!animate || !circleRef.current) return;
    const circle = circleRef.current;
    circle.style.strokeDashoffset = `${circumference}`;
    const timer = setTimeout(() => {
      circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      circle.style.strokeDashoffset = `${offset}`;
    }, 100);
    return () => clearTimeout(timer);
  }, [score, circumference, offset, animate]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Score circle */}
          <circle
            ref={circleRef}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animate ? circumference : offset}
            style={!animate ? {} : undefined}
          />
        </svg>
        {/* Score text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          <span className="font-bold leading-none" style={{ color, fontSize: size * 0.22 }}>
            {score}
          </span>
          <span className="text-white/40 leading-none" style={{ fontSize: size * 0.13 }}>
            /100
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          {label && (
            <p className="text-white/60 text-xs leading-tight">{label}</p>
          )}
          <p className="text-xs font-medium" style={{ color }}>
            {getScoreLabel(score)}
          </p>
        </div>
      )}
    </div>
  );
}
