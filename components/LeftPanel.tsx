'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import PostItPicker from './PostItPicker';
import { PHOTO_FILTERS } from '@/lib/filters';
import { hashPin } from './PinModal';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function LeftPanel() {
  const {
    diary, currentPage, addMedia, requestMediaAdd, showToast,
    updateMedia, updatePage, openFilterModal, filterQuota, useFilterFreeSlot,
  } = useStore();

  const currentDiaryPage = diary.pages[currentPage - 1];
  const pagePhotos = currentDiaryPage?.media.filter(m => m.type === 'photo') || [];

  function pageMediaCount(): number {
    return currentDiaryPage?.media?.length || 0;
  }

  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterMediaId, setFilterMediaId] = useState<string | null>(null);
  const [showLockPanel, setShowLockPanel] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinErr, setPinErr] = useState('');

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [micError, setMicError] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Reset filter selection when page changes
  useEffect(() => {
    setFilterMediaId(null);
  }, [currentPage]);

  function getPageId(): string | null {
    return currentDiaryPage?.id ?? null;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video' | 'audio') {
    const file = e.target.files?.[0];
    const pageId = getPageId();
    if (!file || !pageId) return;
    if (pageMediaCount() >= 2) { showToast('Bu sayfaya maksimum 2 medya eklenebilir 🚫'); e.target.value = ''; return; }
    const url = URL.createObjectURL(file);
    const name = file.name;
    requestMediaAdd(type, () => addMedia(pageId, {
      id: uuidv4(), type, url, name,
      x: 40 + Math.random() * 60, y: 40 + Math.random() * 60,
      width: type === 'audio' ? 200 : 160, height: 120,
      addedAt: new Date().toISOString().slice(0, 10),
    }));
    e.target.value = '';
  }

  async function handleRecordToggle() {
    if (recording) {
      mediaRecorderRef.current?.stop();
    } else {
      if (pageMediaCount() >= 2) { showToast('Bu sayfaya maksimum 2 medya eklenebilir 🚫'); return; }
      setMicError(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
        const mr = new MediaRecorder(stream, { mimeType });
        chunksRef.current = [];
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          streamRef.current = null;
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          setRecording(false); setRecordTime(0);
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const pageId = getPageId();
          if (!pageId) return;
          const name = `Ses Kaydı ${new Date().toLocaleTimeString('tr-TR')}`;
          requestMediaAdd('audio', () => addMedia(pageId, {
            id: uuidv4(), type: 'audio', url, name,
            x: 40 + Math.random() * 60, y: 40 + Math.random() * 60,
            width: 200, height: 120,
            addedAt: new Date().toISOString().slice(0, 10),
          }));
        };
        mr.start(100);
        mediaRecorderRef.current = mr;
        setRecording(true); setRecordTime(0);
        timerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
      } catch {
        setMicError(true);
        setTimeout(() => setMicError(false), 3000);
      }
    }
  }

  function applyFilter(mediaId: string, filterCss: string | undefined) {
    const pageId = getPageId();
    if (!pageId) return;
    const media = pagePhotos.find(m => m.id === mediaId);
    const alreadyHasFilter = !!media?.filter;
    if (alreadyHasFilter || filterQuota < 1) {
      updateMedia(pageId, mediaId, { filter: filterCss });
      if (!alreadyHasFilter) useFilterFreeSlot();
    } else {
      openFilterModal(pageId, mediaId);
    }
    setFilterMediaId(null);
    setShowFilterPanel(false);
  }

  function handleSavePin() {
    const pageId = getPageId();
    if (!pageId) return;
    if (pinValue.length < 4) { setPinErr('En az 4 karakter olmalı.'); return; }
    if (pinValue !== pinConfirm) { setPinErr('PIN\'ler eşleşmiyor.'); return; }
    updatePage(pageId, { pinHash: hashPin(pinValue) });
    showToast(`${currentDiaryPage?.pageNumber}. sayfaya PIN eklendi 🔐`);
    setShowLockPanel(false);
    setPinValue(''); setPinConfirm(''); setPinErr('');
  }

  function handleRemovePin() {
    const pageId = getPageId();
    if (!pageId) return;
    updatePage(pageId, { pinHash: undefined });
    showToast('PIN kaldırıldı');
    setShowLockPanel(false);
    setPinValue(''); setPinConfirm(''); setPinErr('');
  }

  const topButtons = [
    { icon: '📷', label: 'Fotoğraf', onClick: () => photoRef.current?.click() },
    { icon: '🎬', label: 'Video',    onClick: () => videoRef.current?.click() },
    { icon: '🎵', label: 'Ses',      onClick: () => audioRef.current?.click() },
    { icon: '📌', label: 'Post-it',  onClick: () => { setShowPicker(v => !v); setShowFilterPanel(false); setShowLockPanel(false); }, active: showPicker },
  ];

  return (
    <>
      <input ref={photoRef} type="file" accept="image/*"  style={{ display: 'none' }} onChange={e => handleFile(e, 'photo')} />
      <input ref={videoRef} type="file" accept="video/*"  style={{ display: 'none' }} onChange={e => handleFile(e, 'video')} />
      <input ref={audioRef} type="file" accept="audio/*"  style={{ display: 'none' }} onChange={e => handleFile(e, 'audio')} />

      {/* Left-side vertical toolbar, vertically centered */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, delay: 0.3 }}
        style={{
          position: 'fixed', left: 12, top: 200,
          zIndex: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: 'rgba(245,242,238,0.95)', backdropFilter: 'blur(16px)',
          borderRadius: 18, padding: '8px 6px',
          boxShadow: '0 4px 28px rgba(0,0,0,0.14)', border: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        {/* Main buttons */}
        {topButtons.map(({ icon, label, onClick, active }) => (
          <motion.button key={label} whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.92 }}
            onClick={onClick} title={label}
            style={{ width: 46, height: 46, borderRadius: 11, border: 'none', background: active ? 'rgba(44,42,39,0.12)' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 8, color: '#6a6460', letterSpacing: 0.3 }}>{label}</span>
          </motion.button>
        ))}

        <div style={{ width: 28, height: 1, background: 'rgba(0,0,0,0.1)', margin: '2px 0' }} />

        {/* Filter button */}
        <motion.button
          whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.92 }}
          onClick={() => { setShowFilterPanel(v => !v); setShowPicker(false); setShowLockPanel(false); setFilterMediaId(null); }}
          title="Fotoğraf Filtresi"
          style={{ width: 46, height: 46, borderRadius: 11, border: 'none', background: showFilterPanel ? 'rgba(245,158,11,0.15)' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <span style={{ fontSize: 8, color: '#6a6460', letterSpacing: 0.3 }}>Filtre</span>
        </motion.button>

        {/* Lock button */}
        <motion.button
          whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.92 }}
          onClick={() => { setShowLockPanel(v => !v); setShowPicker(false); setShowFilterPanel(false); setPinValue(''); setPinConfirm(''); setPinErr(''); }}
          title="Sayfayı Kilitle"
          style={{ width: 46, height: 46, borderRadius: 11, border: 'none', background: showLockPanel ? 'rgba(44,42,39,0.12)' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <span style={{ fontSize: 20 }}>🔐</span>
          <span style={{ fontSize: 8, color: '#6a6460', letterSpacing: 0.3 }}>PIN</span>
        </motion.button>

        <div style={{ width: 28, height: 1, background: 'rgba(0,0,0,0.1)', margin: '2px 0' }} />

        {/* Record button */}
        <motion.button
          whileHover={!recording ? { scale: 1.1, background: 'rgba(220,38,38,0.1)' } : {}}
          whileTap={{ scale: 0.92 }}
          onClick={handleRecordToggle}
          title={recording ? 'Kaydı Durdur' : 'Ses Kaydet'}
          animate={recording ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={recording ? { repeat: Infinity, duration: 1.2 } : {}}
          style={{ width: 46, height: recording ? 56 : 46, borderRadius: 11, border: 'none', background: recording ? 'rgba(220,38,38,0.12)' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, transition: 'background 0.2s, height 0.2s' }}>
          {recording ? (
            <>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: 18 }}>🔴</motion.span>
              <span style={{ fontSize: 9, color: '#dc2626', fontWeight: 'bold' }}>{formatTime(recordTime)}</span>
              <span style={{ fontSize: 7, color: '#dc2626' }}>durdur</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 20 }}>🎙️</span>
              <span style={{ fontSize: 8, color: micError ? '#dc2626' : '#6a6460', letterSpacing: 0.3 }}>{micError ? 'Hata!' : 'Kayıt'}</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Filter panel — centered on screen */}
      <AnimatePresence>
        {showFilterPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(3px)', zIndex: 798 }}
              onClick={() => { setShowFilterPanel(false); setFilterMediaId(null); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
              style={{
                position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 799, background: '#faf8f5', borderRadius: 20, padding: 20,
                boxShadow: '0 16px 60px rgba(0,0,0,0.22)', border: '1px solid rgba(0,0,0,0.07)', width: 240,
              }}
            >
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2c2a27', marginBottom: 10, fontFamily: 'Georgia', textAlign: 'center' }}>
              ✨ Fotoğraf Filtresi
            </div>

            {filterQuota >= 1 && (
              <div style={{ fontSize: 10, color: '#d97706', background: 'rgba(245,158,11,0.1)', borderRadius: 8, padding: '4px 8px', marginBottom: 10 }}>
                Günlük ücretsiz hakkın doldu — 1 XLM gerekiyor
              </div>
            )}
            {filterQuota < 1 && (
              <div style={{ fontSize: 10, color: '#3a8060', background: 'rgba(56,184,96,0.1)', borderRadius: 8, padding: '4px 8px', marginBottom: 10 }}>
                Bugün 1 ücretsiz filtren var ✓
              </div>
            )}

            {pagePhotos.length === 0 && (
              <div style={{ fontSize: 11, color: '#9a9490', textAlign: 'center', padding: '12px 0' }}>
                Bu sayfada fotoğraf yok
              </div>
            )}

            {/* Photo selection */}
            {pagePhotos.length > 0 && !filterMediaId && (
              <>
                <div style={{ fontSize: 11, color: '#6a6460', marginBottom: 8 }}>Filtrelemek istediğin fotoğrafa tıkla:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {pagePhotos.map((m, i) => (
                    <button key={m.id} onClick={() => setFilterMediaId(m.id)}
                      style={{ width: 72, height: 54, padding: 0, border: '2px solid rgba(0,0,0,0.1)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'none' }}>
                      <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: m.filter || 'none' }} draggable={false} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Filter grid */}
            {filterMediaId && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <button onClick={() => setFilterMediaId(null)}
                    style={{ fontSize: 11, color: '#6a6460', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    ← Geri
                  </button>
                  <span style={{ fontSize: 11, color: '#2c2a27', fontWeight: 'bold' }}>Filtre seç:</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {PHOTO_FILTERS.map(f => {
                    const isActive = pagePhotos.find(m => m.id === filterMediaId)?.filter === f.css;
                    return (
                      <button key={f.id} onClick={() => applyFilter(filterMediaId, f.css)}
                        style={{
                          padding: '7px 4px', borderRadius: 8, border: `2px solid ${isActive ? '#f59e0b' : 'transparent'}`,
                          background: isActive ? 'rgba(245,158,11,0.15)' : 'rgba(0,0,0,0.05)',
                          cursor: 'pointer', fontSize: 11, color: '#2c2a27', fontWeight: isActive ? 'bold' : 'normal',
                          transition: 'all 0.15s',
                        }}>
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lock panel — centered on screen */}
      <AnimatePresence>
        {showLockPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(3px)', zIndex: 798 }}
              onClick={() => setShowLockPanel(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
              style={{
                position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 799, background: '#faf8f5', borderRadius: 20, padding: 24,
                boxShadow: '0 16px 60px rgba(0,0,0,0.22)', border: '1px solid rgba(0,0,0,0.07)', width: 260,
              }}
            >
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2c2a27', marginBottom: 4, fontFamily: 'Georgia', textAlign: 'center' }}>
              🔐 Sayfaya PIN Koy
            </div>
            <div style={{ fontSize: 11, color: '#6a6460', marginBottom: 14, textAlign: 'center', lineHeight: 1.5 }}>
              {currentDiaryPage
                ? <>{currentDiaryPage.pageNumber}. sayfa{currentDiaryPage.pinHash ? ' — PIN mevcut' : ''}</>
                : 'Önce bir sayfaya geç'}
            </div>

            {currentDiaryPage?.pinHash ? (
              <>
                <div style={{ fontSize: 11, color: '#3a8060', background: 'rgba(56,184,96,0.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, textAlign: 'center' }}>
                  Bu sayfanın zaten bir PIN'i var.
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleRemovePin}
                  style={{ width: '100%', padding: '9px 0', borderRadius: 10, background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', cursor: 'pointer', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>
                  🗑️ PIN'i Kaldır
                </motion.button>
                <button onClick={() => { updatePage(currentDiaryPage.id, { pinHash: undefined }); setPinValue(''); setPinConfirm(''); setPinErr(''); }}
                  style={{ display: 'none' }} />
                <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '4px 0 12px' }} />
                <div style={{ fontSize: 11, color: '#6a6460', marginBottom: 8, textAlign: 'center' }}>veya yeni PIN belirle:</div>
              </>
            ) : null}

            <input
              type="password"
              value={pinValue}
              onChange={e => { setPinValue(e.target.value); setPinErr(''); }}
              placeholder="PIN (en az 4 karakter)"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.14)', fontSize: 13, outline: 'none', textAlign: 'center', boxSizing: 'border-box', marginBottom: 8 }}
              onKeyDown={e => { if (e.key === 'Enter') (document.getElementById('pin-confirm-panel') as HTMLInputElement)?.focus(); }}
            />
            <input
              id="pin-confirm-panel"
              type="password"
              value={pinConfirm}
              onChange={e => { setPinConfirm(e.target.value); setPinErr(''); }}
              placeholder="PIN tekrar"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.14)', fontSize: 13, outline: 'none', textAlign: 'center', boxSizing: 'border-box', marginBottom: pinErr ? 6 : 12 }}
              onKeyDown={e => { if (e.key === 'Enter') handleSavePin(); }}
            />
            {pinErr && <div style={{ fontSize: 11, color: '#dc2626', textAlign: 'center', marginBottom: 10 }}>{pinErr}</div>}
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleSavePin}
              disabled={!currentDiaryPage}
              style={{ width: '100%', padding: '9px 0', borderRadius: 10, background: currentDiaryPage ? 'linear-gradient(135deg,#2c2a27,#1e1e1e)' : '#ccc', color: '#e8e0d0', border: 'none', cursor: currentDiaryPage ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 'bold', fontFamily: 'Georgia' }}>
              🔐 PIN Kaydet
            </motion.button>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      <PostItPicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        pageId={getPageId()}
      />
    </>
  );
}
