'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { setProfileOnChain, getProfileFromChain, sha256Hex, PROFILE_CONTRACT_ID } from '@/lib/contract';

interface Props {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: Props) {
  const { walletAddress, profileUsername, profilePhotoUrl, setProfileUsername, setProfilePhotoUrl } = useStore();

  const [username, setUsername] = useState(profileUsername || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(profilePhotoUrl);
  const [pendingPhotoData, setPendingPhotoData] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chainProfile, setChainProfile] = useState<{ username: string; updated_at: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!walletAddress) return;
    getProfileFromChain(walletAddress).then(p => {
      if (p) setChainProfile({ username: p.username, updated_at: p.updated_at });
    });
  }, [walletAddress]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target?.result as string;
      setPhotoPreview(data);
      setPendingPhotoData(data);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!walletAddress) { setError('Önce cüzdanını bağla'); return; }
    if (!username.trim()) { setError('Kullanıcı adı boş olamaz'); return; }
    setSaving(true);
    setError(null);
    setTxHash(null);
    try {
      const photoData = pendingPhotoData || profilePhotoUrl || '';
      const photoHash = photoData ? await sha256Hex(photoData) : 'no-photo';
      const hash = await setProfileOnChain(walletAddress, username.trim(), photoHash);
      setTxHash(hash);
      setProfileUsername(username.trim());
      if (pendingPhotoData) {
        setProfilePhotoUrl(pendingPhotoData);
        setPendingPhotoData(null);
      }
      setChainProfile({ username: username.trim(), updated_at: Date.now() / 1000 });
    } catch (err) {
      setError((err as Error).message || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  }

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`
    : null;

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : walletAddress
    ? walletAddress.slice(0, 2).toUpperCase()
    : '??';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(250,248,246,0.98)',
          backdropFilter: 'blur(24px)',
          borderRadius: 24,
          padding: '32px 28px',
          width: 360,
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 'bold', color: '#2c2a27' }}>
              Profilim
            </div>
            <div style={{ fontSize: 10, color: '#9a9490', marginTop: 2 }}>
              Stellar Testnet
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9a9490' }}>
            ✕
          </button>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 90, height: 90, borderRadius: '50%',
              background: photoPreview ? 'transparent' : 'linear-gradient(135deg,#5a6476,#3a4560)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: photoPreview ? undefined : 28,
              color: 'white',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              border: '3px solid rgba(255,255,255,0.8)',
              position: 'relative',
            }}
            onClick={() => fileRef.current?.click()}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(0,0,0,0.45)',
              fontSize: 10, color: 'white', textAlign: 'center',
              padding: '3px 0', fontFamily: 'Georgia,serif',
            }}>
              Değiştir
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          <div style={{ fontSize: 11, color: '#9a9490', marginTop: 8 }}>
            Fotoğrafa tıkla veya değiştir
          </div>
        </div>

        {/* Username */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#6a6460', fontWeight: 'bold', display: 'block', marginBottom: 6 }}>
            Kullanıcı Adı
          </label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="adın ne olsun?"
            maxLength={32}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.12)',
              background: 'rgba(255,255,255,0.8)',
              fontFamily: 'Georgia,serif', fontSize: 14, color: '#2c2a27',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Wallet */}
        {walletAddress && (
          <div style={{
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(80,160,120,0.08)',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, color: '#5a8070', marginBottom: 2 }}>Bağlı Cüzdan</div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#3a7060', wordBreak: 'break-all' }}>
              {shortAddr}
            </div>
          </div>
        )}

        {/* Chain profile info */}
        {chainProfile && (
          <div style={{
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(90,100,118,0.07)',
            marginBottom: 16,
            fontSize: 11, color: '#6a6880',
          }}>
            <span style={{ fontSize: 10, fontWeight: 'bold', display: 'block', marginBottom: 3 }}>
              ✅ Zincirde kayıtlı
            </span>
            <span>@{chainProfile.username}</span>
            <span style={{ marginLeft: 8, opacity: 0.6 }}>
              {new Date(chainProfile.updated_at * 1000).toLocaleDateString('tr-TR')}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(220,38,38,0.08)',
            marginBottom: 12,
            fontSize: 11, color: '#dc2626',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Tx hash */}
        {txHash && (
          <div style={{
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(80,160,120,0.1)',
            marginBottom: 12,
            fontSize: 10, color: '#3a8060',
          }}>
            ✅ Kaydedildi!{' '}
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3a8060', fontFamily: 'monospace' }}
            >
              {txHash.slice(0, 12)}...
            </a>
          </div>
        )}

        {/* Contract info */}
        <div style={{
          padding: '6px 10px', borderRadius: 8,
          background: 'rgba(0,0,0,0.04)',
          marginBottom: 16,
          fontSize: 9, color: '#aaa', fontFamily: 'monospace',
          wordBreak: 'break-all',
        }}>
          📋 Kontrat: {PROFILE_CONTRACT_ID.slice(0, 20)}...
        </div>

        {/* Save button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving || !walletAddress}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 14,
            background: saving || !walletAddress
              ? 'rgba(0,0,0,0.1)'
              : 'linear-gradient(135deg,#5a6476,#3a4560)',
            color: saving || !walletAddress ? '#aaa' : 'white',
            border: 'none', cursor: saving || !walletAddress ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 'bold', fontFamily: 'Georgia,serif',
          }}
        >
          {saving ? (
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
              ⏳ Kontrata gönderiliyor...
            </motion.span>
          ) : !walletAddress ? (
            '🔗 Önce cüzdanını bağla'
          ) : (
            '🌟 Kaydet & Kontrata Gönder'
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
