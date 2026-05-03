# Ani Defteri — Digital Memory Book

A web-based interactive diary application built with Next.js. Pages flip like a real book, memories are richly decorated, and select premium features are powered by the Stellar blockchain.

---

## Features

### Core Experience
- **Book-flip interface** — pages turn with a realistic 3D flip animation powered by `react-pageflip`
- **Rich text editor** — write directly on each page with custom font, color, and size options
- **Auto-extending pages** — the diary grows automatically as you fill pages; new locked pages are added when you approach the end

### Media & Decoration
- **Photo, video, and audio uploads** — drag, drop, or paste media onto any page (up to 2 items per page)
- **Draggable media blocks** — reposition any photo, video, or audio clip freely on the page
- **Post-it notes** — add sticky notes in five pastel colors with free-text editing
- **Emoji stickers** — place any emoji as a resizable, rotatable sticker anywhere on the page
- **Background patterns** — choose from lined, dotted, grid, crosshatch, or plain backgrounds per page
- **Page effects** — decorative visual effects layer applied per page

### Automatic Date Stamps
Photos and media record the date they were added. The first item's date appears in the top-left corner of the page; the second item's date appears in the bottom-left — no manual input needed.

### Premium Features (Stellar / XLM)
Three features require a small on-chain payment using the Stellar testnet:

| Feature | Cost | Free Quota |
|---|---|---|
| Photo Filter | 1 XLM | 1 free filter per day |
| Page PIN Lock | 1 XLM | — |
| Unlock Locked Page | 1 XLM | 1 free unlock per week |

- **Photo filters** — 8 CSS filter presets: Vintage (sepia), Black & White, Vivid, Warm, Cool, Dramatic, Faded, and Original
- **Page PIN lock** — set a personal PIN on any page; content is blurred until the correct PIN is entered; PIN is hashed client-side for privacy
- **NFT minting** — mint any photo or audio file as an NFT on the Stellar testnet and view it on Stellar Expert

### Wallet Integration
- Connects to the **Freighter** browser extension wallet
- Displays XLM balance in real time
- One-click testnet faucet funding for testing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Framer Motion, Tailwind CSS 4 |
| Book flip | react-pageflip |
| Rich text | Tiptap (color, font-family, text-style) |
| Blockchain | Stellar SDK v15, Freighter API v6 |
| State | React Context (custom store) |
| Language | TypeScript 5 |

---

## Getting Started

### Prerequisites
- Node.js 18+
- [Freighter wallet](https://www.freighter.app/) browser extension (for blockchain features)

### Installation

```bash
git clone <repository-url>
cd ani-defteri
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
ani-defteri/
├── app/
│   ├── page.tsx            # Root page — composes all panels and modals
│   ├── layout.tsx          # HTML shell, font imports
│   └── globals.css         # Base styles
├── components/
│   ├── BookViewer.tsx       # HTMLFlipBook wrapper, auto-extend logic
│   ├── DiaryPageContent.tsx # Per-page canvas: text, media, stickers, PIN overlay
│   ├── MediaBlock.tsx       # Draggable photo / video / audio block
│   ├── PostItNote.tsx       # Sticky note component
│   ├── EmojiSticker.tsx     # Emoji sticker component
│   ├── EffectsLayer.tsx     # Decorative effects overlay
│   ├── LeftPanel.tsx        # Sidebar: media upload, filter, PIN controls
│   ├── Toolbar.tsx          # Top bar: font, color, background, effects
│   ├── Header.tsx           # App header with wallet connect
│   ├── FilterModal.tsx      # Photo filter picker + payment flow
│   ├── PinModal.tsx         # Page PIN setup + payment flow
│   ├── PageModal.tsx        # Locked page unlock + payment flow
│   ├── DateModal.tsx        # Date stamp payment flow
│   ├── MediaModal.tsx       # Media add quota / payment flow
│   └── DeleteModal.tsx      # Confirm delete dialog
├── lib/
│   ├── store.ts             # Global state, localStorage quotas, actions
│   ├── types.ts             # TypeScript interfaces (DiaryPage, MediaItem, …)
│   ├── stellar.ts           # Freighter connect, sign & submit, NFT mint
│   └── filters.ts           # Shared CSS filter definitions
└── public/                  # Static assets
```

---

## Key Design Decisions

**Keyboard capture fix** — `react-pageflip` registers keyboard listeners at the `document` level, which steals focus from the textarea on every keystroke. The textarea attaches its own native capture-phase event listeners (`addEventListener('keydown', stop, true)`) to intercept events before they reach the document, so typing works without clicking the page between characters.

**Auto-extending pages** — rather than pre-creating a fixed page count, `BookViewer` watches the current page index. When the reader is within 3 pages of the end, 8 new locked pages are appended and the flip book remounts while restoring the previous position.

**Quota tracking** — daily filter quota and weekly unlock quota are persisted in `localStorage` using date/ISO-week strings as keys. No server required.

**PIN hashing** — PINs are hashed with `btoa(encodeURIComponent(pin + ':ani-defteri'))` before storing. This is a client-side privacy measure, not cryptographic security.

---

## Blockchain Details

All transactions run on the **Stellar Testnet**. No real funds are used. A treasury address receives payments and payments are verified on-chain before features are unlocked.

To test paid features:
1. Install the [Freighter](https://www.freighter.app/) extension and create a testnet wallet
2. Click **"Get Free Testnet XLM"** inside any payment modal to fund your account via Friendbot
3. Approve the 1 XLM transaction in Freighter

---

## Transaction Hash

Test transaction submitted on the Stellar Testnet as proof of blockchain integration.

| | |
|---|---|
| **Network** | Stellar Testnet |
| **Transaction Hash** | `4cd62f96a8ac4419a2e48cff4bb26e1dfa5e10acbd58af926b854b57d3f12c60` |
| **Explorer** | [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/4cd62f96a8ac4419a2e48cff4bb26e1dfa5e10acbd58af926b854b57d3f12c60) |

---

## Screenshots

![Ekran Görüntüsü 1](photo/Ekran%20görüntüsü%202026-05-03%20180946.png)

![Ekran Görüntüsü 2](photo/Ekran%20görüntüsü%202026-05-03%20181001.png)

---

## License

Private project. All rights reserved.
