'use client';

import dynamic from 'next/dynamic';
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
import { motion } from 'framer-motion';

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

      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingBottom: 16, overflow: 'auto',
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
