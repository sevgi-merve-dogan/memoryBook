'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import DiaryPageContent from './DiaryPageContent';
import React from 'react';

const CoverPage = React.forwardRef<HTMLDivElement, { title: string; isBack?: boolean; settings?: any }>(
  ({ title, isBack, settings }, ref) => {
    const bg = settings?.coverGradient || 'linear-gradient(160deg,#2c2a27,#1e1e1e)';
    const icon = settings?.coverIcon || '📔';
    const textColor = settings?.coverTextColor || '#e8e0d0';
    return (
      <div ref={ref} style={{ width: '100%', height: '100%' }}>
        <div style={{
          width: '100%', height: '100%',
          background: isBack ? 'linear-gradient(160deg,#2a2826,#1a1a1a)' : bg,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Subtle grain texture */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
          }} />

          {!isBack && (
            <>
              {/* Decorative frame */}
              <div style={{
                position: 'absolute', inset: 16,
                border: `1px solid ${textColor}22`,
                borderRadius: 3,
              }} />
              <div style={{
                position: 'absolute', inset: 22,
                border: `0.5px solid ${textColor}11`,
                borderRadius: 2,
              }} />
              {/* Corner ornaments */}
              {[
                { top: 14, left: 14 }, { top: 14, right: 14 },
                { bottom: 14, left: 14 }, { bottom: 14, right: 14 },
              ].map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute', ...pos,
                  width: 12, height: 12,
                  borderTop: i < 2 ? `1.5px solid ${textColor}44` : 'none',
                  borderBottom: i >= 2 ? `1.5px solid ${textColor}44` : 'none',
                  borderLeft: i % 2 === 0 ? `1.5px solid ${textColor}44` : 'none',
                  borderRight: i % 2 === 1 ? `1.5px solid ${textColor}44` : 'none',
                }} />
              ))}

              <div style={{ fontSize: 38, marginBottom: 14, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>
                {icon}
              </div>
              <div style={{
                color: textColor, fontFamily: 'Georgia,serif', fontSize: 18,
                fontWeight: 'bold', textAlign: 'center',
                textShadow: '0 1px 8px rgba(0,0,0,0.5)',
                padding: '0 28px', letterSpacing: 1.5, lineHeight: 1.4,
              }}>
                {title}
              </div>
              <div style={{
                color: `${textColor}55`, fontSize: 9, marginTop: 14,
                letterSpacing: 4, textTransform: 'uppercase', fontFamily: 'Georgia',
              }}>
                Anı Defteri
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);
CoverPage.displayName = 'CoverPage';

const PageWrapper = React.forwardRef<HTMLDivElement, { children: React.ReactNode; number: number }>(
  ({ children }, ref) => (
    <div ref={ref} className="page-wrapper" style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  )
);
PageWrapper.displayName = 'PageWrapper';

export default function BookViewer() {
  const { diary, setCurrentPage, removePage, requestDelete, addPage } = useStore();
  const bookRef = useRef<any>(null);
  const [activePage, setActivePage] = useState(0);
  const [bookKey, setBookKey] = useState(diary.pages.length);
  const savedPageRef = useRef(0);
  const pagesLengthRef = useRef(diary.pages.length);
  pagesLengthRef.current = diary.pages.length;

  const handleFlip = useCallback((e: any) => {
    const p = e.data;
    setActivePage(p);
    setCurrentPage(p);
    savedPageRef.current = p;
  }, [setCurrentPage]);

  // Auto-extend: add more locked pages when user approaches the last page
  useEffect(() => {
    if (activePage > 0 && activePage >= pagesLengthRef.current - 3) {
      savedPageRef.current = activePage;
      addPage(8);
      setBookKey(k => k + 1);
      setTimeout(() => {
        const target = savedPageRef.current;
        if (target > 0) bookRef.current?.pageFlip()?.turnToPage(target);
      }, 100);
    }
  }, [activePage, addPage]);

  function handleRemovePage(pageId: string) {
    savedPageRef.current = Math.max(0, activePage - 2);
    requestDelete(() => {
      removePage(pageId);
      setTimeout(() => {
        setBookKey(k => k + 1);
        setTimeout(() => {
          const target = savedPageRef.current;
          if (target > 0) {
            bookRef.current?.pageFlip()?.turnToPage(target);
          }
        }, 50);
      }, 50);
    });
  }

  const bookWidth = Math.min(Math.floor((window?.innerWidth || 1200) * 0.42), 460);
  const bookHeight = Math.min(Math.floor((window?.innerHeight || 800) * 0.72), 580);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative' }}>
        {/* Shadow */}
        <div style={{
          position: 'absolute', bottom: -20, left: '8%', right: '8%', height: 44,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.32) 0%, transparent 70%)',
          filter: 'blur(10px)', zIndex: 0,
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
            <HTMLFlipBook
            key={bookKey}
            ref={bookRef}
            width={bookWidth} height={bookHeight}
            size="fixed"
            minWidth={280} maxWidth={520}
            minHeight={380} maxHeight={680}
            showCover={true}
            mobileScrollSupport={true}
            onFlip={handleFlip}
            className="book-flip"
            style={{}}
            startPage={0}
            drawShadow={true}
            flippingTime={750}
            usePortrait={false}
            startZIndex={20}
            autoSize={false}
            maxShadowOpacity={0.4}
            showPageCorners={false}
            disableFlipByClick={true}
            clickEventForward={false}
            useMouseEvents={false}
            swipeDistance={999}
          >
            <CoverPage ref={React.createRef()} title={diary.title} settings={diary.settings} />
            {diary.pages.map((page, i) => (
              <PageWrapper key={page.id} ref={React.createRef()} number={i + 1}>
                <DiaryPageContent page={page} isActive={activePage === i + 1} isLeft={i % 2 === 0} />
              </PageWrapper>
            ))}
            <CoverPage ref={React.createRef()} title="" isBack settings={diary.settings} />
          </HTMLFlipBook>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            cursor: 'pointer', fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a4640',
          }}
        >◀</motion.button>

        {/* Delete current page — always visible, disabled on cover */}
        {(() => {
          const onPage = activePage > 0 && activePage <= diary.pages.length;
          return (
          <motion.button
            whileHover={onPage ? { scale: 1.04, background: 'rgba(220,38,38,0.1)' } : {}}
            onClick={() => {
              if (!onPage) return;
              const pageId = diary.pages[activePage - 1]?.id;
              if (!pageId) return;
              handleRemovePage(pageId);
            }}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12,
              background: onPage ? 'rgba(220,38,38,0.06)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${onPage ? 'rgba(220,38,38,0.2)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              cursor: onPage ? 'pointer' : 'default',
              color: onPage ? '#dc2626' : '#b0a898',
              fontFamily: 'Georgia,serif',
              display: 'flex', alignItems: 'center', gap: 5,
              opacity: onPage ? 1 : 0.5,
            }}
          >
            🗑️ Sayfayı Sil
          </motion.button>
          );
        })()}

        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => bookRef.current?.pageFlip()?.flipNext()}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            cursor: 'pointer', fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a4640',
          }}
        >▶</motion.button>
      </div>
    </div>
  );
}
