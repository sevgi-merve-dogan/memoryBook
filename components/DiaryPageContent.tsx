'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiaryPage } from '@/lib/types';
import { useStore } from '@/lib/store';
import PostItNote from './PostItNote';
import MediaBlock from './MediaBlock';
import EmojiSticker from './EmojiSticker';
import EffectsLayer from './EffectsLayer';
import { v4 as uuidv4 } from 'uuid';
import { verifyPinHash } from './PinModal';

const BACKGROUND_PATTERNS: Record<string, React.CSSProperties> = {
  none: {},
  lined: {
    backgroundImage: 'repeating-linear-gradient(transparent,transparent 27px,rgba(100,90,80,0.15) 27px,rgba(100,90,80,0.15) 28px)',
    backgroundSize: '100% 28px',
  },
  dots: {
    backgroundImage: 'radial-gradient(circle,rgba(100,90,80,0.2) 1px,transparent 1px)',
    backgroundSize: '20px 20px',
  },
  grid: {
    backgroundImage: 'linear-gradient(rgba(100,90,80,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(100,90,80,0.1) 1px,transparent 1px)',
    backgroundSize: '28px 28px',
  },
  crosshatch: {
    backgroundImage: 'linear-gradient(45deg,rgba(100,90,80,0.08) 1px,transparent 1px),linear-gradient(-45deg,rgba(100,90,80,0.08) 1px,transparent 1px)',
    backgroundSize: '14px 14px',
  },
};

interface Props {
  page: DiaryPage;
  isActive: boolean;
  isLeft?: boolean;
}

interface CtxMenu { x: number; y: number; px: number; py: number; }

export default function DiaryPageContent({ page, isActive, isLeft }: Props) {
  const { updatePage, addPostIt, addMedia, addSticker, pendingEmoji, setPendingEmoji, requestMediaAdd, showToast, requestPageUnlock, openDateModal, openPinModal, sessionUnlockedPins, addSessionUnlock } = useStore();

  function mediaCount() { return page.media?.length || 0; }
  const [editingPostIt, setEditingPostIt] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [showStyle, setShowStyle] = useState<{ x: number; y: number } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const pinVerified = !page.pinHash || sessionUnlockedPins.includes(page.id);
  const pageRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function close() { setCtxMenu(null); setShowStyle(null); setEditingPostIt(null); }
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener('keydown', stop, true);
    el.addEventListener('keyup', stop, true);
    el.addEventListener('keypress', stop, true);
    return () => {
      el.removeEventListener('keydown', stop, true);
      el.removeEventListener('keyup', stop, true);
      el.removeEventListener('keypress', stop, true);
    };
  }, []);

  function handleRightClick(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCtxMenu({ x: e.clientX, y: e.clientY, px: e.clientX - rect.left, py: e.clientY - rect.top });
    setShowStyle(null);
  }

  function handleMiddleClick(e: React.MouseEvent) {
    if (e.button !== 1) return;
    e.preventDefault();
    setShowStyle({ x: e.clientX, y: e.clientY });
    setCtxMenu(null);
  }

  // Place pending emoji sticker on click
  function handlePageClick(e: React.MouseEvent) {
    if (!pendingEmoji) return;
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return;
    addSticker(page.id, {
      id: uuidv4(),
      emoji: pendingEmoji,
      x: e.clientX - rect.left - 16,
      y: e.clientY - rect.top - 16,
      size: 32,
      rotation: (Math.random() - 0.5) * 20,
      animation: 'none',
    });
    setPendingEmoji(null);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video' | 'audio') {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mediaCount() >= 2) { showToast('Bu sayfaya maksimum 2 medya eklenebilir 🚫'); e.target.value = ''; return; }
    const url = URL.createObjectURL(file);
    const name = file.name;
    requestMediaAdd(type, () => addMedia(page.id, {
      id: uuidv4(), type, url, name,
      x: 30 + Math.random() * 80, y: 50 + Math.random() * 80,
      width: type === 'audio' ? 200 : 160, height: 120,
      addedAt: new Date().toISOString().slice(0, 10),
    }));
    e.target.value = '';
    setCtxMenu(null);
  }

  function addPostItAt(px: number, py: number) {
    addPostIt(page.id, {
      id: uuidv4(),
      x: px - 60, y: py - 40,
      width: 130, height: 90,
      color: ['#fff9c4','#e8f5e9','#e3f2fd','#f3e5f5','#fce4ec'][Math.floor(Math.random() * 5)],
      pattern: 'none', text: '', font: 'Georgia',
      textColor: '#2c2a27', fontSize: 13,
      rotation: (Math.random() - 0.5) * 8,
    });
    setCtxMenu(null);
  }

  const patternStyle = BACKGROUND_PATTERNS[page.backgroundPattern] || {};

  return (
    <div
      ref={pageRef}
      onContextMenu={handleRightClick}
      onMouseDown={handleMiddleClick}
      onClick={handlePageClick}
      style={{
        width: '100%', height: '100%',
        backgroundColor: page.backgroundColor,
        ...patternStyle,
        position: 'relative', overflow: 'hidden',
        fontFamily: page.textFont,
        cursor: pendingEmoji ? 'crosshair' : 'default',
      }}
    >
      {/* Subtle inner shadow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.03)',
        zIndex: 0,
      }} />

      {/* Page number */}
      <div style={{
        position: 'absolute', bottom: 10,
        [isLeft ? 'left' : 'right']: 14,
        fontSize: 12, color: 'rgba(100,90,80,0.6)',
        fontFamily: 'Georgia', zIndex: 2,
      }}>{page.pageNumber}</div>

      {/* Date stamps — auto from media addedAt */}
      {page.media?.[0]?.addedAt && (
        <div style={{
          position: 'absolute', top: 8, left: 12,
          fontSize: 10, color: 'rgba(100,90,80,0.72)',
          fontFamily: 'Georgia,serif', fontStyle: 'italic',
          background: 'rgba(255,255,255,0.55)',
          padding: '2px 8px', borderRadius: 8, zIndex: 2,
          border: '1px solid rgba(100,90,80,0.12)',
          pointerEvents: 'none',
        }}>
          {new Date(page.media[0].addedAt!).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      )}
      {page.media?.[1]?.addedAt && (
        <div style={{
          position: 'absolute', bottom: 26, left: 12,
          fontSize: 10, color: 'rgba(100,90,80,0.72)',
          fontFamily: 'Georgia,serif', fontStyle: 'italic',
          background: 'rgba(255,255,255,0.55)',
          padding: '2px 8px', borderRadius: 8, zIndex: 2,
          border: '1px solid rgba(100,90,80,0.12)',
          pointerEvents: 'none',
        }}>
          {new Date(page.media[1].addedAt!).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      )}

      {/* Text area */}
      <textarea
        ref={textareaRef}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); if (pendingEmoji) return; }}
        onContextMenu={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
        onKeyUp={e => e.stopPropagation()}
        value={page.textContent}
        onChange={e => updatePage(page.id, { textContent: e.target.value })}
        placeholder="Anını buraya yaz..."
        style={{
          position: 'absolute', top: page.media?.[0]?.addedAt ? 30 : 8, left: 12, right: 12, bottom: 24,
          background: 'transparent', border: 'none', outline: 'none', resize: 'none',
          fontFamily: page.textFont, fontSize: 14, color: page.textColor,
          lineHeight: 2, zIndex: 1, padding: 0,
        }}
      />

      {/* Effects layer */}
      <EffectsLayer effects={page.effects || []} isActive={isActive} />

      {/* Post-its */}
      {page.postIts.map(pt => (
        <PostItNote key={pt.id} postIt={pt} pageId={page.id}
          isEditing={editingPostIt === pt.id} onStartEdit={() => setEditingPostIt(pt.id)} />
      ))}

      {/* Media */}
      {page.media.map(m => (
        <MediaBlock key={m.id} media={m} pageId={page.id} isActive={isActive} />
      ))}

      {/* Stickers */}
      {(page.stickers || []).map(s => (
        <EmojiSticker key={s.id} sticker={s} pageId={page.id} />
      ))}

      {/* PIN overlay — left-side panel */}
      {page.pinHash && !pinVerified && !page.locked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute', inset: 0, zIndex: 95,
            background: 'rgba(245,242,238,0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'row',
            alignItems: 'center', justifyContent: 'flex-start',
          }}
        >
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            gap: 10, paddingLeft: 20, paddingRight: 16,
          }}>
            <span style={{ fontSize: 28 }}>🔐</span>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: 12, color: '#2c2a27', fontWeight: 'bold', lineHeight: 1.4 }}>
              {page.pageNumber}.<br />Sayfa<br />Şifreli
            </span>
            <motion.div animate={pinError ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.3 }}>
              <input
                type="password"
                value={pinInput}
                autoFocus
                onChange={e => { setPinInput(e.target.value); setPinError(false); }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && pinInput) {
                    if (verifyPinHash(pinInput, page.pinHash!)) { addSessionUnlock(page.id); }
                    else { setPinError(true); setPinInput(''); }
                  }
                }}
                placeholder="Şifre"
                style={{
                  padding: '7px 10px', borderRadius: 10, fontSize: 13,
                  border: `1.5px solid ${pinError ? '#dc2626' : 'rgba(0,0,0,0.15)'}`,
                  outline: 'none', width: 90, background: 'white', letterSpacing: 3,
                }}
              />
            </motion.div>
            {pinError && <span style={{ fontSize: 10, color: '#dc2626' }}>Yanlış şifre</span>}
            <button
              onClick={() => {
                if (verifyPinHash(pinInput, page.pinHash!)) { addSessionUnlock(page.id); }
                else { setPinError(true); setPinInput(''); }
              }}
              style={{
                padding: '6px 14px', borderRadius: 16, fontSize: 11,
                background: 'rgba(44,42,39,0.85)', color: '#e8e0d0',
                border: 'none', cursor: 'pointer', fontFamily: 'Georgia,serif',
              }}
            >Gir</button>
          </div>
        </motion.div>
      )}

      {/* Lock overlay */}
      {page.locked && (
        <div
          onClick={() => requestPageUnlock(page.id)}
          style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: 'rgba(245,242,238,0.82)',
            backdropFilter: 'blur(6px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', gap: 10,
          }}
        >
          <span style={{ fontSize: 36 }}>🔒</span>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 13, color: '#2c2a27', fontWeight: 'bold' }}>
            {page.pageNumber}. Sayfa Kilitli
          </span>
          <span style={{
            fontSize: 11, color: '#6a6460',
            background: 'rgba(44,42,39,0.08)', padding: '4px 14px',
            borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)',
          }}>
            1 XLM ile aç
          </span>
        </div>
      )}

      {/* Hidden inputs */}
      <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'photo')} />
      <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'video')} />
      <input ref={audioRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'audio')} />

      {/* RIGHT-CLICK MENU */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            onMouseDown={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: Math.min(ctxMenu.x, window.innerWidth - 196),
              top: Math.min(ctxMenu.y, window.innerHeight - 260),
              zIndex: 9999,
              background: '#faf8f5',
              borderRadius: 12, padding: '5px 0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              border: '1px solid rgba(0,0,0,0.08)',
              minWidth: 182,
            }}
          >
            {[
              { icon: '✏️', label: 'Yazı Yaz', action: () => { setCtxMenu(null); setTimeout(() => (pageRef.current?.querySelector('textarea') as HTMLTextAreaElement)?.focus(), 50); } },
              { icon: '📌', label: 'Post-it Ekle', action: () => addPostItAt(ctxMenu.px, ctxMenu.py) },
              null,
              { icon: '📷', label: 'Fotoğraf Ekle', action: () => { setCtxMenu(null); photoRef.current?.click(); } },
              { icon: '🎬', label: 'Video Ekle', action: () => { setCtxMenu(null); videoRef.current?.click(); } },
              { icon: '🎵', label: 'Ses Ekle', action: () => { setCtxMenu(null); audioRef.current?.click(); } },
              null,
              { icon: page.pinHash ? '🔓' : '🔐', label: page.pinHash ? 'Şifreyi Kaldır' : 'Şifre Koy', action: () => { setCtxMenu(null); page.pinHash ? updatePage(page.id, { pinHash: undefined }) : openPinModal(page.id); } },
            ].map((item, i) =>
              item === null
                ? <div key={i} style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '3px 10px' }} />
                : (
                  <button key={i} onClick={item.action}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 14px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, color: '#2c2a27', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: 15 }}>{item.icon}</span>{item.label}
                  </button>
                )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji placement hint */}
      {pendingEmoji && (
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.65)', color: 'white',
          borderRadius: 20, padding: '4px 14px', fontSize: 11,
          pointerEvents: 'none', zIndex: 50, whiteSpace: 'nowrap',
        }}>
          {pendingEmoji} Yerleştirmek için tıkla
        </div>
      )}
    </div>
  );
}
