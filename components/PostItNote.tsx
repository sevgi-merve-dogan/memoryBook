'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PostItItem } from '@/lib/types';
import { useStore } from '@/lib/store';

const PATTERNS: Record<string, string> = {
  none: '',
  hearts: '❤️',
  flowers: '🌸',
  stars: '⭐',
  dots: '•',
};

const COLORS = [
  '#FFE66D', '#FF6B9D', '#C3F584', '#67E8F9', '#FFA07A',
  '#DDA0DD', '#98FB98', '#F0E68C', '#FFB6C1', '#87CEEB',
];

const FONTS = [
  'Georgia', 'Comic Sans MS', 'Courier New', 'Arial',
  'Palatino', 'Trebuchet MS', 'Times New Roman',
];

interface Props {
  postIt: PostItItem;
  pageId: string;
  isEditing: boolean;
  onStartEdit: () => void;
}

export default function PostItNote({ postIt, pageId, isEditing, onStartEdit }: Props) {
  const { updatePostIt, removePostIt } = useStore();
  const [showOptions, setShowOptions] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const pattern = PATTERNS[postIt.pattern] || '';
  const patternBg = pattern
    ? `radial-gradient(circle, transparent 60%, ${postIt.color}88 60%)`
    : undefined;

  function handleDragStart(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: postIt.x, py: postIt.y };

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      updatePostIt(pageId, postIt.id, {
        x: dragStart.current.px + dx,
        y: dragStart.current.py + dy,
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
      initial={{ scale: 0, rotate: postIt.rotation }}
      animate={{ scale: 1, rotate: postIt.rotation }}
      whileHover={{ scale: 1.03, zIndex: 50 }}
      style={{
        position: 'absolute',
        left: postIt.x,
        top: postIt.y,
        width: postIt.width,
        minHeight: postIt.height,
        background: postIt.color,
        borderRadius: '4px 4px 4px 4px',
        boxShadow: dragging
          ? '4px 8px 20px rgba(0,0,0,0.3)'
          : '2px 4px 10px rgba(0,0,0,0.2)',
        cursor: dragging ? 'grabbing' : 'grab',
        zIndex: dragging ? 100 : 10,
        userSelect: 'none',
        overflow: 'visible',
      }}
      onMouseDown={handleDragStart}
      onDoubleClick={e => { e.stopPropagation(); removePostIt(pageId, postIt.id); }}
    >
      {/* Fold corner */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0, width: 0, height: 0,
        borderStyle: 'solid',
        borderWidth: '0 0 16px 16px',
        borderColor: `transparent transparent rgba(0,0,0,0.15) transparent`,
        borderRadius: '0 0 4px 0',
      }} />

      {/* Pattern overlay */}
      {pattern && (
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          alignContent: 'start', gap: '4px', padding: '4px',
          fontSize: '10px',
        }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i}>{pattern}</span>
          ))}
        </div>
      )}

      {/* Text */}
      <div
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={e => updatePostIt(pageId, postIt.id, { text: e.currentTarget.textContent || '' })}
        style={{
          padding: '12px 10px 20px',
          fontFamily: postIt.font,
          fontSize: postIt.fontSize,
          color: postIt.textColor,
          minHeight: postIt.height,
          outline: 'none',
          lineHeight: 1.5,
          position: 'relative', zIndex: 1,
          cursor: isEditing ? 'text' : 'grab',
        }}
      >
        {postIt.text || (isEditing ? '' : <span style={{ opacity: 0.4 }}>Buraya yaz...</span>)}
      </div>

      {/* Options button */}
      <button
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setShowOptions(!showOptions); }}
        style={{
          position: 'absolute', top: 4, right: 4,
          background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '50%',
          width: 18, height: 18, cursor: 'pointer', fontSize: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(0,0,0,0.5)',
        }}
      >⋮</button>

      {showOptions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 24, right: 0, zIndex: 200,
            background: 'white', borderRadius: 12, padding: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            minWidth: 200,
          }}
        >
          {/* Colors */}
          <div className="text-xs font-bold text-gray-500 mb-1">Renk</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {COLORS.map(c => (
              <button key={c} onClick={() => updatePostIt(pageId, postIt.id, { color: c })}
                style={{
                  width: 18, height: 18, borderRadius: '50%', background: c,
                  border: postIt.color === c ? '2px solid #333' : '1px solid #ddd',
                  cursor: 'pointer',
                }} />
            ))}
          </div>

          {/* Patterns */}
          <div className="text-xs font-bold text-gray-500 mb-1">Desen</div>
          <div className="flex gap-1 mb-2 flex-wrap">
            {Object.entries(PATTERNS).map(([key, icon]) => (
              <button key={key}
                onClick={() => updatePostIt(pageId, postIt.id, { pattern: key as PostItItem['pattern'] })}
                style={{
                  padding: '2px 6px', borderRadius: 6, fontSize: 12,
                  background: postIt.pattern === key ? '#667eea' : '#f0f0f0',
                  color: postIt.pattern === key ? 'white' : '#333',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {icon || 'Yok'}
              </button>
            ))}
          </div>

          {/* Font */}
          <div className="text-xs font-bold text-gray-500 mb-1">Yazı Tipi</div>
          <select
            value={postIt.font}
            onChange={e => updatePostIt(pageId, postIt.id, { font: e.target.value })}
            className="text-xs border rounded px-1 py-0.5 mb-2 w-full"
          >
            {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>

          {/* Text color */}
          <div className="text-xs font-bold text-gray-500 mb-1">Yazı Rengi</div>
          <div className="flex gap-1 mb-2">
            {['#1a1a1a', '#3d2b1f', '#7c3aed', '#dc2626', '#059669'].map(c => (
              <button key={c} onClick={() => updatePostIt(pageId, postIt.id, { textColor: c })}
                style={{
                  width: 18, height: 18, borderRadius: '50%', background: c,
                  border: postIt.textColor === c ? '2px solid #333' : '1px solid #ddd',
                  cursor: 'pointer',
                }} />
            ))}
          </div>

          <button
            onClick={() => removePostIt(pageId, postIt.id)}
            className="w-full py-1 rounded-lg text-xs text-red-500 hover:bg-red-50"
          >
            🗑️ Sil
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
