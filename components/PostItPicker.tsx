'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

type Pattern = 'none' | 'hearts' | 'flowers' | 'stars' | 'dots';

const PATTERN_SYMBOL: Record<Pattern, string> = {
  none: '',
  hearts: '❤️',
  flowers: '🌸',
  stars: '⭐',
  dots: '•',
};

const PRESETS: { color: string; pattern: Pattern; size: 'small' | 'medium' | 'large' }[] = [
  // Row 1 – plain
  { color: '#fff9c4', pattern: 'none',    size: 'medium' },
  { color: '#d4f5d4', pattern: 'none',    size: 'medium' },
  { color: '#d4e8f5', pattern: 'none',    size: 'medium' },
  { color: '#e8d4f5', pattern: 'none',    size: 'medium' },
  // Row 2 – plain
  { color: '#f5d4e8', pattern: 'none',    size: 'medium' },
  { color: '#f5e8d4', pattern: 'none',    size: 'medium' },
  { color: '#d4f5f0', pattern: 'none',    size: 'medium' },
  { color: '#f5f2d4', pattern: 'none',    size: 'medium' },
  // Row 3 – hearts
  { color: '#fff9c4', pattern: 'hearts',  size: 'medium' },
  { color: '#f5d4e8', pattern: 'hearts',  size: 'medium' },
  { color: '#e8d4f5', pattern: 'flowers', size: 'medium' },
  { color: '#d4e8f5', pattern: 'stars',   size: 'medium' },
  // Row 4 – dots / stars
  { color: '#d4f5d4', pattern: 'stars',   size: 'medium' },
  { color: '#f5e8d4', pattern: 'dots',    size: 'medium' },
  { color: '#d4f5f0', pattern: 'dots',    size: 'medium' },
  { color: '#f5f2d4', pattern: 'flowers', size: 'medium' },
  // Row 5 – small notes
  { color: '#fff9c4', pattern: 'none',    size: 'small'  },
  { color: '#d4e8f5', pattern: 'none',    size: 'small'  },
  { color: '#f5d4e8', pattern: 'hearts',  size: 'small'  },
  { color: '#d4f5d4', pattern: 'stars',   size: 'small'  },
  // Row 6 – large notes
  { color: '#fff9c4', pattern: 'none',    size: 'large'  },
  { color: '#e8d4f5', pattern: 'flowers', size: 'large'  },
  { color: '#d4f5f0', pattern: 'dots',    size: 'large'  },
  { color: '#f5e8d4', pattern: 'hearts',  size: 'large'  },
];

const SIZE_MAP = {
  small:  { w: 90,  h: 70  },
  medium: { w: 130, h: 95  },
  large:  { w: 180, h: 130 },
};

const SIZE_LABEL = { small: 'S', medium: 'M', large: 'L' };

interface Props {
  open: boolean;
  onClose: () => void;
  pageId: string | null;
}

export default function PostItPicker({ open, onClose, pageId }: Props) {
  const { addPostIt, diary, showToast } = useStore();

  function pick(preset: typeof PRESETS[0]) {
    if (!pageId) return;
    const page = diary.pages.find(p => p.id === pageId);
    const count = (page?.postIts?.length || 0) + (page?.stickers?.length || 0) + (page?.media?.length || 0);
    if (count >= 2) { showToast('Bu sayfada maksimum 2 öğe eklenebilir 🚫'); onClose(); return; }
    const { w, h } = SIZE_MAP[preset.size];
    addPostIt(pageId, {
      id: uuidv4(),
      x: 50 + Math.random() * 100,
      y: 50 + Math.random() * 80,
      width: w,
      height: h,
      color: preset.color,
      pattern: preset.pattern,
      text: '',
      font: 'Georgia',
      textColor: '#2c2a27',
      fontSize: 13,
      rotation: (Math.random() - 0.5) * 8,
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop (invisible, just to capture outside clicks) */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 790 }}
            onClick={onClose}
          />

          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            style={{
              position: 'fixed',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 800,
              background: 'rgba(245,242,238,0.96)',
              backdropFilter: 'blur(18px)',
              borderRadius: 18,
              padding: '14px 10px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
              border: '1px solid rgba(0,0,0,0.08)',
              width: 172,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 10, paddingBottom: 8,
              borderBottom: '1px solid rgba(0,0,0,0.07)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 'bold', color: '#4a4640', fontFamily: 'Georgia' }}>
                📌 Post-it Seç
              </span>
              <button onClick={onClose} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: '#9a9490', lineHeight: 1,
              }}>✕</button>
            </div>

            {/* Size legend */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, fontSize: 10, color: '#8a8480' }}>
              {(['small','medium','large'] as const).map(s => (
                <span key={s} style={{
                  background: 'rgba(0,0,0,0.06)', borderRadius: 4, padding: '1px 6px',
                }}>
                  {SIZE_LABEL[s]} = {SIZE_MAP[s].w}×{SIZE_MAP[s].h}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {PRESETS.map((preset, i) => {
                const sym = PATTERN_SYMBOL[preset.pattern];
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => pick(preset)}
                    title={`${preset.size} · ${preset.pattern}`}
                    style={{
                      background: preset.color,
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 6,
                      height: 58,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '1px 2px 6px rgba(0,0,0,0.12)',
                      padding: 0,
                    }}
                  >
                    {/* Pattern overlay */}
                    {sym && (
                      <div style={{
                        position: 'absolute', inset: 0, opacity: 0.18,
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                        alignContent: 'start', gap: '2px', padding: '3px',
                        fontSize: 9, pointerEvents: 'none',
                      }}>
                        {Array.from({ length: 9 }).map((_, j) => <span key={j}>{sym}</span>)}
                      </div>
                    )}
                    {/* Fold corner */}
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 0, height: 0, borderStyle: 'solid',
                      borderWidth: '0 0 10px 10px',
                      borderColor: 'transparent transparent rgba(0,0,0,0.12) transparent',
                    }} />
                    {/* Size badge */}
                    <span style={{
                      position: 'absolute', top: 3, left: 4,
                      fontSize: 8, color: 'rgba(0,0,0,0.35)', fontFamily: 'Georgia',
                    }}>
                      {SIZE_LABEL[preset.size]}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {!pageId && (
              <div style={{
                marginTop: 10, fontSize: 11, color: '#aaa', textAlign: 'center',
              }}>
                Bir sayfaya geç
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
