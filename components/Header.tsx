'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import WalletConnect from './WalletConnect';
import ProfileModal from './ProfileModal';
import TransactionHistory from './TransactionHistory';

export default function Header() {
  const { diary, updateDiaryTitle, walletAddress, profileUsername, profilePhotoUrl } = useStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(diary.title);
  const [showProfile, setShowProfile] = useState(false);
  const [showTxHistory, setShowTxHistory] = useState(false);

  function submit() { updateDiaryTitle(title); setEditing(false); }

  const initials = profileUsername
    ? profileUsername.slice(0, 2).toUpperCase()
    : walletAddress
    ? walletAddress.slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
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

        {/* Right: tx history + profile + wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Transaction history button */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowTxHistory(true)}
            title="İşlem Geçmişi"
            style={{
              padding: '6px 12px', borderRadius: 20,
              background: 'rgba(90,100,118,0.1)',
              border: '1px solid rgba(90,100,118,0.2)',
              cursor: 'pointer', fontSize: 11, color: '#5a6476',
              fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span>📋</span>
            <span style={{ fontSize: 10 }}>İşlemler</span>
          </motion.button>

          {/* Profile button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowProfile(true)}
            title="Profil"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: profilePhotoUrl ? 'transparent' : 'linear-gradient(135deg,#5a6476,#3a4560)',
              border: '2px solid rgba(255,255,255,0.8)',
              cursor: 'pointer', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              padding: 0,
              fontSize: 11, fontWeight: 'bold', color: 'white',
            }}
          >
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt="profil"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </motion.button>

          <WalletConnect />
        </div>
      </motion.header>

      <AnimatePresence>
        {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showTxHistory && <TransactionHistory onClose={() => setShowTxHistory(false)} />}
      </AnimatePresence>
    </>
  );
}
