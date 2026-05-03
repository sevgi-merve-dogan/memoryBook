export const PHOTO_FILTERS = [
  { id: 'none',     label: 'Orijinal',    css: undefined },
  { id: 'sepia',    label: 'Vintage',     css: 'sepia(0.75)' },
  { id: 'bw',       label: 'Siyah-Beyaz', css: 'grayscale(1)' },
  { id: 'vibrant',  label: 'Canlı',       css: 'saturate(1.7) contrast(1.05)' },
  { id: 'warm',     label: 'Sıcak',       css: 'sepia(0.35) saturate(1.4) brightness(1.05)' },
  { id: 'cool',     label: 'Soğuk',       css: 'hue-rotate(190deg) saturate(0.85)' },
  { id: 'dramatic', label: 'Dramatik',    css: 'contrast(1.3) brightness(0.85)' },
  { id: 'faded',    label: 'Soluk',       css: 'saturate(0.5) brightness(1.1)' },
];
