'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { StickerItem, StickerAnimation } from '@/lib/types';
import { useStore } from '@/lib/store';

type AnimTarget = Record<string, string | number | (string | number)[]>;
const ANIM_VARIANTS: Record<StickerAnimation, AnimTarget> = {
  none: {},
  spin: { rotate: 360 },
  pulse: { scale: [1, 1.3, 1] },
  bounce: { y: [0, -14, 0] },
  float: { y: [0, -8, 0], rotate: [-5, 5, -5] },
  drive: { x: [0, 10, 0] },
  shake: { rotate: [-8, 8, -8, 8, 0] },
};

const ANIM_TRANSITIONS: Record<StickerAnimation, object> = {
  none: {},
  spin: { duration: 2, repeat: Infinity, ease: 'linear' },
  pulse: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
  bounce: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
  float: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  drive: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
  shake: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
};

const ANIM_LABELS: Record<StickerAnimation, string> = {
  none: 'Sabit', spin: '↺ Dön', pulse: '💓 At',
  bounce: '↕ Zıpla', float: '〰 Sal', drive: '→ Sürükle', shake: '⤢ Titre',
};

interface Props {
  sticker: StickerItem;
  pageId: string;
}

export default function EmojiSticker({ sticker, pageId }: Props) {
  const { updateSticker, removeSticker } = useStore();
  const [showOpts, setShowOpts] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  function handleDragStart(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('.opts-panel')) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: sticker.x, py: sticker.y };
    function onMove(ev: MouseEvent) {
      updateSticker(pageId, sticker.id, {
        x: dragStart.current.px + ev.clientX - dragStart.current.mx,
        y: dragStart.current.py + ev.clientY - dragStart.current.my,
      });
    }
    function onUp() {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const animProps = sticker.animation !== 'none'
    ? { animate: ANIM_VARIANTS[sticker.animation] as any, transition: ANIM_TRANSITIONS[sticker.animation] }
    : {};

  return (
    <div
      style={{
        position: 'absolute', left: sticker.x, top: sticker.y,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none', zIndex: dragging ? 200 : 15,
      }}
      onMouseDown={handleDragStart}
      onDoubleClick={e => { e.stopPropagation(); removeSticker(pageId, sticker.id); setShowOpts(false); }}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <motion.div
          {...animProps}
          style={{ fontSize: sticker.size, transform: `rotate(${sticker.rotation}deg)`, display: 'inline-block' }}
        >
          {sticker.emoji}
        </motion.div>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setShowOpts(v => !v); }}
          style={{
            position: 'absolute', top: -6, right: -6,
            background: 'rgba(0,0,0,0.28)', border: 'none', borderRadius: '50%',
            width: 16, height: 16, cursor: 'pointer', fontSize: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', lineHeight: 1, padding: 0,
          }}
        >⚙</button>
      </div>

      {showOpts && (
        <div className="opts-panel" onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: sticker.size + 6, left: 0, zIndex: 300,
            background: '#faf8f5', borderRadius: 12, padding: 10,
            boxShadow: '0 6px 24px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.08)',
            minWidth: 180,
          }}
        >
          {/* Size */}
          <div style={{ fontSize: 10, color: '#6a6460', marginBottom: 3 }}>
            Boyut: {sticker.size}px
          </div>
          <input type="range" min={16} max={80} value={sticker.size}
            onChange={e => updateSticker(pageId, sticker.id, { size: +e.target.value })}
            style={{ width: '100%', marginBottom: 8, accentColor: '#5a6476' }} />

          {/* Animation */}
          <div style={{ fontSize: 10, color: '#6a6460', marginBottom: 4 }}>Animasyon</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
            {(Object.keys(ANIM_LABELS) as StickerAnimation[]).map(a => (
              <button key={a}
                onClick={() => updateSticker(pageId, sticker.id, { animation: a })}
                style={{
                  padding: '2px 7px', borderRadius: 6, fontSize: 10,
                  background: sticker.animation === a ? '#2c2a27' : '#ede9e3',
                  color: sticker.animation === a ? '#e8e0d0' : '#4a4640',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {ANIM_LABELS[a]}
              </button>
            ))}
          </div>

          <button
            onClick={() => { removeSticker(pageId, sticker.id); setShowOpts(false); }}
            style={{
              width: '100%', padding: '5px 0', borderRadius: 8, fontSize: 11,
              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
              cursor: 'pointer',
            }}
          >
            🗑️ Sil
          </button>
        </div>
      )}
    </div>
  );
}
