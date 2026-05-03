export interface PostItItem {
  id: string;
  x: number; y: number;
  width: number; height: number;
  color: string;
  pattern: 'none' | 'hearts' | 'flowers' | 'stars' | 'dots';
  text: string;
  font: string;
  textColor: string;
  fontSize: number;
  rotation: number;
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'audio';
  url: string;
  x: number; y: number;
  width: number; height: number;
  nftAssetCode?: string;
  nftIssuer?: string;
  nftTxHash?: string;
  name?: string;
  filter?: string;
  addedAt?: string;
}

export type StickerAnimation = 'none' | 'spin' | 'pulse' | 'bounce' | 'float' | 'drive' | 'shake';

export interface StickerItem {
  id: string;
  emoji: string;
  x: number; y: number;
  size: number;
  rotation: number;
  animation: StickerAnimation;
}

export type PageEffect = 'snow' | 'hearts' | 'daisy' | 'cars' | 'football' | 'stars' | 'bubbles';

export interface DiaryPage {
  id: string;
  pageNumber: number;
  backgroundColor: string;
  backgroundPattern: 'none' | 'lined' | 'dots' | 'grid' | 'crosshatch';
  textContent: string;
  textFont: string;
  textColor: string;
  postIts: PostItItem[];
  media: MediaItem[];
  stickers: StickerItem[];
  effects: PageEffect[];
  locked?: boolean;
  date?: string;
  pinHash?: string;
}

export interface DiarySettings {
  coverColor: string;
  coverGradient: string;
  coverIcon: string;
  coverTextColor: string;
}

export interface Diary {
  id: string;
  title: string;
  ownerAddress?: string;
  pages: DiaryPage[];
  settings: DiarySettings;
  createdAt: string;
  updatedAt: string;
}

export type EditMode = 'none' | 'postit' | 'sticker';

export interface StellarNFT {
  assetCode: string;
  issuer: string;
  txHash: string;
  mediaUrl: string;
  mediaType: 'photo' | 'audio';
}
