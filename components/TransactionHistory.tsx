'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';

interface HorizonOperation {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  from?: string;
  to?: string;
  function?: string;
}

interface HorizonTransaction {
  id: string;
  hash: string;
  created_at: string;
  fee_charged: string;
  operation_count: number;
  memo?: string;
  memo_type?: string;
  successful: boolean;
}

function operationIcon(type: string) {
  switch (type) {
    case 'payment': return '💸';
    case 'create_account': return '🌱';
    case 'manage_data': return '📝';
    case 'invoke_host_function': return '🤖';
    case 'change_trust': return '🤝';
    case 'set_options': return '⚙️';
    default: return '📄';
  }
}

function operationLabel(op: HorizonOperation) {
  switch (op.type) {
    case 'payment':
      return `${parseFloat(op.amount || '0').toFixed(2)} ${op.asset_type === 'native' ? 'XLM' : (op.asset_code || '')}`;
    case 'create_account': return 'Hesap oluşturuldu';
    case 'manage_data': return 'Veri güncellendi';
    case 'invoke_host_function': return 'Kontrat çağrısı';
    case 'change_trust': return 'Güven değişikliği';
    case 'set_options': return 'Ayar değişikliği';
    default: return op.type.replace(/_/g, ' ');
  }
}

interface Props {
  onClose: () => void;
}

export default function TransactionHistory({ onClose }: Props) {
  const { walletAddress } = useStore();
  const [ops, setOps] = useState<HorizonOperation[]>([]);
  const [txs, setTxs] = useState<HorizonTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'ops' | 'txs'>('ops');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}/operations?limit=15&order=desc`)
        .then(r => r.json())
        .then(d => setOps(d._embedded?.records || [])),
      fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}/transactions?limit=15&order=desc`)
        .then(r => r.json())
        .then(d => setTxs(d._embedded?.records || [])),
    ])
      .catch(() => setError('İşlemler yüklenemedi'))
      .finally(() => setLoading(false));
  }, [walletAddress]);

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : '';

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
          padding: '28px 24px',
          width: 420,
          maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 'bold', color: '#2c2a27' }}>
              İşlem Geçmişi
            </div>
            {walletAddress && (
              <div style={{ fontSize: 10, color: '#9a9490', fontFamily: 'monospace', marginTop: 2 }}>
                {shortAddr}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9a9490' }}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['ops', 'txs'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 16px', borderRadius: 20,
                border: 'none', cursor: 'pointer',
                background: tab === t
                  ? 'linear-gradient(135deg,#5a6476,#3a4560)'
                  : 'rgba(0,0,0,0.06)',
                color: tab === t ? 'white' : '#6a6460',
                fontSize: 12, fontWeight: 'bold',
              }}
            >
              {t === 'ops' ? '⚡ Operasyonlar' : '📋 İşlemler'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {!walletAddress ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 13 }}>
              Cüzdanını bağla
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ fontSize: 24, display: 'inline-block' }}
              >
                ✿
              </motion.div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#dc2626', fontSize: 12 }}>
              {error}
            </div>
          ) : tab === 'ops' ? (
            ops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 13 }}>
                Henüz operasyon yok
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ops.map(op => (
                  <motion.div
                    key={op.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      padding: '10px 14px', borderRadius: 12,
                      background: op.type === 'invoke_host_function'
                        ? 'rgba(90,100,118,0.1)'
                        : 'rgba(0,0,0,0.04)',
                      border: op.type === 'invoke_host_function'
                        ? '1px solid rgba(90,100,118,0.2)'
                        : '1px solid transparent',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{operationIcon(op.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 'bold', color: '#2c2a27' }}>
                        {operationLabel(op)}
                      </div>
                      <div style={{ fontSize: 10, color: '#9a9490', marginTop: 2 }}>
                        {new Date(op.created_at).toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${op.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 10, color: '#5a6476', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      {op.transaction_hash.slice(0, 8)}... ↗
                    </a>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            txs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 13 }}>
                Henüz işlem yok
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {txs.map(tx => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      padding: '10px 14px', borderRadius: 12,
                      background: tx.successful ? 'rgba(80,160,120,0.07)' : 'rgba(220,38,38,0.07)',
                      border: `1px solid ${tx.successful ? 'rgba(80,160,120,0.15)' : 'rgba(220,38,38,0.15)'}`,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{tx.successful ? '✅' : '❌'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#2c2a27', fontWeight: 'bold' }}>
                        {tx.hash.slice(0, 16)}...
                      </div>
                      <div style={{ fontSize: 10, color: '#9a9490', marginTop: 2 }}>
                        {new Date(tx.created_at).toLocaleString('tr-TR')}
                        {' · '}
                        {tx.operation_count} op
                        {' · '}
                        {(parseInt(tx.fee_charged) / 1e7).toFixed(5)} XLM
                      </div>
                    </div>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 10, color: '#5a6476', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      ↗
                    </a>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        {walletAddress && !loading && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#5a6476', textDecoration: 'none' }}
            >
              Tüm geçmişi Stellar Explorer'da gör ↗
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
