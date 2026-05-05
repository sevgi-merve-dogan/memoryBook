'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { StoreProvider, useStore } from '@/lib/store';
import Header from '@/components/Header';
import Toolbar from '@/components/Toolbar';
import DeleteModal from '@/components/DeleteModal';
import MediaModal from '@/components/MediaModal';
import PageModal from '@/components/PageModal';
import DateModal from '@/components/DateModal';
import FilterModal from '@/components/FilterModal';
import PinModal from '@/components/PinModal';
import LeftPanel from '@/components/LeftPanel';
import PageMediaBar from '@/components/PageMediaBar';
import ProfileModal from '@/components/ProfileModal';
import { motion, AnimatePresence } from 'framer-motion';

const BookViewer = dynamic(() => import('@/components/BookViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, color: '#6a6460' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        style={{ fontSize: 36 }}>📔</motion.div>
      <div style={{ fontFamily: 'Georgia', fontSize: 13, letterSpacing: 1 }}>Defter açılıyor...</div>
    </div>
  ),
});

function ProfileCard() {
  const { walletAddress, profileUsername, profilePhotoUrl } = useStore();
  const [showProfile, setShowProfile] = useState(false);

  if (!profilePhotoUrl && !profileUsername && !walletAddress) return null;

  const initials = profileUsername
    ? profileUsername.slice(0, 2).toUpperCase()
    : walletAddress
    ? walletAddress.slice(0, 2).toUpperCase()
    : '?';

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, type: 'spring', damping: 20 }}
        style={{
          position: 'fixed', left: 76, bottom: 24, zIndex: 900,
          background: 'rgba(245,242,238,0.95)',
          backdropFilter: 'blur(16px)',
          borderRadius: 16,
          padding: '10px 14px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer',
          maxWidth: 200,
        }}
        onClick={() => setShowProfile(true)}
        whileHover={{ scale: 1.03, boxShadow: '0 6px 30px rgba(0,0,0,0.16)' }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: profilePhotoUrl ? 'transparent' : 'linear-gradient(135deg,#5a6476,#3a4560)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 'bold', color: 'white',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          border: '2px solid rgba(255,255,255,0.8)',
        }}>
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : initials}
        </div>

        {/* Info */}
        <div style={{ minWidth: 0 }}>
          {profileUsername && (
            <div style={{
              fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 'bold',
              color: '#2c2a27', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {profileUsername}
            </div>
          )}
          {shortAddr && (
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#9a9490', marginTop: 1 }}>
              {shortAddr}
            </div>
          )}
          {!profileUsername && !shortAddr && (
            <div style={{ fontSize: 11, color: '#9a9490' }}>Profili düzenle</div>
          )}
        </div>

        {/* Edit hint */}
        <span style={{ fontSize: 10, color: '#c0bab4', flexShrink: 0 }}>✏️</span>
      </motion.div>

      <AnimatePresence>
        {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      </AnimatePresence>
    </>
  );
}

function AppContent() {
  const { diary, currentPage, toast } = useStore();
  const activePage = diary.pages[currentPage - 1] || null;

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(145deg, #f2f0ec 0%, #e8e4de 50%, #ede9e3 100%)',
      position: 'relative',
    }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-8%', left: '-4%',
          width: '40vw', height: '40vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180,160,140,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-4%', right: '-6%',
          width: '36vw', height: '36vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(140,150,170,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <Header />
      <Toolbar
        currentPageId={activePage?.id || null}
        currentPage={activePage ? {
          textFont: activePage.textFont,
          textColor: activePage.textColor,
          backgroundColor: activePage.backgroundColor,
          backgroundPattern: activePage.backgroundPattern,
          effects: activePage.effects || [],
        } : null}
      />

      <PageMediaBar />

      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative', zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 90 }}
        >
          <BookViewer />
        </motion.div>
      </main>

      <LeftPanel />
      <ProfileCard />
      <DeleteModal />
      <MediaModal />
      <PageModal />
      <DateModal />
      <FilterModal />
      <PinModal />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(44,42,39,0.92)', color: '#e8e0d0',
          padding: '10px 22px', borderRadius: 20, fontSize: 13,
          zIndex: 99999, fontFamily: 'Georgia,serif',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
