'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Diary, DiaryPage, PostItItem, MediaItem, StickerItem, EditMode, DiarySettings } from './types';
import { v4 as uuidv4 } from 'uuid';
import React from 'react';

function createDefaultPage(pageNumber: number, locked = false): DiaryPage {
  return {
    id: uuidv4(), pageNumber,
    backgroundColor: '#faf8f5',
    backgroundPattern: 'none',
    textContent: '', textFont: 'Georgia', textColor: '#2c2a27',
    postIts: [], media: [], stickers: [], effects: [],
    locked,
  };
}

const DEFAULT_SETTINGS: DiarySettings = {
  coverColor: '#1e1e1e',
  coverGradient: 'linear-gradient(160deg, #2c2a27 0%, #1e1e1e 100%)',
  coverIcon: '📔',
  coverTextColor: '#e8e0d0',
};

function createDefaultDiary(): Diary {
  return {
    id: uuidv4(), title: 'Anı Defterim',
    pages: [
      ...Array.from({ length: 6 },  (_, i) => createDefaultPage(i + 1, false)),
      ...Array.from({ length: 14 }, (_, i) => createDefaultPage(i + 7, true)),
    ],
    settings: DEFAULT_SETTINGS,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

// ─── Page quota ──────────────────────────────────────────────
const FREE_PAGES = 6;
// ─────────────────────────────────────────────────────────────

// ─── Delete quota helpers ────────────────────────────────────
const DAILY_FREE_DELETES = 3;

function todayStr() { return new Date().toISOString().slice(0, 10); }

function getDeletionQuota(): { date: string; count: number } {
  if (typeof window === 'undefined') return { date: todayStr(), count: 0 };
  try {
    const raw = localStorage.getItem('ani-delete-quota');
    if (raw) {
      const q = JSON.parse(raw);
      if (q.date === todayStr()) return q;
    }
  } catch {}
  return { date: todayStr(), count: 0 };
}

function incrementDeletionQuota() {
  const q = getDeletionQuota();
  q.count += 1;
  localStorage.setItem('ani-delete-quota', JSON.stringify(q));
}
// ─────────────────────────────────────────────────────────────

// ─── Media quota helpers ──────────────────────────────────────
const DAILY_FREE_PHOTOS = 3;
const DAILY_FREE_MEDIA = 1; // video + audio combined
const DAILY_FREE_FILTERS = 1;
const WEEKLY_FREE_UNLOCKS = 1;

function getPhotoQuota(): { date: string; count: number } {
  if (typeof window === 'undefined') return { date: todayStr(), count: 0 };
  try {
    const raw = localStorage.getItem('ani-photo-quota');
    if (raw) { const q = JSON.parse(raw); if (q.date === todayStr()) return q; }
  } catch {}
  return { date: todayStr(), count: 0 };
}
function incrementPhotoQuota() {
  const q = getPhotoQuota(); q.count += 1;
  localStorage.setItem('ani-photo-quota', JSON.stringify(q));
}
function getVideoAudioQuota(): { date: string; count: number } {
  if (typeof window === 'undefined') return { date: todayStr(), count: 0 };
  try {
    const raw = localStorage.getItem('ani-media-quota');
    if (raw) { const q = JSON.parse(raw); if (q.date === todayStr()) return q; }
  } catch {}
  return { date: todayStr(), count: 0 };
}
function incrementVideoAudioQuota() {
  const q = getVideoAudioQuota(); q.count += 1;
  localStorage.setItem('ani-media-quota', JSON.stringify(q));
}

function thisWeekStr() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}
function getFilterQuota(): { date: string; count: number } {
  if (typeof window === 'undefined') return { date: todayStr(), count: 0 };
  try {
    const raw = localStorage.getItem('ani-filter-quota');
    if (raw) { const q = JSON.parse(raw); if (q.date === todayStr()) return q; }
  } catch {}
  return { date: todayStr(), count: 0 };
}
function incrementFilterQuota() {
  const q = getFilterQuota(); q.count += 1;
  localStorage.setItem('ani-filter-quota', JSON.stringify(q));
}
function getWeeklyUnlockQuota(): { week: string; count: number } {
  if (typeof window === 'undefined') return { week: thisWeekStr(), count: 0 };
  try {
    const raw = localStorage.getItem('ani-unlock-weekly');
    if (raw) { const q = JSON.parse(raw); if (q.week === thisWeekStr()) return q; }
  } catch {}
  return { week: thisWeekStr(), count: 0 };
}
function incrementWeeklyUnlockQuota() {
  const q = getWeeklyUnlockQuota(); q.count += 1;
  localStorage.setItem('ani-unlock-weekly', JSON.stringify(q));
}
// ─────────────────────────────────────────────────────────────

interface StoreContextValue {
  diary: Diary;
  currentPage: number;
  editMode: EditMode;
  requestedBookPage: number | null;
  setRequestedBookPage: (p: number | null) => void;
  walletAddress: string | null;
  profileUsername: string | null;
  profilePhotoUrl: string | null;
  setProfileUsername: (name: string | null) => void;
  setProfilePhotoUrl: (url: string | null) => void;
  pendingEmoji: string | null;
  deleteQuota: number;
  photoQuota: number;
  videoAudioQuota: number;
  showDeleteModal: boolean;
  showMediaModal: boolean;
  pendingMediaType: 'photo' | 'media' | null;
  pendingDeleteFn: (() => void) | null;
  pendingMediaFn: (() => void) | null;
  setCurrentPage: (p: number) => void;
  setEditMode: (m: EditMode) => void;
  setWalletAddress: (a: string | null) => void;
  setPendingEmoji: (e: string | null) => void;
  setShowDeleteModal: (v: boolean) => void;
  setShowMediaModal: (v: boolean) => void;
  requestDelete: (fn: () => void) => void;
  confirmPaidDelete: () => void;
  requestMediaAdd: (type: 'photo' | 'video' | 'audio', fn: () => void) => void;
  confirmPaidMediaAdd: () => void;
  showPageModal: boolean;
  pendingPageFn: (() => void) | null;
  setShowPageModal: (v: boolean) => void;
  requestPageUnlock: (pageId: string) => void;
  confirmPaidPageAdd: () => void;
  showDateModal: boolean;
  pendingDatePageId: string | null;
  setShowDateModal: (v: boolean) => void;
  openDateModal: (pageId: string) => void;
  showFilterModal: boolean;
  pendingFilterInfo: { pageId: string; mediaId: string } | null;
  setShowFilterModal: (v: boolean) => void;
  openFilterModal: (pageId: string, mediaId: string) => void;
  showPinModal: boolean;
  pendingPinPageId: string | null;
  setShowPinModal: (v: boolean) => void;
  openPinModal: (pageId: string) => void;
  sessionUnlockedPins: string[];
  addSessionUnlock: (pageId: string) => void;
  filterQuota: number;
  weeklyUnlockQuota: number;
  useFilterFreeSlot: () => void;
  confirmFreePageUnlock: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
  updatePage: (pageId: string, updates: Partial<DiaryPage>) => void;
  addPostIt: (pageId: string, postIt: PostItItem) => void;
  updatePostIt: (pageId: string, id: string, updates: Partial<PostItItem>) => void;
  removePostIt: (pageId: string, id: string) => void;
  addMedia: (pageId: string, media: MediaItem) => void;
  updateMedia: (pageId: string, id: string, updates: Partial<MediaItem>) => void;
  removeMedia: (pageId: string, id: string) => void;
  addSticker: (pageId: string, sticker: StickerItem) => void;
  updateSticker: (pageId: string, id: string, updates: Partial<StickerItem>) => void;
  removeSticker: (pageId: string, id: string) => void;
  addPage: (count?: number) => void;
  removePage: (pageId: string) => void;
  updateDiaryTitle: (title: string) => void;
  updateSettings: (settings: Partial<DiarySettings>) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [diary, setDiary] = useState<Diary>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ani-defteri-v2');
      if (saved) {
        try {
          const d = JSON.parse(saved);
          d.settings = { ...DEFAULT_SETTINGS, ...d.settings };
          if (d.pages) d.pages = d.pages.map((p: DiaryPage) => ({ ...p, stickers: p.stickers || [], locked: p.locked ?? false }));
          return d;
        } catch {}
      }
    }
    return createDefaultDiary();
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('ani-wallet') || null;
    return null;
  });
  const [profileUsername, setProfileUsernameState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('ani-profile-username') || null;
    return null;
  });
  const [profilePhotoUrl, setProfilePhotoUrlState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('ani-profile-photo') || null;
    return null;
  });

  const setProfileUsername = useCallback((name: string | null) => {
    setProfileUsernameState(name);
    if (name) localStorage.setItem('ani-profile-username', name);
    else localStorage.removeItem('ani-profile-username');
  }, []);

  const setProfilePhotoUrl = useCallback((url: string | null) => {
    setProfilePhotoUrlState(url);
    if (url) localStorage.setItem('ani-profile-photo', url);
    else localStorage.removeItem('ani-profile-photo');
  }, []);

  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null);
  const [deleteQuota, setDeleteQuota] = useState(() => getDeletionQuota().count);
  const [photoQuota, setPhotoQuota] = useState(() => getPhotoQuota().count);
  const [videoAudioQuota, setVideoAudioQuota] = useState(() => getVideoAudioQuota().count);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [pendingMediaType, setPendingMediaType] = useState<'photo' | 'media' | null>(null);
  const [pendingDeleteFn, setPendingDeleteFn] = useState<(() => void) | null>(null);
  const [pendingMediaFn, setPendingMediaFn] = useState<(() => void) | null>(null);
  const [showPageModal, setShowPageModal] = useState(false);
  const [pendingPageFn, setPendingPageFn] = useState<(() => void) | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [pendingDatePageId, setPendingDatePageId] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [pendingFilterInfo, setPendingFilterInfo] = useState<{ pageId: string; mediaId: string } | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPinPageId, setPendingPinPageId] = useState<string | null>(null);
  const [sessionUnlockedPins, setSessionUnlockedPins] = useState<string[]>([]);
  const [filterQuota, setFilterQuota] = useState(() => getFilterQuota().count);
  const [weeklyUnlockQuota, setWeeklyUnlockQuota] = useState(() => getWeeklyUnlockQuota().count);
  const [toast, setToast] = useState<string | null>(null);
  const [requestedBookPage, setRequestedBookPage] = useState<number | null>(null);

  useEffect(() => { localStorage.setItem('ani-defteri-v2', JSON.stringify(diary)); }, [diary]);
  useEffect(() => {
    if (walletAddress) localStorage.setItem('ani-wallet', walletAddress);
    else localStorage.removeItem('ani-wallet');
  }, [walletAddress]);

  const requestDelete = useCallback((fn: () => void) => {
    const q = getDeletionQuota();
    if (q.count < DAILY_FREE_DELETES) {
      fn();
      incrementDeletionQuota();
      setDeleteQuota(q.count + 1);
    } else {
      setPendingDeleteFn(() => fn);
      setShowDeleteModal(true);
    }
  }, []);

  const confirmPaidDelete = useCallback(() => {
    if (pendingDeleteFn) {
      pendingDeleteFn();
      incrementDeletionQuota();
      setDeleteQuota(prev => prev + 1);
    }
    setPendingDeleteFn(null);
    setShowDeleteModal(false);
  }, [pendingDeleteFn]);

  const requestMediaAdd = useCallback((type: 'photo' | 'video' | 'audio', fn: () => void) => {
    if (type === 'photo') {
      const q = getPhotoQuota();
      if (q.count < DAILY_FREE_PHOTOS) {
        fn(); incrementPhotoQuota(); setPhotoQuota(q.count + 1);
      } else {
        setPendingMediaFn(() => fn); setPendingMediaType('photo'); setShowMediaModal(true);
      }
    } else {
      const q = getVideoAudioQuota();
      if (q.count < DAILY_FREE_MEDIA) {
        fn(); incrementVideoAudioQuota(); setVideoAudioQuota(q.count + 1);
      } else {
        setPendingMediaFn(() => fn); setPendingMediaType('media'); setShowMediaModal(true);
      }
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const requestPageUnlock = useCallback((pageId: string) => {
    setPendingPageFn(() => () => {
      setDiary(d => ({
        ...d,
        pages: d.pages.map(p => p.id === pageId ? { ...p, locked: false } : p),
      }));
    });
    setShowPageModal(true);
  }, []);

  const openDateModal = useCallback((pageId: string) => {
    setPendingDatePageId(pageId);
    setShowDateModal(true);
  }, []);

  const openFilterModal = useCallback((pageId: string, mediaId: string) => {
    setPendingFilterInfo({ pageId, mediaId });
    setShowFilterModal(true);
  }, []);

  const openPinModal = useCallback((pageId: string) => {
    setPendingPinPageId(pageId);
    setShowPinModal(true);
  }, []);

  const addSessionUnlock = useCallback((pageId: string) => {
    setSessionUnlockedPins(prev => [...prev, pageId]);
  }, []);

  const useFilterFreeSlot = useCallback(() => {
    incrementFilterQuota();
    setFilterQuota(prev => prev + 1);
  }, []);

  const confirmFreePageUnlock = useCallback(() => {
    if (pendingPageFn) pendingPageFn();
    incrementWeeklyUnlockQuota();
    setWeeklyUnlockQuota(prev => prev + 1);
    setPendingPageFn(null);
    setShowPageModal(false);
  }, [pendingPageFn]);

  const confirmPaidPageAdd = useCallback(() => {
    if (pendingPageFn) pendingPageFn();
    setPendingPageFn(null);
    setShowPageModal(false);
  }, [pendingPageFn]);

  const confirmPaidMediaAdd = useCallback(() => {
    if (pendingMediaFn) {
      pendingMediaFn();
      if (pendingMediaType === 'photo') {
        incrementPhotoQuota(); setPhotoQuota(prev => prev + 1);
      } else {
        incrementVideoAudioQuota(); setVideoAudioQuota(prev => prev + 1);
      }
    }
    setPendingMediaFn(null); setPendingMediaType(null); setShowMediaModal(false);
  }, [pendingMediaFn, pendingMediaType]);

  const updatePage = useCallback((pageId: string, updates: Partial<DiaryPage>) => {
    setDiary(d => ({ ...d, pages: d.pages.map(p => p.id === pageId ? { ...p, ...updates } : p) }));
  }, []);

  const addPostIt = useCallback((pageId: string, postIt: PostItItem) => {
    setDiary(d => ({ ...d, pages: d.pages.map(p => p.id === pageId ? { ...p, postIts: [...p.postIts, postIt] } : p) }));
  }, []);
  const updatePostIt = useCallback((pageId: string, id: string, updates: Partial<PostItItem>) => {
    setDiary(d => ({ ...d, pages: d.pages.map(p => p.id === pageId ? { ...p, postIts: p.postIts.map(pt => pt.id === id ? { ...pt, ...updates } : pt) } : p) }));
  }, []);
  const removePostIt = useCallback((pageId: string, id: string) => {
    setDiary(d => ({ ...d, pages: d.pages.map(p => p.id === pageId ? { ...p, postIts: p.postIts.filter(pt => pt.id !== id) } : p) }));
  }, []);

  const addMedia = useCallback((pageId: string, media: MediaItem) => {
    setDiary(d => ({ ...d, pages: d.pages.map(p => p.id === pageId ? { ...p, media: [...p.media, media] } : p) }));
  }, []);
  const updateMedia = useCallback((pageId: string, id: string, updates: Partial<MediaItem>) => {
    setDiary(d => ({ ...d, pages: d.pages.map(p => p.id === pageId ? { ...p, media: p.media.map(m => m.id === id ? { ...m, ...updates } : m) } : p) }));
  }, []);
  const removeMedia = useCallback((pageId: string, id: string) => {
    setDiary(d => ({ ...d, pages: d.pages.map(p => p.id === pageId ? { ...p, media: p.media.filter(m => m.id !== id) } : p) }));
  }, []);

  const addSticker = useCallback((pageId: string, sticker: StickerItem) => {
    setDiary(d => ({ ...d, pages: d.pages.map(p => p.id === pageId ? { ...p, stickers: [...(p.stickers || []), sticker] } : p) }));
  }, []);
  const updateSticker = useCallback((pageId: string, id: string, updates: Partial<StickerItem>) => {
    setDiary(d => ({ ...d, pages: d.pages.map(p => p.id === pageId ? { ...p, stickers: (p.stickers || []).map(s => s.id === id ? { ...s, ...updates } : s) } : p) }));
  }, []);
  const removeSticker = useCallback((pageId: string, id: string) => {
    setDiary(d => ({ ...d, pages: d.pages.map(p => p.id === pageId ? { ...p, stickers: (p.stickers || []).filter(s => s.id !== id) } : p) }));
  }, []);

  const addPage = useCallback((count = 1) => {
    setDiary(d => {
      let pages = [...d.pages];
      for (let i = 0; i < count; i++) {
        const pageNumber = pages.length + 1;
        pages = [...pages, createDefaultPage(pageNumber, pageNumber > FREE_PAGES)];
      }
      return { ...d, pages };
    });
  }, []);
  const removePage = useCallback((pageId: string) => {
    setDiary(d => {
      if (d.pages.length <= 1) return d;
      const pages = d.pages.filter(p => p.id !== pageId).map((p, i) => ({ ...p, pageNumber: i + 1 }));
      return { ...d, pages };
    });
  }, []);
  const updateDiaryTitle = useCallback((title: string) => {
    setDiary(d => ({ ...d, title }));
  }, []);
  const updateSettings = useCallback((settings: Partial<DiarySettings>) => {
    setDiary(d => ({ ...d, settings: { ...d.settings, ...settings } }));
  }, []);

  return React.createElement(StoreContext.Provider, {
    value: {
      diary, currentPage, editMode, walletAddress,
      profileUsername, profilePhotoUrl, setProfileUsername, setProfilePhotoUrl,
      pendingEmoji,
      deleteQuota, photoQuota, videoAudioQuota,
      showDeleteModal, showMediaModal, pendingMediaType,
      pendingDeleteFn, pendingMediaFn,
      setCurrentPage, setEditMode, setWalletAddress, setPendingEmoji,
      setShowDeleteModal, setShowMediaModal, setShowPageModal,
      requestDelete, confirmPaidDelete,
      requestMediaAdd, confirmPaidMediaAdd,
      requestPageUnlock, confirmPaidPageAdd,
      showPageModal, pendingPageFn,
      showDateModal, pendingDatePageId, setShowDateModal, openDateModal,
      showFilterModal, pendingFilterInfo, setShowFilterModal, openFilterModal,
      showPinModal, pendingPinPageId, setShowPinModal, openPinModal,
      sessionUnlockedPins, addSessionUnlock,
      filterQuota, weeklyUnlockQuota, useFilterFreeSlot, confirmFreePageUnlock,
      toast, showToast,
      requestedBookPage, setRequestedBookPage,
      updatePage, addPostIt, updatePostIt, removePostIt,
      addMedia, updateMedia, removeMedia,
      addSticker, updateSticker, removeSticker,
      addPage, removePage, updateDiaryTitle, updateSettings,
    }
  }, children);
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
