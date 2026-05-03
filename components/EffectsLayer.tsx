'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PageEffect } from '@/lib/types';

interface Props {
  effects: PageEffect[];
  isActive: boolean;
}

// ── Snow ──
function SnowEffect() {
  const flakes = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i * 5.5) % 100}%`,
    size: 8 + (i % 5) * 3,
    delay: (i * 0.4) % 4,
    duration: 4 + (i % 4),
  }));
  return (
    <>
      {flakes.map(f => (
        <motion.div key={f.id}
          style={{
            position: 'absolute', left: f.left, top: -20,
            fontSize: f.size, pointerEvents: 'none', zIndex: 5, userSelect: 'none',
          }}
          animate={{ y: ['0%', '110%'], x: [0, (f.id % 2 === 0 ? 10 : -10), 0], opacity: [0.9, 0.6, 0] }}
          transition={{ duration: f.duration, repeat: Infinity, delay: f.delay, ease: 'linear' }}
        >
          ❄️
        </motion.div>
      ))}
    </>
  );
}

// ── Floating Hearts ──
function HeartsEffect() {
  const hearts = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${8 + i * 7.5}%`,
    size: 14 + (i % 4) * 4,
    delay: (i * 0.5) % 5,
    duration: 3.5 + (i % 3),
  }));
  return (
    <>
      {hearts.map(h => (
        <motion.div key={h.id}
          style={{
            position: 'absolute', left: h.left, bottom: -10,
            fontSize: h.size, pointerEvents: 'none', zIndex: 5, userSelect: 'none',
          }}
          animate={{ y: [0, -280], opacity: [0.9, 0.7, 0], scale: [1, 1.1, 0.8] }}
          transition={{ duration: h.duration, repeat: Infinity, delay: h.delay, ease: 'easeOut' }}
        >
          ❤️
        </motion.div>
      ))}
    </>
  );
}

// ── Spinning Daisy ──
function DaisyEffect() {
  const daisies = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: `${10 + i * 14}%`,
    top: `${15 + (i % 3) * 25}%`,
    size: 16 + (i % 3) * 6,
  }));
  return (
    <>
      {daisies.map(d => (
        <motion.div key={d.id}
          style={{
            position: 'absolute', left: d.left, top: d.top,
            fontSize: d.size, pointerEvents: 'none', zIndex: 5, userSelect: 'none', opacity: 0.55,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4 + d.id, repeat: Infinity, ease: 'linear' }}
        >
          🌼
        </motion.div>
      ))}
    </>
  );
}

// ── Cars ──
function CarsEffect() {
  const cars = [
    { id: 0, top: '72%', size: 22, duration: 6, delay: 0, emoji: '🚗' },
    { id: 1, top: '80%', size: 18, duration: 8, delay: 2.5, emoji: '🚕' },
    { id: 2, top: '64%', size: 20, duration: 7, delay: 4, emoji: '🚙' },
  ];
  return (
    <>
      {cars.map(c => (
        <motion.div key={c.id}
          style={{
            position: 'absolute', top: c.top, fontSize: c.size,
            pointerEvents: 'none', zIndex: 5, userSelect: 'none',
          }}
          animate={{ x: ['-10%', '110%'] }}
          transition={{ duration: c.duration, repeat: Infinity, delay: c.delay, ease: 'linear' }}
        >
          {c.emoji}
        </motion.div>
      ))}
    </>
  );
}

// ── Spinning Football ──
function FootballEffect() {
  const balls = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    left: `${15 + i * 20}%`,
    top: `${20 + (i % 2) * 40}%`,
    size: 18 + (i % 2) * 8,
  }));
  return (
    <>
      {balls.map(b => (
        <motion.div key={b.id}
          style={{
            position: 'absolute', left: b.left, top: b.top,
            fontSize: b.size, pointerEvents: 'none', zIndex: 5, userSelect: 'none', opacity: 0.6,
          }}
          animate={{ rotate: 360, y: [0, -12, 0] }}
          transition={{ rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' }, y: { duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: b.id * 0.3 } }}
        >
          ⚽
        </motion.div>
      ))}
    </>
  );
}

// ── Stars ──
function StarsEffect() {
  const stars = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${(i * 7) % 95}%`,
    top: `${(i * 11) % 90}%`,
    size: 10 + (i % 4) * 4,
    delay: (i * 0.3) % 3,
  }));
  return (
    <>
      {stars.map(s => (
        <motion.div key={s.id}
          style={{
            position: 'absolute', left: s.left, top: s.top,
            fontSize: s.size, pointerEvents: 'none', zIndex: 5, userSelect: 'none',
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 2 + s.id * 0.2, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        >
          ⭐
        </motion.div>
      ))}
    </>
  );
}

// ── Bubbles ──
function BubblesEffect() {
  const bubbles = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    left: `${(i * 9 + 5) % 92}%`,
    size: 12 + (i % 4) * 5,
    delay: (i * 0.6) % 5,
    duration: 4 + (i % 3),
  }));
  return (
    <>
      {bubbles.map(b => (
        <motion.div key={b.id}
          style={{
            position: 'absolute', left: b.left, bottom: -10,
            fontSize: b.size, pointerEvents: 'none', zIndex: 5, userSelect: 'none',
          }}
          animate={{ y: [0, -320], opacity: [0.8, 0.5, 0], x: [0, (b.id % 2 === 0 ? 15 : -15), 0] }}
          transition={{ duration: b.duration, repeat: Infinity, delay: b.delay, ease: 'easeOut' }}
        >
          🫧
        </motion.div>
      ))}
    </>
  );
}

export default function EffectsLayer({ effects, isActive }: Props) {
  if (!isActive || effects.length === 0) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 4 }}>
      {effects.includes('snow') && <SnowEffect />}
      {effects.includes('hearts') && <HeartsEffect />}
      {effects.includes('daisy') && <DaisyEffect />}
      {effects.includes('cars') && <CarsEffect />}
      {effects.includes('football') && <FootballEffect />}
      {effects.includes('stars') && <StarsEffect />}
      {effects.includes('bubbles') && <BubblesEffect />}
    </div>
  );
}
