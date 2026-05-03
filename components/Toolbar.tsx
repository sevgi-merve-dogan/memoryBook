'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { PageEffect, DiarySettings } from '@/lib/types';

// ── Emoji categories ──────────────────────────────────────────
const EMOJI_CATEGORIES = {
  'Yüzler': ['😀','😂','🥹','😍','🤩','😎','🥳','😴','🤔','😅','😭','🥰','😡','😱','🤗'],
  'Kalpler': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💖','💗','💘','💝','💞','♥️','💔'],
  'Hayvanlar': ['🐶','🐱','🦊','🐻','🐼','🐨','🦁','🐯','🦄','🐸','🐙','🦋','🐝','🦜','🐳'],
  'Doğa': ['🌸','🌺','🌻','🌹','🌿','🍀','🌊','⛰️','🌈','☀️','🌙','⭐','❄️','🌪️','🌴'],
  'Nesneler': ['🎈','🎉','🎁','🏆','🎵','🎸','📚','💎','🔑','🕯️','⚽','🏀','🎯','🎮','🚀'],
  'Yiyecek': ['🍕','🍔','🍦','🎂','🍩','🍭','🍎','🍓','🍋','☕','🧋','🍜','🍣','🥑','🍟'],
  'Ulaşım': ['🚗','🚕','🚙','🏎️','🚂','✈️','🚢','🚁','🛸','🚀','🛵','🚲','⛵','🏍️','🚡'],
};

const EFFECT_OPTIONS: { key: PageEffect; label: string; emoji: string }[] = [
  { key: 'snow', label: 'Kar', emoji: '❄️' },
  { key: 'hearts', label: 'Kalpler', emoji: '❤️' },
  { key: 'daisy', label: 'Papatya', emoji: '🌼' },
  { key: 'cars', label: 'Arabalar', emoji: '🚗' },
  { key: 'football', label: 'Futbol', emoji: '⚽' },
  { key: 'stars', label: 'Yıldızlar', emoji: '⭐' },
  { key: 'bubbles', label: 'Baloncuk', emoji: '🫧' },
];

const COVER_COLORS = [
  { label: 'Siyah', value: '#1a1a1a', gradient: 'linear-gradient(160deg,#2c2a27,#1a1a1a)' },
  { label: 'Lacivert', value: '#1a2744', gradient: 'linear-gradient(160deg,#223366,#1a2744)' },
  { label: 'Koyu Yeşil', value: '#1a3d2b', gradient: 'linear-gradient(160deg,#214d36,#1a3d2b)' },
  { label: 'Bordo', value: '#3d1520', gradient: 'linear-gradient(160deg,#551a2a,#3d1520)' },
  { label: 'Koyu Mor', value: '#2d1b4e', gradient: 'linear-gradient(160deg,#3d2464,#2d1b4e)' },
  { label: 'Arduvaz', value: '#2d3748', gradient: 'linear-gradient(160deg,#3a4a60,#2d3748)' },
  { label: 'Zeytun', value: '#2d3a1f', gradient: 'linear-gradient(160deg,#3a4a28,#2d3a1f)' },
  { label: 'Bakır', value: '#5c2d0a', gradient: 'linear-gradient(160deg,#7a3d0e,#5c2d0a)' },
  { label: 'Krem', value: '#c4b49a', gradient: 'linear-gradient(160deg,#d4c4aa,#c4b49a)' },
  { label: 'Beyaz', value: '#f5f3f0', gradient: 'linear-gradient(160deg,#faf9f7,#f0ede8)' },
];

const COVER_ICONS = ['📔','📒','📓','📖','📚','📝','🗒️','✏️','🏆','❤️','⭐','🌟','🎯','🔑','💫'];

const FONTS = [
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Comic Sans', value: 'Comic Sans MS' },
  { label: 'Courier', value: 'Courier New' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Palatino', value: 'Palatino' },
  { label: 'Trebuchet', value: 'Trebuchet MS' },
  { label: 'Times New Roman', value: 'Times New Roman' },
];

const PAGE_COLORS = [
  '#faf8f5','#ffffff','#fef9f0','#f5f8fc','#f5f3fa',
  '#f0f8f0','#fdf0f0','#fffbf0','#f0f0f0','#efe8e0',
];

const TEXT_COLORS = ['#2c2a27','#1a1a2e','#3d1520','#1a3d2b','#1a2744','#5c2d0a','#8a6030','#4a4040'];

type Tab = 'emoji' | 'effects' | 'cover' | 'font' | 'page' | null;

interface ToolbarProps {
  currentPageId: string | null;
  currentPage: { textFont: string; textColor: string; backgroundColor: string; backgroundPattern: string; effects: PageEffect[] } | null;
}

export default function Toolbar({ currentPageId, currentPage }: ToolbarProps) {
  const { updatePage, updateSettings, diary, setPendingEmoji, pendingEmoji } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>(null);
  const [emojiCategory, setEmojiCategory] = useState('Yüzler');

  function toggleTab(tab: Tab) {
    setActiveTab(prev => prev === tab ? null : tab);
  }

  function toggleEffect(effect: PageEffect) {
    if (!currentPageId || !currentPage) return;
    const effects = currentPage.effects || [];
    const next = effects.includes(effect)
      ? effects.filter(e => e !== effect)
      : [...effects, effect];
    updatePage(currentPageId, { effects: next });
  }

  const tabButtons: { key: Tab; icon: string; label: string }[] = [
    { key: 'emoji', icon: '😊', label: 'Emoji' },
    { key: 'effects', icon: '✨', label: 'Efektler' },
    { key: 'cover', icon: '📔', label: 'Kapak' },
    { key: 'font', icon: '✍️', label: 'Font' },
    { key: 'page', icon: '🎨', label: 'Sayfa' },
  ];

  return (
    <div style={{
      width: '100%', flexShrink: 0, zIndex: 900,
      background: 'rgba(245,242,238,0.95)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
    }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '4px 16px', height: 44 }}>
        {tabButtons.map(btn => (
          <button key={btn.key}
            onClick={() => toggleTab(btn.key)}
            className={`toolbar-btn${activeTab === btn.key ? ' active' : ''}`}
          >
            <span style={{ fontSize: 16 }}>{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}
        {pendingEmoji && (
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.06)', borderRadius: 8, padding: '3px 10px',
            fontSize: 12, color: '#4a4640',
          }}>
            <span style={{ fontSize: 18 }}>{pendingEmoji}</span>
            <span>Sayfaya tıkla → yerleştir</span>
            <button onClick={() => setPendingEmoji(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9490', fontSize: 14 }}>✕</button>
          </div>
        )}
      </div>

      {/* Panel */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            <div style={{ padding: '12px 16px', maxHeight: 220, overflowY: 'auto' }}>

              {/* ── EMOJI ── */}
              {activeTab === 'emoji' && (
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {Object.keys(EMOJI_CATEGORIES).map(cat => (
                      <button key={cat}
                        onClick={() => setEmojiCategory(cat)}
                        style={{
                          padding: '3px 10px', borderRadius: 8, fontSize: 11,
                          background: emojiCategory === cat ? '#2c2a27' : '#ede9e3',
                          color: emojiCategory === cat ? '#e8e0d0' : '#4a4640',
                          border: 'none', cursor: 'pointer',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {EMOJI_CATEGORIES[emojiCategory as keyof typeof EMOJI_CATEGORIES].map(emoji => (
                      <button key={emoji}
                        onClick={() => { setPendingEmoji(emoji); setActiveTab(null); }}
                        style={{
                          fontSize: 22, background: 'none', border: 'none', cursor: 'pointer',
                          padding: '2px 4px', borderRadius: 6,
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.07)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        title={`${emoji} ekle`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── EFFECTS ── */}
              {activeTab === 'effects' && (
                <div>
                  <div style={{ fontSize: 11, color: '#6a6460', marginBottom: 8 }}>
                    Sayfaya arka plan efekti ekle — aktif sayfa için geçerlidir
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {EFFECT_OPTIONS.map(eff => {
                      const isOn = currentPage?.effects?.includes(eff.key);
                      return (
                        <button key={eff.key}
                          onClick={() => toggleEffect(eff.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 10, fontSize: 13,
                            background: isOn ? '#2c2a27' : '#ede9e3',
                            color: isOn ? '#e8e0d0' : '#4a4640',
                            border: isOn ? '2px solid #2c2a27' : '2px solid transparent',
                            cursor: 'pointer', fontWeight: isOn ? 'bold' : 'normal',
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{eff.emoji}</span>
                          {eff.label}
                          {isOn && <span style={{ fontSize: 10, opacity: 0.7 }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── COVER ── */}
              {activeTab === 'cover' && (
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6a6460', marginBottom: 6 }}>Kapak Rengi</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {COVER_COLORS.map(c => (
                        <button key={c.value}
                          onClick={() => updateSettings({ coverColor: c.value, coverGradient: c.gradient })}
                          title={c.label}
                          style={{
                            width: 28, height: 28, borderRadius: 6,
                            background: c.gradient,
                            border: diary.settings.coverColor === c.value ? '2px solid #5a6476' : '2px solid transparent',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6a6460', marginBottom: 6 }}>Kapak İkonu</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {COVER_ICONS.map(icon => (
                        <button key={icon}
                          onClick={() => updateSettings({ coverIcon: icon })}
                          style={{
                            fontSize: 20, background: diary.settings.coverIcon === icon ? 'rgba(0,0,0,0.12)' : 'none',
                            border: 'none', cursor: 'pointer', borderRadius: 6, padding: '2px 4px',
                          }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6a6460', marginBottom: 6 }}>Başlık Rengi</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['#e8e0d0','#ffffff','#ffd700','#ff8080','#80ff80','#8080ff'].map(c => (
                        <button key={c}
                          onClick={() => updateSettings({ coverTextColor: c })}
                          style={{
                            width: 22, height: 22, borderRadius: '50%', background: c,
                            border: diary.settings.coverTextColor === c ? '2px solid #2c2a27' : '1px solid #ccc',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── FONT ── */}
              {activeTab === 'font' && (
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6a6460', marginBottom: 6 }}>Yazı Tipi</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {FONTS.map(f => (
                        <button key={f.value}
                          onClick={() => currentPageId && updatePage(currentPageId, { textFont: f.value })}
                          style={{
                            padding: '5px 12px', borderRadius: 8, fontSize: 13,
                            fontFamily: f.value,
                            background: currentPage?.textFont === f.value ? '#2c2a27' : '#ede9e3',
                            color: currentPage?.textFont === f.value ? '#e8e0d0' : '#4a4640',
                            border: 'none', cursor: 'pointer',
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6a6460', marginBottom: 6 }}>Yazı Rengi</div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {TEXT_COLORS.map(c => (
                        <button key={c}
                          onClick={() => currentPageId && updatePage(currentPageId, { textColor: c })}
                          style={{
                            width: 24, height: 24, borderRadius: '50%', background: c,
                            border: currentPage?.textColor === c ? '2px solid #5a6476' : '1px solid #ccc',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── PAGE ── */}
              {activeTab === 'page' && (
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6a6460', marginBottom: 6 }}>Sayfa Rengi</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {PAGE_COLORS.map(c => (
                        <button key={c}
                          onClick={() => currentPageId && updatePage(currentPageId, { backgroundColor: c })}
                          style={{
                            width: 24, height: 24, borderRadius: 5, background: c,
                            border: currentPage?.backgroundColor === c ? '2px solid #5a6476' : '1px solid #ccc',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6a6460', marginBottom: 6 }}>Desen</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {[
                        { k: 'none', l: 'Sade' }, { k: 'lined', l: 'Çizgili' },
                        { k: 'dots', l: 'Noktalı' }, { k: 'grid', l: 'Kareli' },
                        { k: 'crosshatch', l: 'Çapraz' },
                      ].map(({ k, l }) => (
                        <button key={k}
                          onClick={() => currentPageId && updatePage(currentPageId, { backgroundPattern: k as any })}
                          style={{
                            padding: '4px 10px', borderRadius: 8, fontSize: 12,
                            background: currentPage?.backgroundPattern === k ? '#2c2a27' : '#ede9e3',
                            color: currentPage?.backgroundPattern === k ? '#e8e0d0' : '#4a4640',
                            border: 'none', cursor: 'pointer',
                          }}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
