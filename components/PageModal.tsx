'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import * as StellarSdk from '@stellar/stellar-sdk';
import { signAndSubmit, connectFreighter, getBalance, fundTestnetAccount, FreighterNotInstalledError } from '@/lib/stellar';

const TREASURY = 'GDLODGTPRDPQ2VG3O26UZMHHKWBRZXE2OOLLWYKDRZDEZ5PBZ4CGUTQ6';

export default function PageModal() {
  const { showPageModal, setShowPageModal, walletAddress, setWalletAddress, confirmPaidPageAdd, confirmFreePageUnlock, weeklyUnlockQuota, diary } = useStore();
  const hasFreeUnlock = weeklyUnlockQuota < 1; // haftada 1 ücretsiz
  const [balance, setBalance] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (walletAddress && showPageModal) getBalance(walletAddress).then(setBalance);
    else setBalance(null);
  }, [walletAddress, showPageModal]);

  async function handleConnect() {
    setError(''); setConnecting(true);
    try {
      const addr = await connectFreighter();
      if (addr) { setWalletAddress(addr); setBalance(await getBalance(addr)); }
    } catch (err) {
      setError(err instanceof FreighterNotInstalledError
        ? 'Freighter uzantısı yüklü değil. freighter.app adresinden yükleyin.'
        : (err as Error)?.message || 'Bağlantı başarısız.');
    } finally { setConnecting(false); }
  }

  async function handleFund() {
    if (!walletAddress) return;
    setFunding(true); setError('');
    try {
      await fundTestnetAccount(walletAddress);
      await new Promise(r => setTimeout(r, 3500));
      setBalance(await getBalance(walletAddress));
    } catch { } finally { setFunding(false); }
  }

  async function handlePay() {
    if (!walletAddress) return;
    setPaying(true); setError('');
    try {
      await signAndSubmit(walletAddress, account =>
        new StellarSdk.TransactionBuilder(account, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
          .addOperation(StellarSdk.Operation.payment({
            destination: TREASURY,
            asset: StellarSdk.Asset.native(),
            amount: '1',
          }))
          .addMemo(StellarSdk.Memo.text('ani-defteri-page'))
          .setTimeout(30)
          .build() as StellarSdk.Transaction
      );
      confirmPaidPageAdd();
    } catch (e: any) {
      setError(e?.message || 'İşlem başarısız. Bakiyenizi kontrol edin.');
    } finally { setPaying(false); }
  }

  const xlmBalance = parseFloat(balance ?? '-1');
  const hasEnough = xlmBalance >= 1;

  return (
    <AnimatePresence>
      {showPageModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 9998 }}
            onClick={() => { setShowPageModal(false); setError(''); }}
          />
          <motion.div
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
            style={{
              position: 'fixed', right: 16, top: 80, zIndex: 9999,
              background: '#faf8f5', borderRadius: 20, padding: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
              width: 300, maxWidth: 'calc(100vw - 32px)',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ textAlign: 'center', fontSize: 44, marginBottom: 10 }}>🔒</div>
            <h2 style={{ textAlign: 'center', fontSize: 17, fontWeight: 'bold', color: '#2c2a27', marginBottom: 6, fontFamily: 'Georgia' }}>
              Bu Sayfa Kilitli
            </h2>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#6a6460', marginBottom: 16, lineHeight: 1.6 }}>
              {hasFreeUnlock
                ? <><strong style={{ color: '#3a8060' }}>Bu hafta 1 ücretsiz açma hakkın var!</strong><br />Aşağıdaki butona tıkla, hemen aç.</>
                : <>Bu haftaki ücretsiz hakkın kullanıldı.<br />Bu sayfayı açmak için <strong style={{ color: '#2c2a27' }}>1 XLM</strong> ya da<br /><strong style={{ color: '#2c2a27' }}>gelecek haftayı</strong> bekle.</>
              }
            </p>

            {hasFreeUnlock && (
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => confirmFreePageUnlock()}
                style={{ width: '100%', padding: '12px 0', background: 'linear-gradient(135deg,#56b887,#3a8060)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', marginBottom: 12, fontFamily: 'Georgia' }}>
                🔓 Ücretsiz Aç
              </motion.button>
            )}

            {!hasFreeUnlock && !walletAddress && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ background: 'rgba(220,38,38,0.06)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#dc2626', marginBottom: 10, textAlign: 'center' }}>
                  ⚠️ Cüzdan bağlı değil
                </div>
                <motion.button whileHover={{ scale: 1.02 }} onClick={handleConnect} disabled={connecting}
                  style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: connecting ? '#ccc' : 'linear-gradient(135deg,#5a6476,#3a4560)', color: 'white', border: 'none', cursor: connecting ? 'wait' : 'pointer', fontSize: 13, fontWeight: 'bold', fontFamily: 'Georgia' }}>
                  {connecting ? '⏳ Bağlanıyor...' : '🔗 Freighter Cüzdanını Bağla'}
                </motion.button>
              </div>
            )}

            {!hasFreeUnlock && walletAddress && (
              <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#6a6460' }}>Cüzdan</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a4640' }}>{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6a6460' }}>Bakiye</span>
                  {balance === null
                    ? <span style={{ color: '#aaa', fontSize: 11 }}>yükleniyor…</span>
                    : <span style={{ fontWeight: 'bold', color: hasEnough ? '#3a8060' : '#dc2626', fontSize: 14 }}>{balance} XLM</span>}
                </div>
                {balance !== null && !hasEnough && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 8, textAlign: 'center' }}>Yetersiz bakiye — en az 1 XLM gerekiyor</div>
                    <motion.button whileHover={{ scale: 1.02 }} onClick={handleFund} disabled={funding}
                      style={{ width: '100%', padding: '8px 0', borderRadius: 10, background: funding ? '#b0d8c0' : 'linear-gradient(135deg,#56b887,#3a8060)', color: 'white', border: 'none', cursor: funding ? 'wait' : 'pointer', fontSize: 12, fontWeight: 'bold' }}>
                      {funding ? '⏳ Yükleniyor...' : '🚰 Ücretsiz Testnet XLM Al'}
                    </motion.button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#dc2626' }}>{error}</div>
            )}

            {!hasFreeUnlock && walletAddress && (
              <motion.button
                whileHover={hasEnough && !paying ? { scale: 1.03 } : {}}
                whileTap={hasEnough && !paying ? { scale: 0.97 } : {}}
                onClick={handlePay}
                disabled={paying || !hasEnough || balance === null}
                style={{ width: '100%', padding: '12px 0', background: paying || !hasEnough || balance === null ? '#ccc' : 'linear-gradient(135deg,#2c2a27,#1e1e1e)', color: '#e8e0d0', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 'bold', cursor: paying || !hasEnough ? 'not-allowed' : 'pointer', marginBottom: 8, fontFamily: 'Georgia' }}>
                {paying ? '⏳ İşlem Yapılıyor...' : '🔓 1 XLM Öde, Sayfayı Aç'}
              </motion.button>
            )}

            <button onClick={() => { setShowPageModal(false); setError(''); }}
              style={{ width: '100%', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9a9490' }}>
              Vazgeç
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
