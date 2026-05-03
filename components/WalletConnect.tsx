'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  connectFreighter, getBalance, fundTestnetAccount,
  FreighterNotInstalledError,
} from '@/lib/stellar';
import { useStore } from '@/lib/store';

// ── Platform-specific install info ──────────────────────────────────────────
function getInstallInfo(): { primary: string; primaryLabel: string; note: string } {
  if (typeof window === 'undefined')
    return { primary: 'https://www.freighter.app', primaryLabel: 'freighter.app', note: '' };

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|Chrome|Chromium/i.test(ua);
  const isFirefox = /Firefox/i.test(ua);
  const isChrome = /Chrome|Chromium|CriOS/i.test(ua);

  if (isIOS) {
    return {
      primary: 'https://apps.apple.com/app/freighter/id1609554502',
      primaryLabel: '📱 App Store\'dan Aç',
      note: 'iPhone / iPad → Freighter uygulaması gerekli',
    };
  }
  if (isAndroid) {
    return {
      primary: 'https://www.freighter.app',
      primaryLabel: '🌐 freighter.app',
      note: 'Android: freighter.app üzerinden yükleyebilirsiniz',
    };
  }
  if (isSafari) {
    return {
      primary: 'https://apps.apple.com/app/freighter/id1609554502',
      primaryLabel: '🍎 Mac App Store\'dan Yükle',
      note: 'Safari → Mac App Store üzerinden Safari uzantısı yüklenir',
    };
  }
  if (isFirefox) {
    return {
      primary: 'https://addons.mozilla.org/firefox/addon/freighter/',
      primaryLabel: '🦊 Firefox\'a Ekle',
      note: 'Firefox Eklenti Mağazasından ücretsiz ekleyin',
    };
  }
  if (isChrome) {
    return {
      primary: 'https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk',
      primaryLabel: '🧩 Chrome\'a Ekle',
      note: 'Chrome Web Store\'dan ücretsiz ekleyin',
    };
  }
  return {
    primary: 'https://www.freighter.app',
    primaryLabel: '⬇️ Freighter\'ı İndir',
    note: 'Tüm büyük tarayıcıları destekler',
  };
}

export default function WalletConnect() {
  const { walletAddress, setWalletAddress } = useStore();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [funding, setFunding] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  async function handleConnect() {
    setConnectError(null);
    setLoading(true);
    try {
      const addr = await connectFreighter();
      if (addr) {
        setWalletAddress(addr);
        const bal = await getBalance(addr);
        setBalance(bal);
        setShowPanel(true);
        setShowInstall(false);
      }
    } catch (err) {
      if (err instanceof FreighterNotInstalledError) {
        setShowInstall(true);
      } else {
        const msg = (err as Error)?.message ?? 'Bilinmeyen hata';
        console.error('[WalletConnect] handleConnect error:', err);
        setConnectError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleFund() {
    if (!walletAddress) return;
    setFunding(true);
    try {
      await fundTestnetAccount(walletAddress);
      await new Promise(r => setTimeout(r, 3500));
      const bal = await getBalance(walletAddress);
      setBalance(bal);
    } catch (err) {
      console.error('[WalletConnect] handleFund error:', err);
    } finally {
      setFunding(false);
    }
  }

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : '';

  const install = getInstallInfo();

  return (
    <div style={{ position: 'relative' }}>
      {!walletAddress ? (
        <>
          <motion.button
            whileHover={{ scale: 1.06, boxShadow: '0 4px 20px rgba(90,100,118,0.4)' }}
            whileTap={{ scale: 0.94 }}
            onClick={handleConnect}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 16px', borderRadius: 24,
              background: 'linear-gradient(135deg, #5a6476 0%, #3a4560 100%)',
              color: 'white', border: 'none', cursor: loading ? 'wait' : 'pointer',
              fontSize: 12, fontWeight: 'bold', fontFamily: 'Georgia, serif',
              boxShadow: '0 2px 12px rgba(60,70,90,0.25)', letterSpacing: 0.3,
            }}
          >
            {loading ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                ✿
              </motion.span>
            ) : (
              <>
                <span style={{ fontSize: 14 }}>🔗</span>
                <span>Cüzdan Bağla</span>
              </>
            )}
          </motion.button>

          {/* Connect error (non-install failures) */}
          <AnimatePresence>
            {connectError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', right: 0, top: 44, zIndex: 9999,
                  background: '#fff3f3', border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 12, padding: '10px 14px',
                  fontSize: 11, color: '#dc2626', maxWidth: 240,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                }}
              >
                ⚠️ {connectError}
                <button onClick={() => setConnectError(null)}
                  style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#dc2626' }}>
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Install instructions panel */}
          <AnimatePresence>
            {showInstall && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                style={{
                  position: 'absolute', right: 0, top: 48, zIndex: 9999,
                  padding: 18, borderRadius: 18,
                  background: 'rgba(248,246,244,0.98)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(0,0,0,0.09)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
                  minWidth: 270,
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2c2a27', marginBottom: 2 }}>
                      Freighter Cüzdanı Gerekli
                    </div>
                    <div style={{ fontSize: 11, color: '#6a6460' }}>
                      Stellar blockchain işlemleri için
                    </div>
                  </div>
                  <button onClick={() => setShowInstall(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9490', fontSize: 16 }}>
                    ✕
                  </button>
                </div>

                <div style={{
                  fontSize: 11, color: '#6a6460',
                  background: 'rgba(0,0,0,0.04)', borderRadius: 8,
                  padding: '7px 10px', marginBottom: 12,
                }}>
                  {install.note}
                </div>

                <a
                  href={install.primary}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center',
                    padding: '10px 0', borderRadius: 12,
                    background: 'linear-gradient(135deg, #5a6476, #3a4560)',
                    color: 'white', textDecoration: 'none',
                    fontSize: 12, fontWeight: 'bold',
                    marginBottom: 8,
                  }}
                >
                  {install.primaryLabel}
                </a>

                <a
                  href="https://www.freighter.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center',
                    fontSize: 11, color: '#5a6476',
                    textDecoration: 'none', padding: '5px 0',
                  }}
                >
                  🌐 freighter.app →
                </a>

                <div style={{ fontSize: 10, color: '#aaa', marginTop: 10, textAlign: 'center' }}>
                  Yükledikten sonra sayfayı yenileyin ve tekrar deneyin
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div style={{ position: 'relative' }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            onClick={() => setShowPanel(!showPanel)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 24,
              background: 'linear-gradient(135deg, #a8e6cf 0%, #56b887 100%)',
              color: 'white', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 'bold',
              boxShadow: '0 2px 12px rgba(80,180,120,0.25)',
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              display: 'inline-block',
              boxShadow: '0 0 6px rgba(255,255,255,0.8)',
            }} />
            <span>🌟 {shortAddr}</span>
            <span style={{ fontSize: 10, opacity: 0.85 }}>{balance} XLM</span>
          </motion.button>

          <AnimatePresence>
            {showPanel && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                style={{
                  position: 'absolute', right: 0, top: 48, zIndex: 9999,
                  padding: 18, borderRadius: 20,
                  background: 'rgba(248,253,252,0.97)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(80,180,120,0.2)',
                  boxShadow: '0 12px 48px rgba(60,160,100,0.15)',
                  minWidth: 260,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 'bold', color: '#3a8060', marginBottom: 4, fontFamily: 'Georgia' }}>
                  🌟 Stellar Testnet
                </div>
                <div style={{
                  fontSize: 10, color: '#5a8070', marginBottom: 12,
                  wordBreak: 'break-all', fontFamily: 'monospace',
                  background: 'rgba(80,160,120,0.08)', padding: '6px 8px', borderRadius: 8,
                }}>
                  {walletAddress}
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 12, padding: '8px 12px', borderRadius: 12,
                  background: 'rgba(80,160,120,0.08)',
                }}>
                  <span style={{ fontSize: 12, color: '#5a7060' }}>Bakiye</span>
                  <span style={{ fontWeight: 'bold', color: '#3a8060', fontSize: 14 }}>{balance} XLM</span>
                </div>

                {parseFloat(balance || '0') < 1 && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    onClick={handleFund}
                    disabled={funding}
                    style={{
                      width: '100%', padding: '9px 0', borderRadius: 12,
                      background: funding ? '#b0d8c0' : 'linear-gradient(135deg, #56b887, #3a8060)',
                      color: 'white', border: 'none', cursor: funding ? 'wait' : 'pointer',
                      fontSize: 12, fontWeight: 'bold', marginBottom: 8,
                    }}
                  >
                    {funding ? '⏳ Yükleniyor...' : '🚰 Ücretsiz Testnet XLM Al'}
                  </motion.button>
                )}

                <a
                  href={`https://stellar.expert/explorer/testnet/account/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center',
                    fontSize: 11, color: '#3a8060',
                    textDecoration: 'none', marginBottom: 8,
                    padding: '6px 0', borderRadius: 8,
                    background: 'rgba(80,160,120,0.08)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(80,160,120,0.16)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(80,160,120,0.08)')}
                >
                  Stellar Explorer'da Görüntüle ↗
                </a>

                <button
                  onClick={() => { setWalletAddress(null); setShowPanel(false); setBalance(null); }}
                  style={{
                    width: '100%', padding: '4px 0', fontSize: 11,
                    color: 'rgba(100,120,110,0.6)', background: 'none', border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Bağlantıyı Kes
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
