'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MediaItem } from '@/lib/types';
import { useStore } from '@/lib/store';
import { mintNFT, getStellarExpertUrl } from '@/lib/stellar';

interface Props {
  media: MediaItem;
  pageId: string;
  isActive: boolean; // whether this page is currently visible
}

export default function MediaBlock({ media, pageId, isActive }: Props) {
  const { updateMedia, removeMedia, walletAddress } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [minting, setMinting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Auto-play video/audio when page becomes active
  useEffect(() => {
    if (media.type === 'video' && videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
    if (media.type === 'audio' && audioRef.current) {
      if (isActive) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isActive, media.type]);

  async function handleMintNFT() {
    if (!walletAddress) {
      alert('Önce Freighter cüzdanınızı bağlayın!');
      return;
    }
    setMinting(true);
    const result = await mintNFT(walletAddress, media.url, media.name || 'media', media.type as 'photo' | 'audio');
    if (result) {
      updateMedia(pageId, media.id, {
        nftAssetCode: result.assetCode,
        nftIssuer: result.issuer,
        nftTxHash: result.txHash,
      });
    }
    setMinting(false);
  }

  function handleDragStart(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: media.x, py: media.y };
    function onMove(ev: MouseEvent) {
      updateMedia(pageId, media.id, {
        x: dragStart.current.px + (ev.clientX - dragStart.current.x),
        y: dragStart.current.py + (ev.clientY - dragStart.current.y),
      });
    }
    function onUp() {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        position: 'absolute',
        left: media.x,
        top: media.y,
        width: media.width,
        zIndex: dragging ? 100 : 20,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleDragStart}
      onDoubleClick={e => { e.stopPropagation(); removeMedia(pageId, media.id); }}
    >
      {/* NFT badge */}
      {media.nftTxHash && (
        <motion.a
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          href={getStellarExpertUrl(media.nftTxHash)}
          target="_blank"
          rel="noopener noreferrer"
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: -10, right: -10, zIndex: 30,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 12, boxShadow: '0 2px 8px rgba(102,126,234,0.5)',
            textDecoration: 'none',
          }}
          title="NFT - Stellar Explorer'da Görüntüle"
        >
          ⭐
        </motion.a>
      )}

      {/* Photo */}
      {media.type === 'photo' && (
        <div style={{ position: 'relative' }}>
          <img
            src={media.url}
            alt={media.name}
            style={{
              width: '100%',
              borderRadius: 8,
              boxShadow: '2px 4px 16px rgba(0,0,0,0.25)',
              display: 'block',
              border: '3px solid white',
              pointerEvents: 'none',
              filter: media.filter || 'none',
              transition: 'filter 0.3s',
            }}
            draggable={false}
          />
          {/* Photo tape effect */}
          <div style={{
            position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
            width: 40, height: 16, background: 'rgba(255,230,100,0.7)',
            borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }} />
        </div>
      )}

      {/* Video */}
      {media.type === 'video' && (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <video
            ref={videoRef}
            src={media.url}
            style={{ width: '100%', display: 'block', borderRadius: 10 }}
            controls
            playsInline
            loop
            muted={false}
            onMouseDown={e => e.stopPropagation()}
          />
          {isActive && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              style={{
                position: 'absolute', top: 8, left: 8,
                background: 'rgba(255,80,80,0.85)', color: 'white',
                borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 'bold',
                pointerEvents: 'none',
              }}
            >
              ▶ Otomatik Oynatıldı
            </motion.div>
          )}
        </div>
      )}

      {/* Audio */}
      {media.type === 'audio' && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea20, #764ba220)',
          borderRadius: 12, padding: 12,
          border: '1px solid rgba(102,126,234,0.3)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <motion.div
              animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ repeat: Infinity, duration: 1 }}
              style={{ fontSize: 24 }}
            >
              🎵
            </motion.div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#667eea' }}>
                {media.name || 'Ses Kaydı'}
              </div>
              {isActive && <div style={{ fontSize: 10, color: '#764ba2' }}>♪ Çalıyor...</div>}
            </div>
          </div>
          <audio
            ref={audioRef}
            src={media.url}
            controls
            style={{ width: '100%', height: 32 }}
            onMouseDown={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Filter badge */}
      {media.filter && (
        <div style={{
          position: 'absolute', top: -6, left: -6, zIndex: 25,
          background: 'linear-gradient(135deg,#f59e0b,#d97706)',
          color: 'white', borderRadius: '50%', width: 22, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }} title="Filtre uygulandı">✨</div>
      )}

      {/* Options button */}
      <button
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setShowOptions(!showOptions); }}
        style={{
          position: 'absolute', bottom: 4, right: 4,
          background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 6,
          color: 'white', padding: '2px 6px', cursor: 'pointer', fontSize: 11,
          zIndex: 25,
        }}
      >
        ⚙
      </button>

      {showOptions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 32, right: 0, zIndex: 200,
            background: 'white', borderRadius: 12, padding: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)', minWidth: 180,
          }}
        >
          {(media.type === 'photo' || media.type === 'audio') && !media.nftTxHash && (
            <button
              onClick={handleMintNFT}
              disabled={minting}
              className="w-full py-2 rounded-xl text-sm font-bold mb-2"
              style={{
                background: minting
                  ? '#ccc'
                  : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', border: 'none', cursor: minting ? 'wait' : 'pointer',
              }}
            >
              {minting ? '⏳ NFT Oluşturuluyor...' : '⭐ NFT Olarak Kaydet'}
            </button>
          )}

          {media.nftTxHash && (
            <a
              href={getStellarExpertUrl(media.nftTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-1 text-xs text-purple-600 hover:underline mb-2"
            >
              ✅ NFT Onaylandı — Explorer'da Gör ↗
            </a>
          )}

          {/* Resize */}
          <div style={{ fontSize: 11, color: '#a07090', marginBottom: 4 }}>
            Boyut: <strong style={{ color: '#c06090' }}>{media.width}px</strong>
          </div>
          <input
            type="range" min={60} max={420} value={media.width}
            onChange={e => updateMedia(pageId, media.id, { width: parseInt(e.target.value) })}
            style={{ width: '100%', marginBottom: 6, accentColor: '#c06090' }}
          />
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {[100, 150, 200, 280, 360].map(w => (
              <button key={w}
                onClick={() => updateMedia(pageId, media.id, { width: w })}
                style={{
                  flex: 1, padding: '2px 0', borderRadius: 6, fontSize: 10,
                  background: media.width === w ? 'linear-gradient(135deg, #e8a0c8, #c06090)' : '#f8eef4',
                  color: media.width === w ? 'white' : '#a07090',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {w}
              </button>
            ))}
          </div>

          <button
            onClick={() => removeMedia(pageId, media.id)}
            className="w-full py-1 rounded-lg text-xs text-red-500 hover:bg-red-50"
          >
            🗑️ Sil
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
