'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import WalletConnect from './WalletConnect';

export default function Header() {
  const { diary, updateDiaryTitle } = useStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(diary.title);

  function submit() { updateDiaryTitle(title); setEditing(false); }

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20 }}
      style={{
        width: '100%', flexShrink: 0, zIndex: 1000,
        height: 56,
        background: 'rgba(245,242,238,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 1px 12px rgba(0,0,0,0.07)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{diary.settings.coverIcon || '📔'}</span>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 13, fontWeight: 'bold', color: '#3a3830', letterSpacing: 0.5 }}>
          Anı Defteri
        </span>
        <span style={{
          fontSize: 9, background: 'linear-gradient(135deg,#5a6476,#3a4560)',
          color: 'white', padding: '1px 7px', borderRadius: 10, fontWeight: 'bold', letterSpacing: 0.5,
        }}>
          STELLAR
        </span>
      </div>

      {/* Title */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        {editing ? (
          <input autoFocus value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={submit}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{
              fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 'bold', color: '#2c2a27',
              border: 'none', borderBottom: '2px solid rgba(0,0,0,0.2)',
              background: 'transparent', outline: 'none', textAlign: 'center', width: 220,
            }}
          />
        ) : (
          <button onClick={() => setEditing(true)}
            style={{
              fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 'bold', color: '#2c2a27',
              background: 'none', border: 'none', cursor: 'text', padding: '2px 8px', borderRadius: 4,
            }}
            title="Başlığı düzenle"
          >
            {diary.title}
          </button>
        )}
      </div>

      {/* Right: wallet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <WalletConnect />
      </div>
    </motion.header>
  );
}
