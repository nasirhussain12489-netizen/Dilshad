import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Brush,
  Check,
  Circle,
  Copy,
  Crop,
  Download,
  Droplet,
  Eraser,
  Eye,
  EyeOff,
  FlipHorizontal,
  FlipVertical,
  Grid,
  Hand,
  History,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Lock,
  Maximize2,
  Move,
  PaintBucket,
  Palette,
  Pipette,
  Plus,
  Redo2,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Share2,
  Sliders,
  Sparkles,
  Square,
  Stamp,
  Sun,
  Trash2,
  Type,
  Undo2,
  Unlock,
  Upload,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PosterRecord, ParticipantRecord } from '../types.ts';

export type PhotoshopToolId =
  | 'MOVE'
  | 'MARQUEE'
  | 'CROP'
  | 'EYEDROPPER'
  | 'BRUSH'
  | 'CLONE_HEAL'
  | 'ERASER'
  | 'GRADIENT_BUCKET'
  | 'BLUR_SHARPEN'
  | 'DODGE_BURN'
  | 'TEXT'
  | 'SHAPE'
  | 'IMAGE_LAYER'
  | 'STAMP'
  | 'HAND'
  | 'ZOOM';

export type BlendModeType =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'luminosity';

export interface StudioParticipantCard {
  id: number;
  fullName: string;
  photoUrl: string;
  classCode: string;
  categoryName: string;
  ownTopic?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  photoScale: number;
  photoOffsetX: number;
  photoOffsetY: number;
  flipX: boolean;
  flipY: boolean;
  visible: boolean;
  locked: boolean;
  borderColor?: string;
  nameBgColor?: string;
}

export interface CustomOverlayLayer {
  id: string;
  type: 'TEXT' | 'BADGE';
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  bgColor: string;
  showBgPill: boolean;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  rotation: number;
  opacity: number;
  blendMode: BlendModeType;
  visible: boolean;
  locked: boolean;
}

export interface StudioShapeLayer {
  id: string;
  shapeType:
    | 'ROUNDED_RECT'
    | 'RECTANGLE'
    | 'CIRCLE'
    | 'ARCH'
    | 'LINE'
    | 'STAR'
    | 'GOLD_RIBBON';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  rotation: number;
  blendMode: BlendModeType;
  visible: boolean;
  locked: boolean;
}

export interface StudioImageLayer {
  id: string;
  name: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  cornerRadius: number;
  borderWidth: number;
  borderColor: string;
  flipX: boolean;
  flipY: boolean;
  blendMode: BlendModeType;
  visible: boolean;
  locked: boolean;
}

export interface BrushStroke {
  points: Array<{ x: number; y: number }>;
  color: string;
  size: number;
  opacity: number;
  brushStyle:
    | 'SOFT_ROUND'
    | 'HARD_ROUND'
    | 'CALLIGRAPHY'
    | 'GOLD_SHIMMER'
    | 'NEON_GLOW'
    | 'SPRAY'
    | 'HEAL_PATCH'
    | 'DODGE_LIGHT'
    | 'BURN_SHADOW'
    | 'BLUR_GLOW';
}

export interface StudioStateSnapshot {
  historyLabel: string;
  canvasWidth: number;
  canvasHeight: number;
  title: string;
  subtitle: string;
  motto: string;
  programDetails: string;
  bgTheme:
    | 'BOTANICAL_BLUSH'
    | 'UPLOADED_POSTER'
    | 'OBSIDIAN_GOLD'
    | 'ROYAL_NAVY'
    | 'IMPERIAL_EMERALD'
    | 'VELVET_CRIMSON'
    | 'CYBER_NEON_AZURE'
    | 'ROYAL_AMETHYST'
    | 'DESERT_SANDSTONE'
    | 'ARCTIC_FROST_SLATE'
    | 'SUNSET_AMBER_CORAL'
    | 'MIDNIGHT_TITANIUM'
    | 'AI_ISLAMIC_ILLUMINATION'
    | 'AI_EMERALD_MIHRAB'
    | 'AI_ROYAL_SAPPHIRE'
    | 'AI_VINTAGE_BOTANICAL'
    | 'AI_BAROQUE_CRIMSON'
    | 'TURQUOISE_PERSIAN'
    | 'MAJESTIC_MARBLE_GOLD'
    | 'CELESTIAL_COSMIC_GOLD'
    | 'SAHARA_GOLDEN_OASIS'
    | 'CHAMPAGNE_LUXE';
  customBgUrl: string | null;
  customBgOpacity: number;
  showCompartmentBoxes: boolean;
  showHeaderLockup: boolean;
  frameShape: 'ROUNDED' | 'CIRCLE' | 'ARCH' | 'SQUARE';
  borderThickness: number;
  goldGlow: number;
  vignette: number;
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  hueRotate: number;
  blurPx: number;
  exposure: number;
  noiseGrain: number;
  titleFont: string;
  titleSize: number;
  titleColor: string;
  cards: StudioParticipantCard[];
  imageLayers: StudioImageLayer[];
  shapes: StudioShapeLayer[];
  overlays: CustomOverlayLayer[];
  strokes: BrushStroke[];
}

interface PosterPhotoshopStudioProps {
  poster: PosterRecord;
  liveParticipants?: ParticipantRecord[];
  onClose: () => void;
  onSavePoster: (
    posterId: number,
    updatedDataUrl: string,
    title: string,
    subtitle: string,
    participantsSnapshot: string
  ) => Promise<void>;
  onPostToFeed: (
    poster: PosterRecord,
    renderedDataUrl: string,
    caption: string
  ) => Promise<void>;
}

const CATEGORY_ORDER = [
  'Qirat',
  'Naat',
  'Speech',
  'Table Topic',
  'Evolution',
  'Aah Counter',
  'Marshal',
  'Grammarian',
];

function normalizeCat(cat: string): string {
  const c = (cat || '').trim().toLowerCase();
  if (c === 'qirath' || c === 'qirat') return 'Qirat';
  if (c === 'singer' || c === 'singers' || c === 'naat') return 'Naat';
  if (c === 'speaker' || c === 'speakers' || c === 'speech') return 'Speech';
  if (
    c === 'evaluator' ||
    c === 'evaluators' ||
    c === 'evolution' ||
    c === 'evaluation'
  )
    return 'Evolution';
  if (c === 'ah counter' || c === 'aah counter' || c === 'ah-counter')
    return 'Aah Counter';
  if (c === 'table topic' || c === 'table topics') return 'Table Topic';
  if (c === 'marshal' || c === 'marshall') return 'Marshal';
  if (c === 'grammarian') return 'Grammarian';
  return cat;
}

// Compute Official 8-Compartment Positions on 1600x1130 Canvas (matching reference poster design)
function computeCompartmentCards(
  rawParticipants: Array<{
    id: number;
    fullName: string;
    photoUrl: string;
    classCode: string;
    categoryName: string;
    ownTopic?: string | null;
  }>
): StudioParticipantCard[] {
  const result: StudioParticipantCard[] = [];
  const byCat = (target: string) =>
    rawParticipants.filter((p) => normalizeCat(p.categoryName) === target);

  // 1. Marshal (Top-left compartment)
  const marshals = byCat('Marshal');
  marshals.slice(0, 1).forEach((p) => {
    result.push({
      id: p.id,
      fullName: p.fullName,
      photoUrl: p.photoUrl,
      classCode: p.classCode,
      categoryName: 'Marshal',
      ownTopic: p.ownTopic || undefined,
      x: 112,
      y: 282,
      width: 245,
      height: 280,
      rotation: 0,
      opacity: 1,
      photoScale: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
      flipX: false,
      flipY: false,
      visible: true,
      locked: false,
    });
  });

  // 2. Qirat (Top-center compartment)
  const qirats = byCat('Qirat');
  qirats.slice(0, 1).forEach((p) => {
    result.push({
      id: p.id,
      fullName: p.fullName,
      photoUrl: p.photoUrl,
      classCode: p.classCode,
      categoryName: 'Qirat',
      ownTopic: p.ownTopic || undefined,
      x: 560,
      y: 282,
      width: 245,
      height: 280,
      rotation: 0,
      opacity: 1,
      photoScale: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
      flipX: false,
      flipY: false,
      visible: true,
      locked: false,
    });
  });

  // 3. Grammarian, Aah Counter, Table Topic (Top-right compartment)
  const grammarians = byCat('Grammarian').slice(0, 1);
  const aahCounters = byCat('Aah Counter').slice(0, 1);
  const tableTopics = byCat('Table Topic').slice(0, 5);

  grammarians.forEach((p) => {
    result.push({
      id: p.id,
      fullName: p.fullName,
      photoUrl: p.photoUrl,
      classCode: p.classCode,
      categoryName: 'Grammarian',
      ownTopic: p.ownTopic || undefined,
      x: 1020,
      y: 266,
      width: 145,
      height: 158,
      rotation: 0,
      opacity: 1,
      photoScale: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
      flipX: false,
      flipY: false,
      visible: true,
      locked: false,
    });
  });

  aahCounters.forEach((p) => {
    result.push({
      id: p.id,
      fullName: p.fullName,
      photoUrl: p.photoUrl,
      classCode: p.classCode,
      categoryName: 'Aah Counter',
      ownTopic: p.ownTopic || undefined,
      x: 1185,
      y: 266,
      width: 145,
      height: 158,
      rotation: 0,
      opacity: 1,
      photoScale: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
      flipX: false,
      flipY: false,
      visible: true,
      locked: false,
    });
  });

  tableTopics.forEach((p, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    result.push({
      id: p.id,
      fullName: p.fullName,
      photoUrl: p.photoUrl,
      classCode: p.classCode,
      categoryName: 'Table Topic',
      ownTopic: p.ownTopic || undefined,
      x: 1015 + col * 158,
      y: 432 + row * 82,
      width: 145,
      height: 78,
      rotation: 0,
      opacity: 1,
      photoScale: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
      flipX: false,
      flipY: false,
      visible: true,
      locked: false,
    });
  });

  // Helper for Bottom 3 Compartments (Speakers, Singers/Naat, Evaluators - up to 5 each)
  const placeBottomFive = (
    items: typeof rawParticipants,
    catLabel: string,
    compX: number,
    compY: number,
    compW: number
  ) => {
    const positions = [
      { x: compX + 26, y: compY + 62, w: 185, h: 132 },
      { x: compX + compW - 211, y: compY + 62, w: 185, h: 132 },
      { x: compX + 26, y: compY + 206, w: 185, h: 132 },
      { x: compX + compW - 211, y: compY + 206, w: 185, h: 132 },
      { x: compX + Math.round((compW - 200) / 2), y: compY + 348, w: 200, h: 126 },
    ];
    items.slice(0, 5).forEach((p, i) => {
      const pos = positions[i] || positions[0];
      result.push({
        id: p.id,
        fullName: p.fullName,
        photoUrl: p.photoUrl,
        classCode: p.classCode,
        categoryName: catLabel,
        ownTopic: p.ownTopic || undefined,
        x: pos.x,
        y: pos.y,
        width: pos.w,
        height: pos.h,
        rotation: 0,
        opacity: 1,
        photoScale: 1,
        photoOffsetX: 0,
        photoOffsetY: 0,
        flipX: false,
        flipY: false,
        visible: true,
        locked: false,
      });
    });
  };

  placeBottomFive(byCat('Speech'), 'Speech', 60, 600, 440);
  placeBottomFive(byCat('Naat'), 'Naat', 540, 600, 480);
  placeBottomFive(byCat('Evolution'), 'Evolution', 1060, 600, 480);

  return result;
}

// Compute Uniform Grid Layout across Canvas
function computeGridCards(
  rawParticipants: Array<{
    id: number;
    fullName: string;
    photoUrl: string;
    classCode: string;
    categoryName: string;
    ownTopic?: string | null;
  }>,
  forcedCols?: number,
  canvasWidth = 1600
): StudioParticipantCard[] {
  const sorted = [...rawParticipants].sort((a, b) => {
    const idxA = CATEGORY_ORDER.indexOf(normalizeCat(a.categoryName));
    const idxB = CATEGORY_ORDER.indexOf(normalizeCat(b.categoryName));
    const orderA = idxA === -1 ? 99 : idxA;
    const orderB = idxB === -1 ? 99 : idxB;
    if (orderA !== orderB) return orderA - orderB;
    return a.id - b.id;
  });

  const count = sorted.length;
  const cols =
    forcedCols ||
    (count <= 2
      ? 2
      : count <= 6
      ? 3
      : count <= 12
      ? 4
      : count <= 18
      ? 5
      : 6);

  const gapX = 24;
  const gapY = 20;
  const usableW = canvasWidth - 140;
  const cardWidth = Math.min(260, Math.floor((usableW - (cols - 1) * gapX) / cols));
  const cardHeight = Math.round(cardWidth * 0.92);
  const rows = Math.ceil(Math.max(count, 1) / cols);
  const startY = 265;

  return sorted.map((p, idx) => {
    const row = Math.floor(idx / cols);
    const itemsInRow =
      row === rows - 1 && count % cols !== 0 ? count % cols : cols;
    const col = idx % cols;
    const totalRowW = itemsInRow * cardWidth + (itemsInRow - 1) * gapX;
    const startX = (canvasWidth - totalRowW) / 2;
    return {
      id: p.id,
      fullName: p.fullName,
      photoUrl: p.photoUrl,
      classCode: p.classCode,
      categoryName: normalizeCat(p.categoryName),
      ownTopic: p.ownTopic || undefined,
      x: Math.round(startX + col * (cardWidth + gapX)),
      y: Math.round(startY + row * (cardHeight + gapY)),
      width: cardWidth,
      height: cardHeight,
      rotation: 0,
      opacity: 1,
      photoScale: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
      flipX: false,
      flipY: false,
      visible: true,
      locked: false,
    };
  });
}

export const PosterPhotoshopStudio: React.FC<PosterPhotoshopStudioProps> = ({
  poster,
  liveParticipants,
  onClose,
  onSavePoster,
  onPostToFeed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const [activeTool, setActiveTool] = useState<PhotoshopToolId>('MOVE');
  const [rightTab, setRightTab] = useState<
    'LAYERS' | 'ADJUSTMENTS' | 'LAYOUT' | 'HISTORY'
  >('LAYERS');
  const [zoom, setZoom] = useState(0.56);
  const [showGrid, setShowGrid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [postingFeed, setPostingFeed] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [feedCaption, setFeedCaption] = useState(
    `Official Class ${poster.classCode} Competition Poster — Marshal, Qirath, Grammarian, Ah Counter, Table Topic, Speakers, Singers (Naat) & Evaluators.`
  );
  const [showFeedPrompt, setShowFeedPrompt] = useState(false);
  const [studioNotice, setStudioNotice] = useState<string | null>(null);

  // Foreground / Brush / Shape settings
  const [fgColor, setFgColor] = useState('#C88A65');
  const [bgColorSwatch, setBgColorSwatch] = useState('#FFF5F5');
  const [brushSize, setBrushSize] = useState(10);
  const [brushOpacity, setBrushOpacity] = useState(0.9);
  const [brushStyle, setBrushStyle] =
    useState<BrushStroke['brushStyle']>('SOFT_ROUND');
  const [shapePreset, setShapePreset] =
    useState<StudioShapeLayer['shapeType']>('ROUNDED_RECT');
  const [stampPreset, setStampPreset] = useState<string>(
    '🌸 BOTANICAL ROSE SEAL 🌸'
  );

  // Marquee Selection rectangle
  const [marqueeRect, setMarqueeRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Selected Layer IDs
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(
    null
  );
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedImageLayerId, setSelectedImageLayerId] = useState<
    string | null
  >(null);

  // Pointer interaction ref
  const dragRef = useRef<{
    type:
      | 'CARD'
      | 'OVERLAY'
      | 'SHAPE'
      | 'IMAGE_LAYER'
      | 'BRUSH'
      | 'MARQUEE'
      | 'PAN';
    id?: number | string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Resolve initial participants (liveParticipants if provided, else poster.participantsSnapshot)
  const initialParticipants = (() => {
    if (liveParticipants && liveParticipants.length > 0) {
      const classFiltered = liveParticipants.filter(
        (p) => p.classCode === poster.classCode
      );
      if (classFiltered.length > 0) return classFiltered;
    }
    try {
      return JSON.parse(poster.participantsSnapshot || '[]');
    } catch {
      return [];
    }
  })();

  const hasInitialCustomImage = Boolean(
    poster.posterImageUrl &&
      !poster.posterImageUrl.startsWith('data:image/svg+xml')
  );

  const [studio, setStudio] = useState<StudioStateSnapshot>(() => ({
    historyLabel: 'Initial Poster Loaded',
    canvasWidth: 1600,
    canvasHeight: 1130,
    title: 'INTEGRATED LEARNING MASTER (ILM)',
    subtitle: `CLASS ${poster.classCode} OFFICIAL COMPETITION LINEUP`,
    motto: 'Together We Build Better Learners · Learn · Compete · Grow',
    programDetails: `DATE: ${new Date().toLocaleDateString('en-GB')}   |   PROGRAM NO: 07   |   VENUE: CLASS ${
      poster.classCode
    }`,
    bgTheme: hasInitialCustomImage ? 'UPLOADED_POSTER' : 'BOTANICAL_BLUSH',
    customBgUrl: hasInitialCustomImage ? poster.posterImageUrl : null,
    customBgOpacity: 100,
    showCompartmentBoxes: !hasInitialCustomImage,
    showHeaderLockup: !hasInitialCustomImage,
    frameShape: 'ROUNDED',
    borderThickness: 2.5,
    goldGlow: 35,
    vignette: 12,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    hueRotate: 0,
    blurPx: 0,
    exposure: 100,
    noiseGrain: 0,
    titleFont: 'Cinzel',
    titleSize: 38,
    titleColor: '#7A4938',
    cards: computeCompartmentCards(initialParticipants),
    imageLayers: [],
    shapes: [],
    overlays: [],
    strokes: [],
  }));

  const [history, setHistory] = useState<StudioStateSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<StudioStateSnapshot[]>([]);

  const pushHistory = useCallback(
    (nextState: StudioStateSnapshot, label = 'Edited Poster') => {
      setStudio((prev) => {
        setHistory((h) => [...h.slice(-29), prev]);
        setRedoStack([]);
        return { ...nextState, historyLabel: label };
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [studio, ...r]);
    setHistory((h) => h.slice(0, -1));
    setStudio(prev);
  }, [history, studio]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory((h) => [...h, studio]);
    setRedoStack((r) => r.slice(1));
    setStudio(next);
  }, [redoStack, studio]);

  // Keyboard shortcuts for Photoshop tools + Undo/Redo/Delete
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'v') setActiveTool('MOVE');
      else if (key === 'm') setActiveTool('MARQUEE');
      else if (key === 'c') setActiveTool('CROP');
      else if (key === 'i') setActiveTool('EYEDROPPER');
      else if (key === 'b') setActiveTool('BRUSH');
      else if (key === 'j' || key === 's') setActiveTool('CLONE_HEAL');
      else if (key === 'e') setActiveTool('ERASER');
      else if (key === 'g') setActiveTool('GRADIENT_BUCKET');
      else if (key === 'r') setActiveTool('BLUR_SHARPEN');
      else if (key === 'o') setActiveTool('DODGE_BURN');
      else if (key === 't') setActiveTool('TEXT');
      else if (key === 'u') setActiveTool('SHAPE');
      else if (key === 'p') setActiveTool('IMAGE_LAYER');
      else if (key === 'a') setActiveTool('STAMP');
      else if (key === 'h') setActiveTool('HAND');
      else if (key === 'z') setActiveTool('ZOOM');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // Preload images into cache and trigger redraw
  const [imagesTick, setImagesTick] = useState(0);
  const ensureImageLoaded = useCallback((url: string) => {
    if (!url) return null;
    const cached = imageCacheRef.current.get(url);
    if (cached && cached.complete && cached.naturalWidth > 0) return cached;
    if (!cached) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setImagesTick((t) => t + 1);
      img.onerror = () => {
        // Retry without crossOrigin if external host blocks CORS preflight
        const fallbackImg = new Image();
        fallbackImg.onload = () => setImagesTick((t) => t + 1);
        fallbackImg.src = url;
        imageCacheRef.current.set(url, fallbackImg);
      };
      img.src = url;
      imageCacheRef.current.set(url, img);
    }
    return null;
  }, []);

  // Upload any local file to ImgBB via our backend and return the hosted URL (with dataURL fallback)
  const uploadFileToImgBB = async (file: File): Promise<string> => {
    setUploadingAsset(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      try {
        const sessionToken = sessionStorage.getItem('ilm_admin_session_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`;
        }
        const res = await fetch('/api/public/upload-poster', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            fileName: file.name,
            base64Data: dataUrl,
          }),
        });
        const json = await res.json();
        if (res.ok && json.fileUrl) {
          return String(json.fileUrl);
        }
      } catch {
        // Fallback to dataUrl
      }
      return dataUrl;
    } finally {
      setUploadingAsset(false);
    }
  };

  // =========================================================================
  // MAIN PHOTOSHOP CANVAS RENDER ENGINE
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { canvasWidth: cw, canvasHeight: ch } = studio;

    ctx.save();
    ctx.clearRect(0, 0, cw, ch);

    // Global Photoshop adjustment filter chain
    const effBrightness = Math.round(
      (studio.brightness * studio.exposure) / 100
    );
    ctx.filter = `brightness(${effBrightness}%) contrast(${studio.contrast}%) saturate(${studio.saturation}%) sepia(${studio.sepia}%) hue-rotate(${studio.hueRotate}deg) blur(${studio.blurPx}px)`;

    // 1. Background Theme Rendering
    if (studio.bgTheme === 'BOTANICAL_BLUSH' || studio.bgTheme === 'UPLOADED_POSTER') {
      const blushGrad = ctx.createLinearGradient(0, 0, cw, ch);
      blushGrad.addColorStop(0, '#FFFDFB');
      blushGrad.addColorStop(0.45, '#FFF3F0');
      blushGrad.addColorStop(1, '#FCE7E2');
      ctx.fillStyle = blushGrad;
      ctx.fillRect(0, 0, cw, ch);

      // Soft Watercolor Botanical Splashes
      const splash1 = ctx.createRadialGradient(220, 200, 20, 220, 200, 480);
      splash1.addColorStop(0, 'rgba(244, 194, 184, 0.42)');
      splash1.addColorStop(1, 'rgba(244, 194, 184, 0)');
      ctx.fillStyle = splash1;
      ctx.fillRect(0, 0, cw, ch);

      const splash2 = ctx.createRadialGradient(
        cw - 240,
        ch - 200,
        20,
        cw - 240,
        ch - 200,
        520
      );
      splash2.addColorStop(0, 'rgba(235, 178, 166, 0.38)');
      splash2.addColorStop(1, 'rgba(235, 178, 166, 0)');
      ctx.fillStyle = splash2;
      ctx.fillRect(0, 0, cw, ch);

      // Botanical Corner Leaves (Top-left & Bottom-right)
      ctx.save();
      ctx.fillStyle = 'rgba(196, 139, 113, 0.26)';
      const leafPositions = [
        [70, 80, -0.4],
        [120, 55, 0.2],
        [55, 135, -0.8],
        [cw - 75, ch - 80, 2.6],
        [cw - 125, ch - 55, -2.8],
        [cw - 60, ch - 135, 2.2],
      ];
      for (const [lx, ly, rot] of leafPositions) {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, 38, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    } else if (studio.bgTheme === 'DESERT_SANDSTONE') {
      const sandGrad = ctx.createLinearGradient(0, 0, cw, ch);
      sandGrad.addColorStop(0, '#FDFBF7');
      sandGrad.addColorStop(0.4, '#F5EDE0');
      sandGrad.addColorStop(1, '#E8D8C4');
      ctx.fillStyle = sandGrad;
      ctx.fillRect(0, 0, cw, ch);

      // Warm desert dunes ambient overlay
      const dGlow = ctx.createRadialGradient(cw / 2, 0, 40, cw / 2, 0, cw * 0.7);
      dGlow.addColorStop(0, 'rgba(217, 165, 110, 0.28)');
      dGlow.addColorStop(1, 'rgba(217, 165, 110, 0)');
      ctx.fillStyle = dGlow;
      ctx.fillRect(0, 0, cw, ch);
    } else if (studio.bgTheme === 'ARCTIC_FROST_SLATE') {
      const frostGrad = ctx.createLinearGradient(0, 0, cw, ch);
      frostGrad.addColorStop(0, '#0F172A');
      frostGrad.addColorStop(0.5, '#1E293B');
      frostGrad.addColorStop(1, '#0B0F19');
      ctx.fillStyle = frostGrad;
      ctx.fillRect(0, 0, cw, ch);

      // Cool cyan auroral glow
      const aGlow = ctx.createRadialGradient(cw / 2, ch / 3, 20, cw / 2, ch / 3, cw * 0.6);
      aGlow.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      aGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = aGlow;
      ctx.fillRect(0, 0, cw, ch);
    } else if (studio.bgTheme === 'CYBER_NEON_AZURE') {
      const neonGrad = ctx.createLinearGradient(0, 0, cw, ch);
      neonGrad.addColorStop(0, '#030712');
      neonGrad.addColorStop(0.5, '#051833');
      neonGrad.addColorStop(1, '#020617');
      ctx.fillStyle = neonGrad;
      ctx.fillRect(0, 0, cw, ch);

      // Electric cyan & magenta neon halo
      const nGlow = ctx.createRadialGradient(cw / 2, 220, 20, cw / 2, 220, cw * 0.5);
      nGlow.addColorStop(0, 'rgba(6, 182, 212, 0.24)');
      nGlow.addColorStop(0.6, 'rgba(99, 102, 241, 0.14)');
      nGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nGlow;
      ctx.fillRect(0, 0, cw, ch);
    } else if (studio.bgTheme === 'ROYAL_AMETHYST') {
      const purpGrad = ctx.createLinearGradient(0, 0, cw, ch);
      purpGrad.addColorStop(0, '#10051C');
      purpGrad.addColorStop(0.5, '#220B3B');
      purpGrad.addColorStop(1, '#0B0214');
      ctx.fillStyle = purpGrad;
      ctx.fillRect(0, 0, cw, ch);

      const pGlow = ctx.createRadialGradient(cw / 2, 200, 20, cw / 2, 200, cw * 0.5);
      pGlow.addColorStop(0, 'rgba(192, 132, 252, 0.22)');
      pGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = pGlow;
      ctx.fillRect(0, 0, cw, ch);
    } else if (studio.bgTheme === 'SUNSET_AMBER_CORAL') {
      const sunGrad = ctx.createLinearGradient(0, 0, cw, ch);
      sunGrad.addColorStop(0, '#1C0A00');
      sunGrad.addColorStop(0.5, '#381604');
      sunGrad.addColorStop(1, '#120400');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, cw, ch);

      const sGlow = ctx.createRadialGradient(cw / 2, 240, 20, cw / 2, 240, cw * 0.5);
      sGlow.addColorStop(0, 'rgba(251, 146, 60, 0.24)');
      sGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sGlow;
      ctx.fillRect(0, 0, cw, ch);
    } else if (studio.bgTheme === 'MIDNIGHT_TITANIUM') {
      const titGrad = ctx.createLinearGradient(0, 0, cw, ch);
      titGrad.addColorStop(0, '#090A0F');
      titGrad.addColorStop(0.5, '#161922');
      titGrad.addColorStop(1, '#08080C');
      ctx.fillStyle = titGrad;
      ctx.fillRect(0, 0, cw, ch);

      const tGlow = ctx.createRadialGradient(cw / 2, 240, 20, cw / 2, 240, cw * 0.5);
      tGlow.addColorStop(0, 'rgba(148, 163, 184, 0.18)');
      tGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = tGlow;
      ctx.fillRect(0, 0, cw, ch);
    } else if (studio.bgTheme === 'TURQUOISE_PERSIAN') {
      const turqGrad = ctx.createLinearGradient(0, 0, cw, ch);
      turqGrad.addColorStop(0, '#042F2E');
      turqGrad.addColorStop(0.5, '#0E4E4C');
      turqGrad.addColorStop(1, '#021F1E');
      ctx.fillStyle = turqGrad;
      ctx.fillRect(0, 0, cw, ch);

      const tuGlow = ctx.createRadialGradient(cw / 2, 220, 20, cw / 2, 220, cw * 0.5);
      tuGlow.addColorStop(0, 'rgba(45, 212, 191, 0.22)');
      tuGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = tuGlow;
      ctx.fillRect(0, 0, cw, ch);
    } else if (studio.bgTheme === 'MAJESTIC_MARBLE_GOLD') {
      const mGrad = ctx.createLinearGradient(0, 0, cw, ch);
      mGrad.addColorStop(0, '#1E1E24');
      mGrad.addColorStop(0.5, '#2B2B36');
      mGrad.addColorStop(1, '#15151A');
      ctx.fillStyle = mGrad;
      ctx.fillRect(0, 0, cw, ch);

      const mGlow = ctx.createRadialGradient(cw / 2, 240, 20, cw / 2, 240, cw * 0.5);
      mGlow.addColorStop(0, 'rgba(234, 179, 8, 0.25)');
      mGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = mGlow;
      ctx.fillRect(0, 0, cw, ch);
    } else if (studio.bgTheme === 'CELESTIAL_COSMIC_GOLD') {
      const cGrad = ctx.createLinearGradient(0, 0, cw, ch);
      cGrad.addColorStop(0, '#060012');
      cGrad.addColorStop(0.5, '#190038');
      cGrad.addColorStop(1, '#030008');
      ctx.fillStyle = cGrad;
      ctx.fillRect(0, 0, cw, ch);

      const cGlow = ctx.createRadialGradient(cw / 2, 220, 20, cw / 2, 220, cw * 0.55);
      cGlow.addColorStop(0, 'rgba(245, 158, 11, 0.24)');
      cGlow.addColorStop(0.6, 'rgba(168, 85, 247, 0.16)');
      cGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cGlow;
      ctx.fillRect(0, 0, cw, ch);
    } else if (studio.bgTheme === 'SAHARA_GOLDEN_OASIS') {
      const saGrad = ctx.createLinearGradient(0, 0, cw, ch);
      saGrad.addColorStop(0, '#2D1B00');
      saGrad.addColorStop(0.5, '#452A02');
      saGrad.addColorStop(1, '#1A0F00');
      ctx.fillStyle = saGrad;
      ctx.fillRect(0, 0, cw, ch);

      const saGlow = ctx.createRadialGradient(cw / 2, 240, 20, cw / 2, 240, cw * 0.5);
      saGlow.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
      saGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = saGlow;
      ctx.fillRect(0, 0, cw, ch);
    } else if (studio.bgTheme === 'CHAMPAGNE_LUXE') {
      const chGrad = ctx.createLinearGradient(0, 0, cw, ch);
      chGrad.addColorStop(0, '#FAF7F2');
      chGrad.addColorStop(0.5, '#F3ECE1');
      chGrad.addColorStop(1, '#E9DEC9');
      ctx.fillStyle = chGrad;
      ctx.fillRect(0, 0, cw, ch);

      const chGlow = ctx.createRadialGradient(cw / 2, 240, 20, cw / 2, 240, cw * 0.5);
      chGlow.addColorStop(0, 'rgba(217, 178, 110, 0.22)');
      chGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = chGlow;
      ctx.fillRect(0, 0, cw, ch);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, cw, ch);
      if (studio.bgTheme === 'ROYAL_NAVY') {
        bgGrad.addColorStop(0, '#050B1A');
        bgGrad.addColorStop(0.5, '#0B1938');
        bgGrad.addColorStop(1, '#040812');
      } else if (studio.bgTheme === 'IMPERIAL_EMERALD') {
        bgGrad.addColorStop(0, '#04120E');
        bgGrad.addColorStop(0.5, '#09261E');
        bgGrad.addColorStop(1, '#030C09');
      } else if (studio.bgTheme === 'VELVET_CRIMSON') {
        bgGrad.addColorStop(0, '#160508');
        bgGrad.addColorStop(0.5, '#290A10');
        bgGrad.addColorStop(1, '#0D0305');
      } else {
        bgGrad.addColorStop(0, '#07080C');
        bgGrad.addColorStop(0.45, '#0E1118');
        bgGrad.addColorStop(1, '#060709');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cw, ch);
    }

    // AI-Generated High-Fidelity Poster Artwork Backdrops
    const aiThemeImages: Record<string, string> = {
      AI_ISLAMIC_ILLUMINATION: '/src/assets/images/template_islamic_gold_1791886419127.jpg',
      AI_EMERALD_MIHRAB: '/src/assets/images/template_emerald_arch_1791886441980.jpg',
      AI_ROYAL_SAPPHIRE: '/src/assets/images/template_sapphire_gold_1791886464289.jpg',
      AI_VINTAGE_BOTANICAL: '/src/assets/images/template_rose_botanical_1791886488823.jpg',
      AI_BAROQUE_CRIMSON: '/src/assets/images/template_ruby_crimson_1791886521533.jpg',
    };

    if (aiThemeImages[studio.bgTheme]) {
      const aiImg = ensureImageLoaded(aiThemeImages[studio.bgTheme]);
      if (aiImg) {
        ctx.save();
        ctx.globalAlpha = 0.88;
        ctx.drawImage(aiImg, 0, 0, cw, ch);
        // Vignette over artwork
        const artVignette = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.25, cw / 2, ch / 2, cw * 0.6);
        artVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        artVignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = artVignette;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }
    }

    // Custom Uploaded Base Poster / Background Texture
    if (studio.customBgUrl) {
      const customBg = ensureImageLoaded(studio.customBgUrl);
      if (customBg) {
        ctx.save();
        ctx.globalAlpha = Math.max(0.05, Math.min(1, studio.customBgOpacity / 100));
        ctx.drawImage(customBg, 0, 0, cw, ch);
        ctx.restore();
      }
    }

    // 2. Ambient Gold / Warm Rose Spotlight
    if (studio.goldGlow > 0) {
      const glow = ctx.createRadialGradient(
        cw / 2,
        280,
        20,
        cw / 2,
        280,
        cw * 0.45
      );
      glow.addColorStop(
        0,
        `rgba(212, 175, 55, ${(studio.goldGlow / 100) * 0.28})`
      );
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, cw, ch);
    }

    // 3. Outer Frame Border
    const isLightBotanical = studio.bgTheme === 'BOTANICAL_BLUSH' || studio.bgTheme === 'AI_VINTAGE_BOTANICAL';
    const isSandstone = studio.bgTheme === 'DESERT_SANDSTONE' || studio.bgTheme === 'CHAMPAGNE_LUXE';
    const isCyberNeon = studio.bgTheme === 'CYBER_NEON_AZURE';
    const isAmethyst = studio.bgTheme === 'ROYAL_AMETHYST' || studio.bgTheme === 'CELESTIAL_COSMIC_GOLD';
    const isArctic = studio.bgTheme === 'ARCTIC_FROST_SLATE';
    const isSunset = studio.bgTheme === 'SUNSET_AMBER_CORAL' || studio.bgTheme === 'SAHARA_GOLDEN_OASIS';
    const isEmerald = studio.bgTheme === 'IMPERIAL_EMERALD' || studio.bgTheme === 'AI_EMERALD_MIHRAB' || studio.bgTheme === 'TURQUOISE_PERSIAN';
    const isCrimson = studio.bgTheme === 'VELVET_CRIMSON' || studio.bgTheme === 'AI_BAROQUE_CRIMSON';
    const isTitanium = studio.bgTheme === 'MIDNIGHT_TITANIUM' || studio.bgTheme === 'MAJESTIC_MARBLE_GOLD';
    const isNavy = studio.bgTheme === 'ROYAL_NAVY' || studio.bgTheme === 'AI_ROYAL_SAPPHIRE';

    const frameStrokeColor = isLightBotanical
      ? '#C88A65'
      : isSandstone
      ? '#B88655'
      : isCyberNeon
      ? '#06B6D4'
      : isAmethyst
      ? '#C084FC'
      : isArctic
      ? '#38BDF8'
      : isSunset
      ? '#FB923C'
      : isEmerald
      ? '#10B981'
      : isCrimson
      ? '#F43F5E'
      : isTitanium
      ? '#94A3B8'
      : '#D4AF37';

    if (studio.borderThickness > 0) {
      ctx.strokeStyle = frameStrokeColor;
      ctx.lineWidth = studio.borderThickness;
      ctx.beginPath();
      ctx.roundRect(24, 24, cw - 48, ch - 48, 22);
      ctx.stroke();
    }

    // 4. Official Header Lockup & 8-Compartment Boxes (Toggleable so uploaded pre-made posters aren't covered unless desired)
    if (studio.showHeaderLockup) {
      ctx.save();
      ctx.textAlign = 'center';

      // Official ILM Soundwave Pebble Icon beside Title
      ctx.font = `800 ${studio.titleSize}px '${studio.titleFont}', Georgia, serif`;
      const titleMetrics = ctx.measureText(studio.title);
      const logoScale = 0.34;
      const logoX = Math.max(60, cw / 2 - titleMetrics.width / 2 - 78);
      const logoY = 30;

      ctx.save();
      ctx.translate(logoX, logoY);
      ctx.scale(logoScale, logoScale);
      const ilmGrad = ctx.createLinearGradient(15, 10, 175, 145);
      ilmGrad.addColorStop(0, '#00D4FF');
      ilmGrad.addColorStop(0.48, '#0A58FF');
      ilmGrad.addColorStop(1, '#6A11CB');

      const tailPath = new Path2D(
        'M 70 112 C 68 138, 74 158, 88 162 C 106 166, 150 126, 172 94 Z'
      );
      ctx.fillStyle = ilmGrad;
      ctx.fill(tailPath);

      const pebblePath = new Path2D(
        'M 84 10 C 140 10, 186 42, 186 78 C 186 114, 136 130, 80 130 C 32 130, 10 102, 10 66 C 10 30, 38 10, 84 10 Z'
      );
      ctx.fill(pebblePath);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      const bars = [
        [40, 64, 8, 22],
        [54, 54, 8, 38],
        [68, 44, 8, 54],
        [116, 44, 8, 54],
        [130, 54, 8, 38],
        [144, 64, 8, 22],
      ];
      for (const [bx, by, bw, bh] of bars) {
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 4);
        ctx.stroke();
      }
      const archPath = new Path2D(
        'M 84 100 L 84 48 C 84 34, 108 34, 108 48 L 108 100 M 91 100 L 91 49 C 91 41, 101 41, 101 49 L 101 100'
      );
      ctx.stroke(archPath);
      ctx.restore();

      // Top Title
      ctx.fillStyle = studio.titleColor;
      ctx.font = `800 ${studio.titleSize}px '${studio.titleFont}', Georgia, serif`;
      ctx.fillText(studio.title, cw / 2 + 24, 78);

      // Subtitle Pill
      ctx.fillStyle = isLightBotanical
        ? 'rgba(200, 138, 101, 0.14)'
        : 'rgba(23, 26, 36, 0.9)';
      ctx.strokeStyle = frameStrokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cw / 2 - 280, 94, 560, 34, 17);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLightBotanical ? '#8A4F38' : '#F3D068';
      ctx.font = "700 14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(studio.subtitle, cw / 2, 116);

      // Program Details Bar (Date, Program No, Venue)
      ctx.fillStyle = isLightBotanical ? '#6E473B' : '#D4AF37';
      ctx.font = "700 13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(studio.programDetails, cw / 2, 154);

      ctx.restore();
    }

    // 5. Official 8-Compartment Botanical Boxes (if enabled)
    if (studio.showCompartmentBoxes && cw >= 1400) {
      const boxFill = isLightBotanical
        ? 'rgba(255, 252, 250, 0.72)'
        : isSandstone
        ? 'rgba(253, 251, 247, 0.82)'
        : isCyberNeon
        ? 'rgba(5, 12, 28, 0.78)'
        : isAmethyst
        ? 'rgba(22, 10, 36, 0.78)'
        : isArctic
        ? 'rgba(15, 23, 42, 0.78)'
        : isSunset
        ? 'rgba(28, 10, 2, 0.78)'
        : isEmerald
        ? 'rgba(4, 18, 14, 0.78)'
        : isCrimson
        ? 'rgba(22, 5, 8, 0.78)'
        : isTitanium
        ? 'rgba(15, 17, 24, 0.78)'
        : isNavy
        ? 'rgba(6, 14, 32, 0.78)'
        : 'rgba(17, 20, 30, 0.72)';

      const boxStroke = isLightBotanical
        ? 'rgba(200, 138, 101, 0.55)'
        : isSandstone
        ? 'rgba(184, 134, 85, 0.55)'
        : isCyberNeon
        ? 'rgba(6, 182, 212, 0.55)'
        : isAmethyst
        ? 'rgba(192, 132, 252, 0.5)'
        : isArctic
        ? 'rgba(56, 189, 248, 0.5)'
        : isSunset
        ? 'rgba(251, 146, 60, 0.5)'
        : isEmerald
        ? 'rgba(16, 185, 129, 0.5)'
        : isCrimson
        ? 'rgba(244, 63, 94, 0.5)'
        : isTitanium
        ? 'rgba(148, 163, 184, 0.45)'
        : isNavy
        ? 'rgba(96, 165, 250, 0.5)'
        : 'rgba(212, 175, 55, 0.45)';

      const headerFill = frameStrokeColor;
      const headerTextCol = isLightBotanical || isSandstone ? '#FFFFFF' : '#05070E';

      const compartments = [
        { x: 60, y: 215, w: 350, h: 365, title: 'MARSHAL' },
        { x: 435, y: 215, w: 500, h: 365, title: 'QIRATH' },
        {
          x: 960,
          y: 215,
          w: 580,
          h: 365,
          title: 'GRAMMARIAN · AH COUNTER · TABLE TOPIC',
        },
        { x: 60, y: 598, w: 440, h: 486, title: 'SPEAKERS' },
        { x: 540, y: 598, w: 480, h: 486, title: 'SINGERS (NAAT)' },
        { x: 1060, y: 598, w: 480, h: 486, title: 'EVALUATORS' },
      ];

      for (const comp of compartments) {
        ctx.save();
        ctx.fillStyle = boxFill;
        ctx.strokeStyle = boxStroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(comp.x, comp.y, comp.w, comp.h, 20);
        ctx.fill();
        ctx.stroke();

        // Compartment Title Pill
        const pillW = Math.min(comp.w - 40, 360);
        ctx.fillStyle = headerFill;
        ctx.beginPath();
        ctx.roundRect(
          comp.x + (comp.w - pillW) / 2,
          comp.y + 12,
          pillW,
          30,
          15
        );
        ctx.fill();

        ctx.fillStyle = headerTextCol;
        ctx.font = "800 13px 'Cinzel', Georgia, serif";
        ctx.textAlign = 'center';
        ctx.fillText(comp.title, comp.x + comp.w / 2, comp.y + 32);
        ctx.restore();
      }
    }

    // 6. Custom Vector Shape Layers
    for (const sh of studio.shapes) {
      if (!sh.visible) continue;
      ctx.save();
      ctx.globalCompositeOperation = sh.blendMode;
      const cx = sh.x + sh.width / 2;
      const cy = sh.y + sh.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((sh.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);

      ctx.beginPath();
      if (sh.shapeType === 'CIRCLE') {
        ctx.ellipse(
          cx,
          cy,
          sh.width / 2,
          sh.height / 2,
          0,
          0,
          Math.PI * 2
        );
      } else if (sh.shapeType === 'ARCH') {
        const r = sh.width / 2;
        ctx.moveTo(sh.x, sh.y + sh.height);
        ctx.lineTo(sh.x, sh.y + r);
        ctx.arc(cx, sh.y + r, r, Math.PI, 0, false);
        ctx.lineTo(sh.x + sh.width, sh.y + sh.height);
        ctx.closePath();
      } else if (sh.shapeType === 'LINE') {
        ctx.moveTo(sh.x, cy);
        ctx.lineTo(sh.x + sh.width, cy);
      } else if (sh.shapeType === 'STAR') {
        const spikes = 5;
        const outerR = Math.min(sh.width, sh.height) / 2;
        const innerR = outerR * 0.45;
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / spikes - Math.PI / 2;
          const sx = cx + Math.cos(angle) * r;
          const sy = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
      } else if (sh.shapeType === 'GOLD_RIBBON') {
        ctx.roundRect(sh.x, sh.y, sh.width, sh.height, sh.height / 2);
      } else {
        ctx.roundRect(
          sh.x,
          sh.y,
          sh.width,
          sh.height,
          sh.shapeType === 'RECTANGLE' ? 0 : 18
        );
      }

      if (sh.shapeType !== 'LINE' && sh.fillOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = sh.fillOpacity;
        ctx.fillStyle = sh.fillColor;
        ctx.fill();
        ctx.restore();
      }
      if (sh.strokeWidth > 0) {
        ctx.strokeStyle = sh.strokeColor;
        ctx.lineWidth = sh.strokeWidth;
        ctx.stroke();
      }

      if (selectedShapeId === sh.id) {
        ctx.strokeStyle = '#00D4FF';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(sh.x - 4, sh.y - 4, sh.width + 8, sh.height + 8);
      }
      ctx.restore();
    }

    // 7. Floating Custom Uploaded Image Layers
    for (const imgLayer of studio.imageLayers) {
      if (!imgLayer.visible) continue;
      const loaded = ensureImageLoaded(imgLayer.imageUrl);
      ctx.save();
      ctx.globalAlpha = imgLayer.opacity;
      ctx.globalCompositeOperation = imgLayer.blendMode;
      const cx = imgLayer.x + imgLayer.width / 2;
      const cy = imgLayer.y + imgLayer.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((imgLayer.rotation * Math.PI) / 180);
      ctx.scale(imgLayer.flipX ? -1 : 1, imgLayer.flipY ? -1 : 1);
      ctx.translate(-cx, -cy);

      ctx.beginPath();
      ctx.roundRect(
        imgLayer.x,
        imgLayer.y,
        imgLayer.width,
        imgLayer.height,
        imgLayer.cornerRadius
      );
      ctx.save();
      ctx.clip();
      if (loaded) {
        ctx.drawImage(
          loaded,
          imgLayer.x,
          imgLayer.y,
          imgLayer.width,
          imgLayer.height
        );
      } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(imgLayer.x, imgLayer.y, imgLayer.width, imgLayer.height);
      }
      ctx.restore();

      if (imgLayer.borderWidth > 0) {
        ctx.strokeStyle = imgLayer.borderColor;
        ctx.lineWidth = imgLayer.borderWidth;
        ctx.stroke();
      }

      if (selectedImageLayerId === imgLayer.id) {
        ctx.strokeStyle = '#00D4FF';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(
          imgLayer.x - 4,
          imgLayer.y - 4,
          imgLayer.width + 8,
          imgLayer.height + 8
        );
      }
      ctx.restore();
    }

    // 8. Participant Photo + Name Cards (Editable, Movable, Resizable, Rotatable)
    for (const card of studio.cards) {
      if (!card.visible) continue;
      const { x, y, width: cardW, height: cardH } = card;
      const isCompact = cardH < 105;
      const namePlateH = isCompact ? 26 : 44;
      const imgH = Math.max(36, cardH - namePlateH);

      ctx.save();
      ctx.globalAlpha = card.opacity ?? 1;
      const cx = x + cardW / 2;
      const cy = y + cardH / 2;
      if (card.rotation || card.flipX || card.flipY) {
        ctx.translate(cx, cy);
        ctx.rotate(((card.rotation || 0) * Math.PI) / 180);
        ctx.scale(card.flipX ? -1 : 1, card.flipY ? -1 : 1);
        ctx.translate(-cx, -cy);
      }

      const cardBg = isLightBotanical
        ? '#FFFDFB'
        : isSandstone
        ? '#FAF7F2'
        : '#111318';
      const cardStroke =
        selectedCardId === card.id
          ? '#00D4FF'
          : card.borderColor || frameStrokeColor;

      ctx.fillStyle = cardBg;
      ctx.strokeStyle = cardStroke;
      ctx.lineWidth = selectedCardId === card.id ? 3.5 : 2;

      const cardRadius =
        studio.frameShape === 'SQUARE'
          ? 2
          : studio.frameShape === 'CIRCLE'
          ? 22
          : 14;
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, cardRadius);
      ctx.fill();
      ctx.stroke();

      // Portrait Clip Region
      ctx.save();
      ctx.beginPath();
      if (studio.frameShape === 'CIRCLE' && !isCompact) {
        const radius = Math.min(cardW - 14, imgH - 8) / 2;
        ctx.arc(x + cardW / 2, y + 6 + radius, radius, 0, Math.PI * 2);
      } else if (studio.frameShape === 'ARCH' && !isCompact) {
        const r = (cardW - 10) / 2;
        ctx.moveTo(x + 5, y + 5 + imgH);
        ctx.lineTo(x + 5, y + 5 + r);
        ctx.arc(x + cardW / 2, y + 5 + r, r, Math.PI, 0, false);
        ctx.lineTo(x + cardW - 5, y + 5 + imgH);
        ctx.closePath();
      } else {
        ctx.roundRect(
          x + 4,
          y + 4,
          cardW - 8,
          imgH - 4,
          studio.frameShape === 'SQUARE' ? 0 : 10
        );
      }
      ctx.clip();

      ctx.fillStyle = isLightBotanical
        ? '#F5E6E0'
        : isSandstone
        ? '#ECE2D4'
        : '#1A1D24';
      ctx.fillRect(x + 4, y + 4, cardW - 8, imgH - 4);

      const pImg = ensureImageLoaded(card.photoUrl);
      if (pImg) {
        const scale = card.photoScale || 1;
        const sw = (cardW - 8) * scale;
        const sh = (imgH - 4) * scale;
        const dx =
          x + 4 - (sw - (cardW - 8)) / 2 + (card.photoOffsetX || 0);
        const dy =
          y + 4 - (sh - (imgH - 4)) / 2 + (card.photoOffsetY || 0);
        ctx.drawImage(pImg, dx, dy, sw, sh);
      }
      ctx.restore();

      // Name Badge Plate at Bottom of Card
      const defaultBadgeColor = isLightBotanical
        ? '#8A4F38'
        : isSandstone
        ? '#7E5233'
        : isCyberNeon
        ? '#082F49'
        : isAmethyst
        ? '#3B0764'
        : isArctic
        ? '#0C4A6E'
        : isSunset
        ? '#7C2D12'
        : isEmerald
        ? '#064E3B'
        : isCrimson
        ? '#881337'
        : isTitanium
        ? '#1E293B'
        : isNavy
        ? '#1E3A8A'
        : '#171B26';

      ctx.fillStyle = card.nameBgColor || defaultBadgeColor;
      ctx.beginPath();
      ctx.roundRect(
        x + 4,
        y + imgH + 2,
        cardW - 8,
        namePlateH - 6,
        8
      );
      ctx.fill();

      const nameFontSize = isCompact ? 11 : cardW < 170 ? 12 : 14;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${nameFontSize}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      const cleanName =
        card.fullName.length > 20
          ? card.fullName.slice(0, 19) + '…'
          : card.fullName;
      ctx.fillText(
        cleanName,
        x + cardW / 2,
        y + imgH + (isCompact ? 16 : 19)
      );

      if (!isCompact) {
        ctx.fillStyle = frameStrokeColor;
        ctx.font = "600 10px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(
          `${card.categoryName.toUpperCase()} · ${card.classCode}`,
          x + cardW / 2,
          y + imgH + 34
        );
      }

      ctx.restore();
    }

    // 9. Custom Text & Stamp Overlay Layers
    for (const ov of studio.overlays) {
      if (!ov.visible) continue;
      ctx.save();
      ctx.globalAlpha = ov.opacity ?? 1;
      ctx.globalCompositeOperation = ov.blendMode || 'source-over';
      ctx.translate(ov.x, ov.y);
      ctx.rotate(((ov.rotation || 0) * Math.PI) / 180);

      const fontStyle = `${ov.italic ? 'italic ' : ''}${
        ov.bold !== false ? '700 ' : '500 '
      }${ov.fontSize}px '${ov.fontFamily}', sans-serif`;
      ctx.font = fontStyle;
      ctx.textAlign = 'center';

      const metrics = ctx.measureText(ov.text);
      const pillW = metrics.width + 36;
      const pillH = ov.fontSize + 20;

      if (ov.showBgPill) {
        ctx.fillStyle = ov.bgColor || 'rgba(15, 18, 28, 0.85)';
        ctx.beginPath();
        ctx.roundRect(
          -pillW / 2,
          -ov.fontSize - 4,
          pillW,
          pillH,
          pillH / 2
        );
        ctx.fill();
      }

      if (ov.strokeWidth > 0) {
        ctx.strokeStyle = ov.strokeColor || '#000000';
        ctx.lineWidth = ov.strokeWidth;
        ctx.strokeText(ov.text, 0, 0);
      }

      ctx.fillStyle = ov.color;
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 4;
      ctx.fillText(ov.text, 0, 0);

      if (selectedOverlayId === ov.id) {
        ctx.strokeStyle = '#00D4FF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(
          -pillW / 2 - 4,
          -ov.fontSize - 8,
          pillW + 8,
          pillH + 8
        );
      }
      ctx.restore();
    }

    // 10. Freehand Brush, Heal, Dodge/Burn & Blur Strokes
    for (const stroke of studio.strokes) {
      if (stroke.points.length === 0) continue;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.size;
      ctx.globalAlpha = stroke.opacity;

      if (stroke.brushStyle === 'DODGE_LIGHT') {
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = '#FFF5D6';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = stroke.size;
      } else if (stroke.brushStyle === 'BURN_SHADOW') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = '#2B1810';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = stroke.size;
      } else if (stroke.brushStyle === 'NEON_GLOW') {
        ctx.strokeStyle = stroke.color;
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = stroke.size * 1.8;
      } else if (stroke.brushStyle === 'GOLD_SHIMMER') {
        ctx.strokeStyle = '#F3D068';
        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur = stroke.size;
      } else if (stroke.brushStyle === 'BLUR_GLOW') {
        ctx.strokeStyle = stroke.color;
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = stroke.size * 2.5;
      } else {
        ctx.strokeStyle = stroke.color;
        if (stroke.brushStyle === 'SOFT_ROUND' || stroke.brushStyle === 'HEAL_PATCH') {
          ctx.shadowColor = stroke.color;
          ctx.shadowBlur = stroke.size * 0.6;
        }
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      if (stroke.points.length === 1) {
        ctx.lineTo(stroke.points[0].x + 0.5, stroke.points[0].y + 0.5);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 11. Footer Motto
    if (studio.showHeaderLockup) {
      ctx.save();
      ctx.fillStyle = isLightBotanical ? '#7A4938' : '#D4AF37';
      ctx.font = "700 15px 'Cinzel', Georgia, serif";
      ctx.textAlign = 'center';
      ctx.fillText(studio.motto, cw / 2, ch - 34);
      ctx.restore();
    }

    // 12. Edge Vignette
    if (studio.vignette > 0) {
      const vig = ctx.createRadialGradient(
        cw / 2,
        ch / 2,
        cw * 0.35,
        cw / 2,
        ch / 2,
        cw * 0.65
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(0,0,0,${(studio.vignette / 100) * 0.72})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, cw, ch);
    }

    // 13. Alignment Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.22)';
      ctx.lineWidth = 1;
      for (let gx = 100; gx < cw; gx += 100) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, ch);
        ctx.stroke();
      }
      for (let gy = 100; gy < ch; gy += 100) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(cw, gy);
        ctx.stroke();
      }
    }

    // 14. Active Rectangular Marquee Selection ("Marching Ants")
    if (marqueeRect && marqueeRect.w > 4 && marqueeRect.h > 4) {
      ctx.save();
      ctx.strokeStyle = '#00D4FF';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(
        marqueeRect.x,
        marqueeRect.y,
        marqueeRect.w,
        marqueeRect.h
      );
      ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
      ctx.fillRect(marqueeRect.x, marqueeRect.y, marqueeRect.w, marqueeRect.h);
      ctx.restore();
    }

    ctx.restore();
  }, [
    studio,
    selectedCardId,
    selectedOverlayId,
    selectedShapeId,
    selectedImageLayerId,
    showGrid,
    marqueeRect,
    imagesTick,
    ensureImageLoaded,
  ]);

  // Convert mouse event to canvas coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Sample exact pixel color from canvas (for Eyedropper & Clone/Heal tools)
  const sampleCanvasHexAt = (x: number, y: number): string => {
    const canvas = canvasRef.current;
    if (!canvas) return fgColor;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fgColor;
    try {
      const pixel = ctx.getImageData(
        Math.max(0, Math.min(canvas.width - 1, Math.round(x))),
        Math.max(0, Math.min(canvas.height - 1, Math.round(y))),
        1,
        1
      ).data;
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`.toUpperCase();
    } catch {
      return fgColor;
    }
  };

  const clearSelectionIds = () => {
    setSelectedCardId(null);
    setSelectedOverlayId(null);
    setSelectedShapeId(null);
    setSelectedImageLayerId(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);

    // 1. ZOOM TOOL
    if (activeTool === 'ZOOM') {
      if (e.altKey || e.shiftKey) {
        setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)));
      } else {
        setZoom((z) => Math.min(1.8, +(z + 0.1).toFixed(2)));
      }
      return;
    }

    // 2. HAND PAN TOOL
    if (activeTool === 'HAND') {
      const vp = viewportRef.current;
      if (!vp) return;
      dragRef.current = {
        type: 'PAN',
        startX: e.clientX,
        startY: e.clientY,
        origX: vp.scrollLeft,
        origY: vp.scrollTop,
      };
      return;
    }

    // 3. EYEDROPPER COLOR PICKER TOOL
    if (activeTool === 'EYEDROPPER') {
      const sampled = sampleCanvasHexAt(pt.x, pt.y);
      setFgColor(sampled);
      setStudioNotice(`Sampled color ${sampled} from canvas.`);
      return;
    }

    // 4. MARQUEE OR CROP SELECTION TOOL
    if (activeTool === 'MARQUEE' || activeTool === 'CROP') {
      setMarqueeRect({ x: Math.round(pt.x), y: Math.round(pt.y), w: 0, h: 0 });
      dragRef.current = {
        type: 'MARQUEE',
        startX: Math.round(pt.x),
        startY: Math.round(pt.y),
        origX: Math.round(pt.x),
        origY: Math.round(pt.y),
      };
      return;
    }

    // 5. PAINT BUCKET / GRADIENT FILL TOOL
    if (activeTool === 'GRADIENT_BUCKET') {
      if (marqueeRect && marqueeRect.w > 10 && marqueeRect.h > 10) {
        const newShapeId = `sh-${Date.now()}`;
        const fillShape: StudioShapeLayer = {
          id: newShapeId,
          shapeType: 'RECTANGLE',
          x: marqueeRect.x,
          y: marqueeRect.y,
          width: marqueeRect.w,
          height: marqueeRect.h,
          fillColor: fgColor,
          fillOpacity: brushOpacity,
          strokeColor: fgColor,
          strokeWidth: 0,
          rotation: 0,
          blendMode: 'source-over',
          visible: true,
          locked: false,
        };
        pushHistory(
          { ...studio, shapes: [...studio.shapes, fillShape] },
          'Bucket Fill Selection'
        );
      } else if (selectedShapeId) {
        pushHistory(
          {
            ...studio,
            shapes: studio.shapes.map((s) =>
              s.id === selectedShapeId ? { ...s, fillColor: fgColor } : s
            ),
          },
          'Fill Selected Shape'
        );
      } else {
        // Fill full background overlay shape
        const newShapeId = `sh-${Date.now()}`;
        const bgOverlay: StudioShapeLayer = {
          id: newShapeId,
          shapeType: 'RECTANGLE',
          x: 0,
          y: 0,
          width: studio.canvasWidth,
          height: studio.canvasHeight,
          fillColor: fgColor,
          fillOpacity: 0.25,
          strokeColor: fgColor,
          strokeWidth: 0,
          rotation: 0,
          blendMode: 'overlay',
          visible: true,
          locked: false,
        };
        pushHistory(
          { ...studio, shapes: [...studio.shapes, bgOverlay] },
          'Apply Color Wash Layer'
        );
      }
      return;
    }

    // 6. BRUSH / CLONE_HEAL / DODGE_BURN / BLUR_SHARPEN TOOLS
    if (
      activeTool === 'BRUSH' ||
      activeTool === 'CLONE_HEAL' ||
      activeTool === 'DODGE_BURN' ||
      activeTool === 'BLUR_SHARPEN'
    ) {
      let strokeColor = fgColor;
      let effectiveStyle = brushStyle;
      if (activeTool === 'CLONE_HEAL') {
        strokeColor = sampleCanvasHexAt(
          Math.max(0, pt.x - 18),
          Math.max(0, pt.y - 18)
        );
        effectiveStyle = 'HEAL_PATCH';
      } else if (activeTool === 'DODGE_BURN') {
        effectiveStyle = e.altKey ? 'BURN_SHADOW' : 'DODGE_LIGHT';
      } else if (activeTool === 'BLUR_SHARPEN') {
        effectiveStyle = 'BLUR_GLOW';
      }

      const newStroke: BrushStroke = {
        points: [pt],
        color: strokeColor,
        size: brushSize,
        opacity: brushOpacity,
        brushStyle: effectiveStyle,
      };
      setStudio((prev) => ({
        ...prev,
        strokes: [...prev.strokes, newStroke],
      }));
      dragRef.current = {
        type: 'BRUSH',
        startX: pt.x,
        startY: pt.y,
        origX: 0,
        origY: 0,
      };
      return;
    }

    // 7. ERASER TOOL
    if (activeTool === 'ERASER') {
      setStudio((prev) => ({
        ...prev,
        strokes: prev.strokes.filter(
          (s) =>
            !s.points.some(
              (p) => Math.hypot(p.x - pt.x, p.y - pt.y) < brushSize * 2.5
            )
        ),
      }));
      return;
    }

    // 8. TEXT TOOL
    if (activeTool === 'TEXT') {
      const newId = `ov-${Date.now()}`;
      const newLayer: CustomOverlayLayer = {
        id: newId,
        type: 'TEXT',
        text: 'Double-Click or Edit Text in Inspector',
        x: Math.round(pt.x),
        y: Math.round(pt.y),
        fontSize: 32,
        color: fgColor,
        strokeColor: '#FFFFFF',
        strokeWidth: 0,
        bgColor: '#8A4F38',
        showBgPill: false,
        fontFamily: 'Cinzel',
        bold: true,
        italic: false,
        rotation: 0,
        opacity: 1,
        blendMode: 'source-over',
        visible: true,
        locked: false,
      };
      pushHistory(
        {
          ...studio,
          overlays: [...studio.overlays, newLayer],
        },
        'Add Text Layer'
      );
      clearSelectionIds();
      setSelectedOverlayId(newId);
      setActiveTool('MOVE');
      setRightTab('LAYERS');
      return;
    }

    // 9. SHAPE TOOL
    if (activeTool === 'SHAPE') {
      const newId = `sh-${Date.now()}`;
      const newShape: StudioShapeLayer = {
        id: newId,
        shapeType: shapePreset,
        x: Math.round(pt.x - 110),
        y: Math.round(pt.y - 70),
        width: 220,
        height: shapePreset === 'LINE' ? 8 : 140,
        fillColor: fgColor,
        fillOpacity: shapePreset === 'LINE' ? 0 : 0.25,
        strokeColor: fgColor,
        strokeWidth: 3,
        rotation: 0,
        blendMode: 'source-over',
        visible: true,
        locked: false,
      };
      pushHistory(
        { ...studio, shapes: [...studio.shapes, newShape] },
        `Add ${shapePreset} Shape`
      );
      clearSelectionIds();
      setSelectedShapeId(newId);
      setActiveTool('MOVE');
      setRightTab('LAYERS');
      return;
    }

    // 10. STAMP / STICKER TOOL
    if (activeTool === 'STAMP') {
      const newId = `stamp-${Date.now()}`;
      const stampLayer: CustomOverlayLayer = {
        id: newId,
        type: 'BADGE',
        text: stampPreset,
        x: Math.round(pt.x),
        y: Math.round(pt.y),
        fontSize: 26,
        color: '#FFFFFF',
        strokeColor: '#C88A65',
        strokeWidth: 0,
        bgColor: '#8A4F38',
        showBgPill: true,
        fontFamily: 'Cinzel',
        bold: true,
        italic: false,
        rotation: 0,
        opacity: 1,
        blendMode: 'source-over',
        visible: true,
        locked: false,
      };
      pushHistory(
        { ...studio, overlays: [...studio.overlays, stampLayer] },
        'Stamp Badge'
      );
      clearSelectionIds();
      setSelectedOverlayId(newId);
      setActiveTool('MOVE');
      setRightTab('LAYERS');
      return;
    }

    // 11. MOVE & SELECT TOOL: Check Overlays -> Participant Cards -> Image Layers -> Shapes
    for (let i = studio.overlays.length - 1; i >= 0; i--) {
      const ov = studio.overlays[i];
      if (!ov.visible || ov.locked) continue;
      if (
        Math.abs(pt.x - ov.x) <= 190 &&
        pt.y >= ov.y - ov.fontSize - 14 &&
        pt.y <= ov.y + 20
      ) {
        clearSelectionIds();
        setSelectedOverlayId(ov.id);
        dragRef.current = {
          type: 'OVERLAY',
          id: ov.id,
          startX: pt.x,
          startY: pt.y,
          origX: ov.x,
          origY: ov.y,
        };
        return;
      }
    }

    for (let i = studio.cards.length - 1; i >= 0; i--) {
      const c = studio.cards[i];
      if (!c.visible || c.locked) continue;
      if (
        pt.x >= c.x &&
        pt.x <= c.x + c.width &&
        pt.y >= c.y &&
        pt.y <= c.y + c.height
      ) {
        clearSelectionIds();
        setSelectedCardId(c.id);
        dragRef.current = {
          type: 'CARD',
          id: c.id,
          startX: pt.x,
          startY: pt.y,
          origX: c.x,
          origY: c.y,
        };
        return;
      }
    }

    for (let i = studio.imageLayers.length - 1; i >= 0; i--) {
      const im = studio.imageLayers[i];
      if (!im.visible || im.locked) continue;
      if (
        pt.x >= im.x &&
        pt.x <= im.x + im.width &&
        pt.y >= im.y &&
        pt.y <= im.y + im.height
      ) {
        clearSelectionIds();
        setSelectedImageLayerId(im.id);
        dragRef.current = {
          type: 'IMAGE_LAYER',
          id: im.id,
          startX: pt.x,
          startY: pt.y,
          origX: im.x,
          origY: im.y,
        };
        return;
      }
    }

    for (let i = studio.shapes.length - 1; i >= 0; i--) {
      const sh = studio.shapes[i];
      if (!sh.visible || sh.locked) continue;
      if (
        pt.x >= sh.x &&
        pt.x <= sh.x + sh.width &&
        pt.y >= sh.y &&
        pt.y <= sh.y + sh.height
      ) {
        clearSelectionIds();
        setSelectedShapeId(sh.id);
        dragRef.current = {
          type: 'SHAPE',
          id: sh.id,
          startX: pt.x,
          startY: pt.y,
          origX: sh.x,
          origY: sh.y,
        };
        return;
      }
    }

    clearSelectionIds();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const drag = dragRef.current;

    if (drag.type === 'PAN') {
      const vp = viewportRef.current;
      if (!vp) return;
      vp.scrollLeft = drag.origX - (e.clientX - drag.startX);
      vp.scrollTop = drag.origY - (e.clientY - drag.startY);
      return;
    }

    const pt = getCanvasCoords(e);

    if (drag.type === 'MARQUEE') {
      const rx = Math.min(drag.startX, Math.round(pt.x));
      const ry = Math.min(drag.startY, Math.round(pt.y));
      const rw = Math.abs(Math.round(pt.x) - drag.startX);
      const rh = Math.abs(Math.round(pt.y) - drag.startY);
      setMarqueeRect({ x: rx, y: ry, w: rw, h: rh });
      return;
    }

    if (drag.type === 'BRUSH') {
      setStudio((prev) => {
        if (prev.strokes.length === 0) return prev;
        const updated = [...prev.strokes];
        const last = { ...updated[updated.length - 1] };
        last.points = [...last.points, pt];
        updated[updated.length - 1] = last;
        return { ...prev, strokes: updated };
      });
      return;
    }

    const dx = Math.round(pt.x - drag.startX);
    const dy = Math.round(pt.y - drag.startY);

    if (drag.type === 'CARD') {
      setStudio((prev) => ({
        ...prev,
        cards: prev.cards.map((c) =>
          c.id === drag.id
            ? { ...c, x: drag.origX + dx, y: drag.origY + dy }
            : c
        ),
      }));
    } else if (drag.type === 'OVERLAY') {
      setStudio((prev) => ({
        ...prev,
        overlays: prev.overlays.map((o) =>
          o.id === drag.id
            ? { ...o, x: drag.origX + dx, y: drag.origY + dy }
            : o
        ),
      }));
    } else if (drag.type === 'IMAGE_LAYER') {
      setStudio((prev) => ({
        ...prev,
        imageLayers: prev.imageLayers.map((im) =>
          im.id === drag.id
            ? { ...im, x: drag.origX + dx, y: drag.origY + dy }
            : im
        ),
      }));
    } else if (drag.type === 'SHAPE') {
      setStudio((prev) => ({
        ...prev,
        shapes: prev.shapes.map((sh) =>
          sh.id === drag.id
            ? { ...sh, x: drag.origX + dx, y: drag.origY + dy }
            : sh
        ),
      }));
    }
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const exportCanvasDataUrl = (
    mimeType: 'image/png' | 'image/jpeg' = 'image/png'
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL(mimeType, 0.95);
  };

  const handleDownloadEdited = (format: 'png' | 'jpg') => {
    clearSelectionIds();
    setMarqueeRect(null);
    setTimeout(() => {
      const dataUrl = exportCanvasDataUrl(
        format === 'png' ? 'image/png' : 'image/jpeg'
      );
      if (!dataUrl) return;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ILM_${poster.classCode}_Edited_Poster.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 50);
  };

  const handleSaveToDatabase = async () => {
    setSaving(true);
    try {
      clearSelectionIds();
      setMarqueeRect(null);
      await new Promise((r) => setTimeout(r, 70));
      const dataUrl = exportCanvasDataUrl('image/png');
      const snapshotJson = JSON.stringify(
        studio.cards.map((c) => ({
          id: c.id,
          fullName: c.fullName,
          photoUrl: c.photoUrl,
          classCode: c.classCode,
          categoryName: c.categoryName,
          ownTopic: c.ownTopic || null,
        }))
      );
      await onSavePoster(
        poster.id,
        dataUrl,
        studio.title,
        studio.subtitle,
        snapshotJson
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerPostToFeed = async () => {
    setPostingFeed(true);
    try {
      clearSelectionIds();
      setMarqueeRect(null);
      await new Promise((r) => setTimeout(r, 70));
      const dataUrl = exportCanvasDataUrl('image/png');
      await onPostToFeed(poster, dataUrl, feedCaption);
      setShowFeedPrompt(false);
      setStudioNotice(`Shared Class ${poster.classCode} Poster to the Public Feed!`);
    } finally {
      setPostingFeed(false);
    }
  };

  // Upload a Pre-Made Poster as the Full Base Poster inside Studio
  const handleUploadPreMadeBasePoster = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFileToImgBB(file);
    pushHistory(
      {
        ...studio,
        bgTheme: 'UPLOADED_POSTER',
        customBgUrl: url,
        customBgOpacity: 100,
        showCompartmentBoxes: false,
        showHeaderLockup: false,
      },
      'Uploaded Pre-Made Base Poster'
    );
    setStudioNotice(
      'Loaded pre-made poster! You can now add text, photos, shapes, retouch, or save/share directly.'
    );
    e.target.value = '';
  };

  // Upload a Floating Image Layer (Logo, Extra Participant Photo, Graphic)
  const handleUploadFloatingImageLayer = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFileToImgBB(file);
    const newId = `img-${Date.now()}`;
    const newLayer: StudioImageLayer = {
      id: newId,
      name: file.name.slice(0, 24),
      imageUrl: url,
      x: Math.round(studio.canvasWidth / 2 - 160),
      y: Math.round(studio.canvasHeight / 2 - 160),
      width: 320,
      height: 320,
      rotation: 0,
      opacity: 1,
      cornerRadius: 16,
      borderWidth: 2,
      borderColor: '#C88A65',
      flipX: false,
      flipY: false,
      blendMode: 'source-over',
      visible: true,
      locked: false,
    };
    pushHistory(
      {
        ...studio,
        imageLayers: [...studio.imageLayers, newLayer],
      },
      `Added Image Layer (${file.name})`
    );
    clearSelectionIds();
    setSelectedImageLayerId(newId);
    setActiveTool('MOVE');
    setRightTab('LAYERS');
    e.target.value = '';
  };

  // Add a brand new Participant Card directly inside Photoshop Studio
  const handleAddNewParticipantCard = () => {
    const newId = Date.now();
    const newCard: StudioParticipantCard = {
      id: newId,
      fullName: 'New Scholar Name',
      photoUrl: '/assets/scholars/scholar_1.svg',
      classCode: poster.classCode,
      categoryName: 'Speech',
      x: Math.round(studio.canvasWidth / 2 - 95),
      y: Math.round(studio.canvasHeight / 2 - 75),
      width: 190,
      height: 150,
      rotation: 0,
      opacity: 1,
      photoScale: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
      flipX: false,
      flipY: false,
      visible: true,
      locked: false,
    };
    pushHistory(
      { ...studio, cards: [...studio.cards, newCard] },
      'Added New Scholar Card'
    );
    clearSelectionIds();
    setSelectedCardId(newId);
    setActiveTool('MOVE');
    setRightTab('LAYERS');
  };

  const selectedCard =
    studio.cards.find((c) => c.id === selectedCardId) || null;
  const selectedOverlay =
    studio.overlays.find((o) => o.id === selectedOverlayId) || null;
  const selectedShape =
    studio.shapes.find((s) => s.id === selectedShapeId) || null;
  const selectedImageLayer =
    studio.imageLayers.find((im) => im.id === selectedImageLayerId) || null;

  const TOOLBOX_ITEMS: Array<{
    id: PhotoshopToolId;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'MOVE', label: 'Move & Transform Tool (V)', icon: Move },
    { id: 'MARQUEE', label: 'Rectangular Marquee Selection (M)', icon: Square },
    { id: 'CROP', label: 'Crop & Canvas Ratio Tool (C)', icon: Crop },
    { id: 'EYEDROPPER', label: 'Eyedropper Color Picker (I)', icon: Pipette },
    { id: 'BRUSH', label: 'Paint & Retouch Brush (B)', icon: Brush },
    { id: 'CLONE_HEAL', label: 'Spot Healing & Clone Stamp (J)', icon: Wand2 },
    { id: 'ERASER', label: 'Stroke Eraser Tool (E)', icon: Eraser },
    {
      id: 'GRADIENT_BUCKET',
      label: 'Paint Bucket & Color Wash (G)',
      icon: PaintBucket,
    },
    { id: 'BLUR_SHARPEN', label: 'Blur / Soft Glow Brush (R)', icon: Droplet },
    {
      id: 'DODGE_BURN',
      label: 'Dodge Light / Alt+Burn Shadow (O)',
      icon: Sun,
    },
    { id: 'TEXT', label: 'Horizontal Type / Text Tool (T)', icon: Type },
    {
      id: 'SHAPE',
      label: 'Rectangle / Circle / Arch / Star Shape Tool (U)',
      icon: Circle,
    },
    {
      id: 'STAMP',
      label: 'Botanical & Award Badge Stamp Tool (A)',
      icon: Stamp,
    },
    { id: 'HAND', label: 'Hand Pan Canvas Tool (H)', icon: Hand },
    { id: 'ZOOM', label: 'Zoom In / Alt+Zoom Out Tool (Z)', icon: ZoomIn },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#050609] text-neutral-100 flex flex-col overflow-hidden select-none">
      {/* =====================================================================
          1. TOP PHOTOSHOP APPLICATION HEADER & QUICK ACTIONS BAR
         ===================================================================== */}
      <header className="h-14 px-4 bg-[#0B0D14] border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2.5 py-1 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F3D068] font-display font-bold text-xs shrink-0">
            PS · ILM PHOTOSHOP STUDIO
          </span>
          <span className="text-xs text-neutral-300 font-semibold truncate hidden sm:inline">
            Class {poster.classCode} — Full Poster Editor ({studio.canvasWidth}×
            {studio.canvasHeight}px)
          </span>

          {/* Quick Upload Pre-Made Poster or Image Layer right in Top Bar */}
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/90 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/50 text-xs font-semibold cursor-pointer shrink-0">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {uploadingAsset ? 'Uploading...' : 'Upload Pre-Made Poster'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadPreMadeBasePoster}
            />
          </label>

          <label className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141824] hover:bg-[#1B2234] text-neutral-200 border border-neutral-700 text-xs font-medium cursor-pointer shrink-0">
            <ImageIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Add Image Layer</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadFloatingImageLayer}
            />
          </label>

          {/* Quick Template Switcher */}
          <button
            type="button"
            onClick={() => setRightTab('LAYOUT')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#F3D068] border border-[#D4AF37]/40 text-xs font-semibold cursor-pointer shrink-0"
            title="Choose from 20 distinct poster template designs, AI artwork backgrounds and color schemes"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Choose Template (20 Styles & AI Art)</span>
          </button>
        </div>

        {/* Center Undo / Redo / Zoom / Grid Controls */}
        <div className="hidden md:flex items-center gap-1 bg-[#12151F] px-2.5 py-1 rounded-lg border border-neutral-800">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <span className="text-neutral-700 mx-1">|</span>
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.max(0.25, +(z - 0.08).toFixed(2)))
            }
            className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(0.56)}
            className="text-xs font-mono-tabular w-12 text-center hover:text-[#F3D068] cursor-pointer"
            title="Reset Zoom to Fit"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.min(1.6, +(z + 0.08).toFixed(2)))
            }
            className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-neutral-700 mx-1">|</span>
          <button
            type="button"
            onClick={() => setShowGrid((g) => !g)}
            className={`p-1.5 rounded cursor-pointer ${
              showGrid
                ? 'bg-[#D4AF37] text-neutral-950'
                : 'hover:bg-neutral-800'
            }`}
            title="Toggle Alignment Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        {/* Right Export / Share to Feed / Save Poster Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownloadEdited('png')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151924] hover:bg-[#1E2436] text-neutral-200 border border-neutral-700 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Download PNG</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFeedPrompt(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 text-xs font-semibold cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Share to Feed</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToDatabase}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#C89D2E] via-[#E8C55B] to-[#C89D2E] text-neutral-950 font-bold text-xs cursor-pointer disabled:opacity-50 shadow"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Poster'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =====================================================================
          2. CONTEXTUAL PHOTOSHOP TOOL OPTIONS RIBBON
         ===================================================================== */}
      <div className="h-11 px-4 bg-[#0E111A] border-b border-neutral-800/90 flex items-center justify-between gap-4 text-xs overflow-x-auto shrink-0">
        <div className="flex items-center gap-3 whitespace-nowrap">
          <span className="font-bold text-[#F3D068] uppercase tracking-wider">
            Tool: {activeTool.replace('_', ' ')}
          </span>
          <span className="text-neutral-700">|</span>

          {/* Active Foreground / Background Color Swatches */}
          <div className="flex items-center gap-1.5">
            <label className="text-neutral-400">Color:</label>
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border border-neutral-600 bg-transparent"
              title="Foreground Color"
            />
            <span className="font-mono-tabular text-[11px] text-neutral-300">
              {fgColor}
            </span>
          </div>

          {/* Brush / Retouch / Eraser Options */}
          {(activeTool === 'BRUSH' ||
            activeTool === 'CLONE_HEAL' ||
            activeTool === 'DODGE_BURN' ||
            activeTool === 'BLUR_SHARPEN' ||
            activeTool === 'ERASER') && (
            <>
              <span className="text-neutral-700">|</span>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Tip:</span>
                <select
                  value={brushStyle}
                  onChange={(e) =>
                    setBrushStyle(e.target.value as BrushStroke['brushStyle'])
                  }
                  className="px-2 py-1 rounded bg-[#141824] border border-neutral-700 text-white text-xs"
                >
                  <option value="SOFT_ROUND">Soft Round</option>
                  <option value="HARD_ROUND">Hard Round</option>
                  <option value="CALLIGRAPHY">Calligraphy Pen</option>
                  <option value="GOLD_SHIMMER">Gold Shimmer</option>
                  <option value="NEON_GLOW">Neon Glow</option>
                  <option value="BLUR_GLOW">Soft Blur Glow</option>
                  <option value="DODGE_LIGHT">Dodge Highlight</option>
                  <option value="BURN_SHADOW">Burn Shadow</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Size: {brushSize}px</span>
                <input
                  type="range"
                  min={2}
                  max={80}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">
                  Opacity: {Math.round(brushOpacity * 100)}%
                </span>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={brushOpacity}
                  onChange={(e) => setBrushOpacity(Number(e.target.value))}
                  className="w-20"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  pushHistory({ ...studio, strokes: [] }, 'Cleared All Strokes')
                }
                className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/50 cursor-pointer"
              >
                Clear Strokes
              </button>
            </>
          )}

          {/* Shape Tool Options */}
          {activeTool === 'SHAPE' && (
            <>
              <span className="text-neutral-700">|</span>
              <span className="text-neutral-400">Shape Preset:</span>
              <select
                value={shapePreset}
                onChange={(e) =>
                  setShapePreset(
                    e.target.value as StudioShapeLayer['shapeType']
                  )
                }
                className="px-2 py-1 rounded bg-[#141824] border border-neutral-700 text-white"
              >
                <option value="ROUNDED_RECT">Rounded Card</option>
                <option value="RECTANGLE">Sharp Rectangle</option>
                <option value="CIRCLE">Circle / Medallion</option>
                <option value="ARCH">Classical Arch</option>
                <option value="STAR">5-Point Star</option>
                <option value="GOLD_RIBBON">Pill Banner Ribbon</option>
                <option value="LINE">Divider Line</option>
              </select>
              <span className="text-neutral-400">
                (Click anywhere on canvas to place shape)
              </span>
            </>
          )}

          {/* Stamp Tool Options */}
          {activeTool === 'STAMP' && (
            <>
              <span className="text-neutral-700">|</span>
              <span className="text-neutral-400">Stamp Badge:</span>
              <select
                value={stampPreset}
                onChange={(e) => setStampPreset(e.target.value)}
                className="px-2 py-1 rounded bg-[#141824] border border-neutral-700 text-white"
              >
                <option value="🌸 BOTANICAL ROSE SEAL 🌸">
                  🌸 Botanical Rose Seal
                </option>
                <option value="★ OFFICIAL ILM SELECTION ★">
                  ★ Official ILM Selection
                </option>
                <option value="🏆 WEEKLY COMPETITION LINEUP 🏆">
                  🏆 Weekly Competition Lineup
                </option>
                <option value="👑 BEST SPEAKER NOMINEE 👑">
                  👑 Best Speaker Nominee
                </option>
                <option value="✨ TALENT TODAY · LEADERS TOMORROW ✨">
                  ✨ Talent Today · Leaders Tomorrow
                </option>
              </select>
              <span className="text-neutral-400">
                (Click canvas to stamp)
              </span>
            </>
          )}

          {/* Marquee / Crop Options */}
          {marqueeRect && marqueeRect.w > 8 && (
            <>
              <span className="text-neutral-700">|</span>
              <span className="text-[#00D4FF] font-mono-tabular">
                Selection: {marqueeRect.w}×{marqueeRect.h}px
              </span>
              <button
                type="button"
                onClick={() => {
                  pushHistory(
                    {
                      ...studio,
                      canvasWidth: Math.max(400, marqueeRect.w),
                      canvasHeight: Math.max(400, marqueeRect.h),
                      cards: studio.cards.map((c) => ({
                        ...c,
                        x: c.x - marqueeRect.x,
                        y: c.y - marqueeRect.y,
                      })),
                      overlays: studio.overlays.map((o) => ({
                        ...o,
                        x: o.x - marqueeRect.x,
                        y: o.y - marqueeRect.y,
                      })),
                      shapes: studio.shapes.map((s) => ({
                        ...s,
                        x: s.x - marqueeRect.x,
                        y: s.y - marqueeRect.y,
                      })),
                      imageLayers: studio.imageLayers.map((im) => ({
                        ...im,
                        x: im.x - marqueeRect.x,
                        y: im.y - marqueeRect.y,
                      })),
                    },
                    'Cropped Canvas to Selection'
                  );
                  setMarqueeRect(null);
                  setActiveTool('MOVE');
                }}
                className="px-2.5 py-1 rounded bg-[#D4AF37] text-neutral-950 font-bold cursor-pointer"
              >
                Apply Crop
              </button>
              <button
                type="button"
                onClick={() => setMarqueeRect(null)}
                className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 cursor-pointer"
              >
                Deselect
              </button>
            </>
          )}
        </div>

        {/* Quick Layer Action Shortcuts on Right of Ribbon */}
        <div className="flex items-center gap-2 shrink-0">
          {studioNotice && (
            <span className="text-emerald-300 font-medium truncate max-w-xs">
              {studioNotice}
            </span>
          )}
          <button
            type="button"
            onClick={handleAddNewParticipantCard}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#162038] hover:bg-[#1E2C4D] text-[#60A5FA] border border-[#3B82F6]/40 font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Scholar Photo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const newId = `ov-${Date.now()}`;
              pushHistory(
                {
                  ...studio,
                  overlays: [
                    ...studio.overlays,
                    {
                      id: newId,
                      type: 'TEXT',
                      text: 'New Poster Heading',
                      x: Math.round(studio.canvasWidth / 2),
                      y: Math.round(studio.canvasHeight / 2),
                      fontSize: 34,
                      color: '#7A4938',
                      strokeColor: '#FFFFFF',
                      strokeWidth: 0,
                      bgColor: '#8A4F38',
                      showBgPill: false,
                      fontFamily: 'Cinzel',
                      bold: true,
                      italic: false,
                      rotation: 0,
                      opacity: 1,
                      blendMode: 'source-over',
                      visible: true,
                      locked: false,
                    },
                  ],
                },
                'Added Text Layer'
              );
              clearSelectionIds();
              setSelectedOverlayId(newId);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#151924] hover:bg-neutral-800 text-[#F3D068] border border-[#D4AF37]/40 font-semibold cursor-pointer"
          >
            <Type className="w-3.5 h-3.5" />
            <span>+ Add Text</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          3. MAIN 3-PANE PHOTOSHOP WORKSPACE
         ===================================================================== */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT PHOTOSHOP TOOLBOX (15 Professional Tools + Color Swatches) */}
        <aside className="w-16 bg-[#0B0D14] border-r border-neutral-800 flex flex-col items-center py-3 gap-1.5 overflow-y-auto shrink-0">
          {TOOLBOX_ITEMS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
                className={`w-10 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#D4AF37] text-neutral-950 shadow-md'
                    : 'bg-[#12151F] text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}

          <div className="w-8 border-t border-neutral-800 my-1" />

          {/* Upload Floating Image Tool Button in Toolbox */}
          <label
            title="Place Image / Logo Layer (P)"
            className="w-10 h-9 rounded-lg bg-[#12151F] hover:bg-neutral-800 text-indigo-300 flex items-center justify-center cursor-pointer shrink-0"
          >
            <ImageIcon className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadFloatingImageLayer}
            />
          </label>

          {/* Photoshop Dual Foreground/Background Swatches */}
          <div className="relative w-10 h-10 mt-1 shrink-0" title="Foreground / Background Colors">
            <input
              type="color"
              value={bgColorSwatch}
              onChange={(e) => setBgColorSwatch(e.target.value)}
              className="absolute bottom-0 right-0 w-6 h-6 rounded border border-neutral-500 cursor-pointer"
            />
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="absolute top-0 left-0 w-6 h-6 rounded border-2 border-white cursor-pointer z-10"
            />
          </div>
        </aside>

        {/* CENTER INTERACTIVE CANVAS STAGE */}
        <div
          ref={viewportRef}
          className="flex-1 bg-[#050609] overflow-auto flex items-start justify-center p-6 sm:p-10"
        >
          <div
            className="shadow-2xl border border-neutral-800 bg-[#FFF5F5] transition-all shrink-0"
            style={{
              width: `${Math.round(studio.canvasWidth * zoom)}px`,
              height: `${Math.round(studio.canvasHeight * zoom)}px`,
            }}
          >
            <canvas
              ref={canvasRef}
              width={studio.canvasWidth}
              height={studio.canvasHeight}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`w-full h-full block ${
                activeTool === 'MOVE'
                  ? 'cursor-move'
                  : activeTool === 'HAND'
                  ? 'cursor-grab'
                  : activeTool === 'ZOOM'
                  ? 'cursor-zoom-in'
                  : activeTool === 'TEXT'
                  ? 'cursor-text'
                  : 'cursor-crosshair'
              }`}
            />
          </div>
        </div>

        {/* RIGHT PHOTOSHOP INSPECTOR (4 TABS: LAYERS, ADJUSTMENTS, LAYOUT, HISTORY) */}
        <aside className="w-80 sm:w-96 bg-[#0B0D14] border-l border-neutral-800 flex flex-col shrink-0">
          {/* Inspector Tabs */}
          <div className="grid grid-cols-4 border-b border-neutral-800 text-[11px] font-semibold">
            {(
              [
                { id: 'LAYERS', label: 'Layers', icon: Layers },
                { id: 'ADJUSTMENTS', label: 'Adjust', icon: Sliders },
                { id: 'LAYOUT', label: 'Template', icon: LayoutGrid },
                { id: 'HISTORY', label: 'History', icon: History },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRightTab(t.id)}
                  className={`py-3 px-1 flex items-center justify-center gap-1 border-b-2 transition-colors cursor-pointer ${
                    rightTab === t.id
                      ? 'border-[#D4AF37] text-[#F3D068] bg-[#12151F]'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* ===============================================================
                TAB 1: LAYERS & SELECTED ELEMENT PROPERTIES
               =============================================================== */}
            {rightTab === 'LAYERS' && (
              <>
                {/* SELECTED SCHOLAR CARD INSPECTOR */}
                {selectedCard && (
                  <div className="p-3.5 rounded-xl bg-[#141A29] border border-[#00D4FF]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#00D4FF]">
                        Selected Scholar Card
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Flip Horizontal"
                          onClick={() =>
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, flipX: !c.flipX }
                                  : c
                              ),
                            }))
                          }
                          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
                        >
                          <FlipHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Duplicate Scholar Card"
                          onClick={() => {
                            const dup: StudioParticipantCard = {
                              ...selectedCard,
                              id: Date.now(),
                              x: selectedCard.x + 25,
                              y: selectedCard.y + 25,
                            };
                            pushHistory(
                              { ...studio, cards: [...studio.cards, dup] },
                              'Duplicated Scholar Card'
                            );
                            setSelectedCardId(dup.id);
                          }}
                          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Delete Scholar Card from Poster"
                          onClick={() => {
                            pushHistory(
                              {
                                ...studio,
                                cards: studio.cards.filter(
                                  (c) => c.id !== selectedCard.id
                                ),
                              },
                              'Removed Scholar Card'
                            );
                            setSelectedCardId(null);
                          }}
                          className="p-1 rounded bg-red-950/60 hover:bg-red-900 text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Replace or Upload Scholar Photo */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-[#0B0E17] border border-neutral-800">
                      <img
                        src={selectedCard.photoUrl}
                        alt={selectedCard.fullName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover border border-[#D4AF37]"
                      />
                      <label className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 text-center font-semibold cursor-pointer">
                        <Upload className="w-3.5 h-3.5 inline mr-1" />
                        <span>Change Scholar Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const uploadedUrl = await uploadFileToImgBB(file);
                            pushHistory(
                              {
                                ...studio,
                                cards: studio.cards.map((c) =>
                                  c.id === selectedCard.id
                                    ? { ...c, photoUrl: uploadedUrl }
                                    : c
                                ),
                              },
                              `Updated Photo for ${selectedCard.fullName}`
                            );
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-neutral-300 mb-1">
                        Scholar Name
                      </label>
                      <input
                        type="text"
                        value={selectedCard.fullName}
                        onChange={(e) =>
                          setStudio((prev) => ({
                            ...prev,
                            cards: prev.cards.map((c) =>
                              c.id === selectedCard.id
                                ? { ...c, fullName: e.target.value }
                                : c
                            ),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Category Role
                        </label>
                        <select
                          value={selectedCard.categoryName}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, categoryName: e.target.value }
                                  : c
                              ),
                            }))
                          }
                          className="w-full px-2 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                        >
                          {CATEGORY_ORDER.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Photo Zoom ({Math.round(selectedCard.photoScale * 100)}
                          %)
                        </label>
                        <input
                          type="range"
                          min={0.6}
                          max={2.2}
                          step={0.05}
                          value={selectedCard.photoScale}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === selectedCard.id
                                  ? {
                                      ...c,
                                      photoScale: Number(e.target.value),
                                    }
                                  : c
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Width ({selectedCard.width}px)
                        </label>
                        <input
                          type="range"
                          min={110}
                          max={480}
                          value={selectedCard.width}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, width: Number(e.target.value) }
                                  : c
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Height ({selectedCard.height}px)
                        </label>
                        <input
                          type="range"
                          min={70}
                          max={480}
                          value={selectedCard.height}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, height: Number(e.target.value) }
                                  : c
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Rotation ({selectedCard.rotation || 0}°)
                        </label>
                        <input
                          type="range"
                          min={-45}
                          max={45}
                          value={selectedCard.rotation || 0}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, rotation: Number(e.target.value) }
                                  : c
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Opacity ({Math.round((selectedCard.opacity ?? 1) * 100)}
                          %)
                        </label>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={selectedCard.opacity ?? 1}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, opacity: Number(e.target.value) }
                                  : c
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SELECTED FLOATING IMAGE LAYER INSPECTOR */}
                {selectedImageLayer && (
                  <div className="p-3.5 rounded-xl bg-[#141A29] border border-[#00D4FF]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#00D4FF]">
                        Selected Image Layer
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          pushHistory(
                            {
                              ...studio,
                              imageLayers: studio.imageLayers.filter(
                                (im) => im.id !== selectedImageLayer.id
                              ),
                            },
                            'Deleted Image Layer'
                          );
                          setSelectedImageLayerId(null);
                        }}
                        className="text-red-400 hover:underline cursor-pointer"
                      >
                        Delete Layer
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Width ({selectedImageLayer.width}px)
                        </label>
                        <input
                          type="range"
                          min={60}
                          max={1600}
                          value={selectedImageLayer.width}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              imageLayers: prev.imageLayers.map((im) =>
                                im.id === selectedImageLayer.id
                                  ? { ...im, width: Number(e.target.value) }
                                  : im
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Height ({selectedImageLayer.height}px)
                        </label>
                        <input
                          type="range"
                          min={60}
                          max={1200}
                          value={selectedImageLayer.height}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              imageLayers: prev.imageLayers.map((im) =>
                                im.id === selectedImageLayer.id
                                  ? { ...im, height: Number(e.target.value) }
                                  : im
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Rotation ({selectedImageLayer.rotation}°)
                        </label>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          value={selectedImageLayer.rotation}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              imageLayers: prev.imageLayers.map((im) =>
                                im.id === selectedImageLayer.id
                                  ? { ...im, rotation: Number(e.target.value) }
                                  : im
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Opacity ({Math.round(selectedImageLayer.opacity * 100)}
                          %)
                        </label>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={selectedImageLayer.opacity}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              imageLayers: prev.imageLayers.map((im) =>
                                im.id === selectedImageLayer.id
                                  ? { ...im, opacity: Number(e.target.value) }
                                  : im
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setStudio((prev) => ({
                          ...prev,
                          imageLayers: prev.imageLayers.map((im) =>
                            im.id === selectedImageLayer.id
                              ? {
                                  ...im,
                                  x: 0,
                                  y: 0,
                                  width: prev.canvasWidth,
                                  height: prev.canvasHeight,
                                  cornerRadius: 0,
                                }
                              : im
                          ),
                        }))
                      }
                      className="w-full py-1.5 rounded bg-[#162038] text-[#60A5FA] border border-[#3B82F6]/40 font-semibold cursor-pointer"
                    >
                      Stretch Image to Full Poster Canvas
                    </button>
                  </div>
                )}

                {/* SELECTED TEXT / BADGE OVERLAY INSPECTOR */}
                {selectedOverlay && (
                  <div className="p-3.5 rounded-xl bg-[#141A29] border border-[#00D4FF]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#00D4FF]">
                        Selected Text / Stamp Layer
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          pushHistory(
                            {
                              ...studio,
                              overlays: studio.overlays.filter(
                                (o) => o.id !== selectedOverlay.id
                              ),
                            },
                            'Deleted Text Layer'
                          );
                          setSelectedOverlayId(null);
                        }}
                        className="text-red-400 hover:underline cursor-pointer"
                      >
                        Delete Layer
                      </button>
                    </div>
                    <input
                      type="text"
                      value={selectedOverlay.text}
                      onChange={(e) =>
                        setStudio((prev) => ({
                          ...prev,
                          overlays: prev.overlays.map((o) =>
                            o.id === selectedOverlay.id
                              ? { ...o, text: e.target.value }
                              : o
                          ),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedOverlay.fontFamily}
                        onChange={(e) =>
                          setStudio((prev) => ({
                            ...prev,
                            overlays: prev.overlays.map((o) =>
                              o.id === selectedOverlay.id
                                ? { ...o, fontFamily: e.target.value }
                                : o
                            ),
                          }))
                        }
                        className="px-2 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                      >
                        <option value="Cinzel">Cinzel Serif</option>
                        <option value="Plus Jakarta Sans">
                          Plus Jakarta Sans
                        </option>
                        <option value="Georgia">Georgia Classic</option>
                        <option value="Impact">Impact Bold</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={12}
                          max={90}
                          value={selectedOverlay.fontSize}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              overlays: prev.overlays.map((o) =>
                                o.id === selectedOverlay.id
                                  ? { ...o, fontSize: Number(e.target.value) }
                                  : o
                              ),
                            }))
                          }
                          className="flex-1"
                        />
                        <input
                          type="color"
                          value={selectedOverlay.color}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              overlays: prev.overlays.map((o) =>
                                o.id === selectedOverlay.id
                                  ? { ...o, color: e.target.value }
                                  : o
                              ),
                            }))
                          }
                          className="w-7 h-7 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-1.5 text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedOverlay.showBgPill}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              overlays: prev.overlays.map((o) =>
                                o.id === selectedOverlay.id
                                  ? { ...o, showBgPill: e.target.checked }
                                  : o
                              ),
                            }))
                          }
                        />
                        <span>Background Pill</span>
                      </label>
                      {selectedOverlay.showBgPill && (
                        <input
                          type="color"
                          value={selectedOverlay.bgColor || '#8A4F38'}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              overlays: prev.overlays.map((o) =>
                                o.id === selectedOverlay.id
                                  ? { ...o, bgColor: e.target.value }
                                  : o
                              ),
                            }))
                          }
                          className="w-7 h-6 rounded cursor-pointer"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* SELECTED SHAPE INSPECTOR */}
                {selectedShape && (
                  <div className="p-3.5 rounded-xl bg-[#141A29] border border-[#00D4FF]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#00D4FF]">
                        Selected Shape ({selectedShape.shapeType})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          pushHistory(
                            {
                              ...studio,
                              shapes: studio.shapes.filter(
                                (s) => s.id !== selectedShape.id
                              ),
                            },
                            'Deleted Shape Layer'
                          );
                          setSelectedShapeId(null);
                        }}
                        className="text-red-400 hover:underline cursor-pointer"
                      >
                        Delete Shape
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Fill Color & Opacity
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedShape.fillColor}
                            onChange={(e) =>
                              setStudio((prev) => ({
                                ...prev,
                                shapes: prev.shapes.map((s) =>
                                  s.id === selectedShape.id
                                    ? { ...s, fillColor: e.target.value }
                                    : s
                                ),
                              }))
                            }
                            className="w-7 h-7 rounded cursor-pointer"
                          />
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={selectedShape.fillOpacity}
                            onChange={(e) =>
                              setStudio((prev) => ({
                                ...prev,
                                shapes: prev.shapes.map((s) =>
                                  s.id === selectedShape.id
                                    ? {
                                        ...s,
                                        fillOpacity: Number(e.target.value),
                                      }
                                    : s
                                ),
                              }))
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Border Color & Width
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedShape.strokeColor}
                            onChange={(e) =>
                              setStudio((prev) => ({
                                ...prev,
                                shapes: prev.shapes.map((s) =>
                                  s.id === selectedShape.id
                                    ? { ...s, strokeColor: e.target.value }
                                    : s
                                ),
                              }))
                            }
                            className="w-7 h-7 rounded cursor-pointer"
                          />
                          <input
                            type="range"
                            min={0}
                            max={16}
                            value={selectedShape.strokeWidth}
                            onChange={(e) =>
                              setStudio((prev) => ({
                                ...prev,
                                shapes: prev.shapes.map((s) =>
                                  s.id === selectedShape.id
                                    ? {
                                        ...s,
                                        strokeWidth: Number(e.target.value),
                                      }
                                    : s
                                ),
                              }))
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Poster Header & Typography Quick Editor */}
                <div className="p-3.5 rounded-xl bg-[#11141E] border border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F3D068] uppercase tracking-wider">
                      Poster Header & Program Bar
                    </span>
                    <label className="inline-flex items-center gap-1 text-[11px] text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={studio.showHeaderLockup}
                        onChange={(e) =>
                          setStudio((prev) => ({
                            ...prev,
                            showHeaderLockup: e.target.checked,
                          }))
                        }
                      />
                      <span>Show Header</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={studio.title}
                    onChange={(e) =>
                      setStudio((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Main Poster Headline"
                    className="w-full px-2.5 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                  />
                  <input
                    type="text"
                    value={studio.subtitle}
                    onChange={(e) =>
                      setStudio((prev) => ({
                        ...prev,
                        subtitle: e.target.value,
                      }))
                    }
                    placeholder="Class Subtitle"
                    className="w-full px-2.5 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                  />
                  <input
                    type="text"
                    value={studio.programDetails}
                    onChange={(e) =>
                      setStudio((prev) => ({
                        ...prev,
                        programDetails: e.target.value,
                      }))
                    }
                    placeholder="Date | Program No | Venue"
                    className="w-full px-2.5 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                  />
                </div>

                {/* All Scholar Cards & Layers Stack */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-neutral-400 font-semibold uppercase tracking-wider">
                    <span>Scholar Layers ({studio.cards.length})</span>
                    <button
                      type="button"
                      onClick={handleAddNewParticipantCard}
                      className="text-[#00D4FF] hover:underline cursor-pointer"
                    >
                      + Add Scholar
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {studio.cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => {
                          clearSelectionIds();
                          setSelectedCardId(card.id);
                        }}
                        className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer ${
                          selectedCardId === card.id
                            ? 'bg-[#162038] border-[#00D4FF]'
                            : 'bg-[#11141E] border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={card.photoUrl}
                            alt={card.fullName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded object-cover shrink-0 border border-[#D4AF37]/50"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">
                              {card.fullName}
                            </div>
                            <div className="text-[10px] text-[#F3D068]">
                              {card.categoryName} · {card.classCode}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudio((prev) => ({
                                ...prev,
                                cards: prev.cards.map((c) =>
                                  c.id === card.id
                                    ? { ...c, locked: !c.locked }
                                    : c
                                ),
                              }));
                            }}
                            className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                            title={card.locked ? 'Unlock Layer' : 'Lock Layer'}
                          >
                            {card.locked ? (
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudio((prev) => ({
                                ...prev,
                                cards: prev.cards.map((c) =>
                                  c.id === card.id
                                    ? { ...c, visible: !c.visible }
                                    : c
                                ),
                              }));
                            }}
                            className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                          >
                            {card.visible ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-red-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ===============================================================
                TAB 2: PHOTOSHOP ADJUSTMENTS, COLOR GRADING & LUT PRESETS
               =============================================================== */}
            {rightTab === 'ADJUSTMENTS' && (
              <div className="space-y-4">
                {/* 1-Click Filter LUT Presets */}
                <div className="p-3.5 rounded-xl bg-[#11141E] border border-neutral-800 space-y-2.5">
                  <div className="font-semibold text-[#F3D068] uppercase tracking-wider">
                    1-Click Photoshop Filter Presets
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        name: 'Original Natural',
                        vals: {
                          brightness: 100,
                          contrast: 100,
                          saturation: 100,
                          sepia: 0,
                          hueRotate: 0,
                        },
                      },
                      {
                        name: 'Warm Rose Gold',
                        vals: {
                          brightness: 104,
                          contrast: 108,
                          saturation: 118,
                          sepia: 14,
                          hueRotate: -5,
                        },
                      },
                      {
                        name: 'Crisp HD Print',
                        vals: {
                          brightness: 103,
                          contrast: 122,
                          saturation: 115,
                          sepia: 0,
                          hueRotate: 0,
                        },
                      },
                      {
                        name: 'Vintage Parchment',
                        vals: {
                          brightness: 98,
                          contrast: 106,
                          saturation: 85,
                          sepia: 38,
                          hueRotate: 0,
                        },
                      },
                      {
                        name: 'Vivid Stage Pop',
                        vals: {
                          brightness: 105,
                          contrast: 116,
                          saturation: 145,
                          sepia: 0,
                          hueRotate: 0,
                        },
                      },
                      {
                        name: 'Monochrome Silver',
                        vals: {
                          brightness: 105,
                          contrast: 125,
                          saturation: 0,
                          sepia: 8,
                          hueRotate: 0,
                        },
                      },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          pushHistory(
                            { ...studio, ...preset.vals },
                            `Applied Filter: ${preset.name}`
                          )
                        }
                        className="p-2 rounded-lg bg-[#090B10] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-left font-medium cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fine Adjustment Sliders */}
                <div className="p-3.5 rounded-xl bg-[#11141E] border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F3D068] uppercase tracking-wider">
                      Color & Lighting Grading
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        pushHistory(
                          {
                            ...studio,
                            brightness: 100,
                            contrast: 100,
                            saturation: 100,
                            exposure: 100,
                            sepia: 0,
                            hueRotate: 0,
                            blurPx: 0,
                            goldGlow: 35,
                            vignette: 12,
                          },
                          'Reset Color Adjustments'
                        )
                      }
                      className="text-[#00D4FF] hover:underline cursor-pointer"
                    >
                      Reset All
                    </button>
                  </div>

                  {[
                    {
                      label: 'Brightness',
                      key: 'brightness' as const,
                      min: 50,
                      max: 150,
                      unit: '%',
                    },
                    {
                      label: 'Contrast',
                      key: 'contrast' as const,
                      min: 50,
                      max: 160,
                      unit: '%',
                    },
                    {
                      label: 'Saturation',
                      key: 'saturation' as const,
                      min: 0,
                      max: 200,
                      unit: '%',
                    },
                    {
                      label: 'Exposure',
                      key: 'exposure' as const,
                      min: 60,
                      max: 140,
                      unit: '%',
                    },
                    {
                      label: 'Warm Sepia Tone',
                      key: 'sepia' as const,
                      min: 0,
                      max: 100,
                      unit: '%',
                    },
                    {
                      label: 'Hue Shift',
                      key: 'hueRotate' as const,
                      min: -180,
                      max: 180,
                      unit: '°',
                    },
                    {
                      label: 'Soft Blur',
                      key: 'blurPx' as const,
                      min: 0,
                      max: 12,
                      unit: 'px',
                    },
                    {
                      label: 'Ambient Spotlight',
                      key: 'goldGlow' as const,
                      min: 0,
                      max: 100,
                      unit: '%',
                    },
                    {
                      label: 'Edge Vignette',
                      key: 'vignette' as const,
                      min: 0,
                      max: 100,
                      unit: '%',
                    },
                  ].map((ctrl) => (
                    <div key={ctrl.key}>
                      <div className="flex items-center justify-between text-neutral-300 mb-1">
                        <span>{ctrl.label}</span>
                        <span className="font-mono-tabular text-[#F3D068]">
                          {studio[ctrl.key]}
                          {ctrl.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        value={studio[ctrl.key]}
                        onChange={(e) =>
                          setStudio((prev) => ({
                            ...prev,
                            [ctrl.key]: Number(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 3: TEMPLATE, PRE-MADE POSTER UPLOAD & AUTO-LAYOUTS
               =============================================================== */}
            {rightTab === 'LAYOUT' && (
              <div className="space-y-4">
                {/* Upload Pre-Made Poster Section */}
                <div className="p-3.5 rounded-xl bg-[#141A29] border border-indigo-500/50 space-y-3">
                  <div className="font-semibold text-indigo-300 uppercase tracking-wider">
                    Pre-Made Poster Upload (ImgBB Hosted)
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Already designed a poster in Photoshop/Canva? Upload it here to use as the full poster or edit on top of it.
                  </p>
                  <label className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow">
                    <Upload className="w-4 h-4" />
                    <span>
                      {uploadingAsset
                        ? 'Uploading to ImgBB...'
                        : 'Upload Pre-Made Poster Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadPreMadeBasePoster}
                    />
                  </label>

                  {studio.customBgUrl && (
                    <div className="space-y-2 pt-2 border-t border-neutral-800">
                      <div className="flex items-center justify-between text-neutral-300">
                        <span>Uploaded Poster Opacity</span>
                        <span>{studio.customBgOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={studio.customBgOpacity}
                        onChange={(e) =>
                          setStudio((prev) => ({
                            ...prev,
                            customBgOpacity: Number(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          pushHistory(
                            {
                              ...studio,
                              customBgUrl: null,
                              bgTheme: 'BOTANICAL_BLUSH',
                              showCompartmentBoxes: true,
                              showHeaderLockup: true,
                            },
                            'Removed Uploaded Background'
                          )
                        }
                        className="w-full py-1.5 rounded bg-red-950/60 text-red-300 border border-red-800/50 cursor-pointer"
                      >
                        Remove Uploaded Poster & Restore Official Template
                      </button>
                    </div>
                  )}
                </div>

                {/* Theme & Compartment Toggles */}
                <div className="p-3.5 rounded-xl bg-[#11141E] border border-neutral-800 space-y-3">
                  <div className="font-semibold text-[#F3D068] uppercase tracking-wider">
                    Poster Template Styles & Color Schemes (20 Templates)
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                    {(
                      [
                        // 1-5: AI-Generated Ornate Artwork Master Templates
                        {
                          id: 'AI_ISLAMIC_ILLUMINATION',
                          label: '✨ AI Islamic Gold Manuscript',
                          sub: 'AI-Generated 24K Arabesque & Marble',
                          titleCol: '#FDE047',
                          frameShape: 'ARCH',
                          isAi: true,
                        },
                        {
                          id: 'AI_EMERALD_MIHRAB',
                          label: '🕌 AI Emerald Mihrab Arch',
                          sub: 'AI-Generated Malachite & Gold Filigree',
                          titleCol: '#A7F3D0',
                          frameShape: 'ARCH',
                          isAi: true,
                        },
                        {
                          id: 'AI_ROYAL_SAPPHIRE',
                          label: '👑 AI Sapphire Royal Award',
                          sub: 'AI-Generated Deep Blue Satin & Gold',
                          titleCol: '#93C5FD',
                          frameShape: 'ROUNDED',
                          isAi: true,
                        },
                        {
                          id: 'AI_VINTAGE_BOTANICAL',
                          label: '🌹 AI Botanical Parchment',
                          sub: 'AI-Generated Watercolor Floral Corners',
                          titleCol: '#7C2D12',
                          frameShape: 'ROUNDED',
                          isAi: true,
                        },
                        {
                          id: 'AI_BAROQUE_CRIMSON',
                          label: '⚜️ AI Baroque Ruby Velvet',
                          sub: 'AI-Generated Imperial Crown & Gold Leaf',
                          titleCol: '#FECDD3',
                          frameShape: 'ARCH',
                          isAi: true,
                        },
                        // 6-20: Modern, Classical & Vibrant Vector Styled Templates
                        {
                          id: 'BOTANICAL_BLUSH',
                          label: '🌸 Botanical Blush',
                          sub: 'Rose & Warm Cream Watercolor',
                          titleCol: '#7A4938',
                          frameShape: 'ROUNDED',
                          isAi: false,
                        },
                        {
                          id: 'OBSIDIAN_GOLD',
                          label: '🏆 Obsidian & Gold',
                          sub: 'Royal Black & 24K Gold Spotlight',
                          titleCol: '#FFFFFF',
                          frameShape: 'ROUNDED',
                          isAi: false,
                        },
                        {
                          id: 'ROYAL_NAVY',
                          label: '⚓ Royal Navy & Gold',
                          sub: 'Deep Oceanic Blue & Classical Arch',
                          titleCol: '#FFFFFF',
                          frameShape: 'ARCH',
                          isAi: false,
                        },
                        {
                          id: 'IMPERIAL_EMERALD',
                          label: '🌿 Imperial Emerald',
                          sub: 'Jade & Forest Luxury Gold',
                          titleCol: '#FFFFFF',
                          frameShape: 'ROUNDED',
                          isAi: false,
                        },
                        {
                          id: 'VELVET_CRIMSON',
                          label: '🍷 Velvet Crimson',
                          sub: 'Ruby & Rose Gold Ceremony',
                          titleCol: '#FFFFFF',
                          frameShape: 'ARCH',
                          isAi: false,
                        },
                        {
                          id: 'CYBER_NEON_AZURE',
                          label: '⚡ Cyber Neon Azure',
                          sub: 'Electric Cyan & Indigo Glow',
                          titleCol: '#38BDF8',
                          frameShape: 'SQUARE',
                          isAi: false,
                        },
                        {
                          id: 'ROYAL_AMETHYST',
                          label: '🔮 Royal Amethyst',
                          sub: 'Regal Violet & Lilac Medallion',
                          titleCol: '#E9D5FF',
                          frameShape: 'CIRCLE',
                          isAi: false,
                        },
                        {
                          id: 'DESERT_SANDSTONE',
                          label: '🏜️ Desert Sandstone',
                          sub: 'Warm Ivory & Terracotta Arch',
                          titleCol: '#7C2D12',
                          frameShape: 'ARCH',
                          isAi: false,
                        },
                        {
                          id: 'ARCTIC_FROST_SLATE',
                          label: '❄️ Arctic Frost Slate',
                          sub: 'Ice Blue & Charcoal Slate',
                          titleCol: '#E0F2FE',
                          frameShape: 'ROUNDED',
                          isAi: false,
                        },
                        {
                          id: 'SUNSET_AMBER_CORAL',
                          label: '🌅 Sunset Amber Coral',
                          sub: 'Sunburst Copper & Tangerine',
                          titleCol: '#FFEDD5',
                          frameShape: 'ROUNDED',
                          isAi: false,
                        },
                        {
                          id: 'TURQUOISE_PERSIAN',
                          label: '💎 Turquoise Persian Tile',
                          sub: 'Persian Cyan & Mint Gold',
                          titleCol: '#2DD4BF',
                          frameShape: 'ROUNDED',
                          isAi: false,
                        },
                        {
                          id: 'MAJESTIC_MARBLE_GOLD',
                          label: '🏛️ Majestic Black Marble',
                          sub: 'Anthracite Marble & Yellow Gold',
                          titleCol: '#FACC15',
                          frameShape: 'SQUARE',
                          isAi: false,
                        },
                        {
                          id: 'CELESTIAL_COSMIC_GOLD',
                          label: '🌌 Celestial Cosmic Gold',
                          sub: 'Deep Cosmos Nebula & Gold Star',
                          titleCol: '#FDE68A',
                          frameShape: 'CIRCLE',
                          isAi: false,
                        },
                        {
                          id: 'SAHARA_GOLDEN_OASIS',
                          label: '🐪 Sahara Golden Oasis',
                          sub: 'Warm Bronze & Deep Amber',
                          titleCol: '#FEF08A',
                          frameShape: 'ROUNDED',
                          isAi: false,
                        },
                        {
                          id: 'CHAMPAGNE_LUXE',
                          label: '🥂 Champagne Luxe Minimal',
                          sub: 'Light Champagne & Pearl White',
                          titleCol: '#78350F',
                          frameShape: 'ROUNDED',
                          isAi: false,
                        },
                        {
                          id: 'MIDNIGHT_TITANIUM',
                          label: '🛡️ Midnight Titanium',
                          sub: 'Sleek Monochrome Carbon & Silver',
                          titleCol: '#F1F5F9',
                          frameShape: 'SQUARE',
                          isAi: false,
                        },
                      ] as const
                    ).map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() =>
                          pushHistory(
                            {
                              ...studio,
                              bgTheme: th.id,
                              titleColor: th.titleCol,
                              frameShape: th.frameShape,
                            },
                            `Applied Template: ${th.label}`
                          )
                        }
                        className={`p-2 rounded-lg border text-left font-medium cursor-pointer transition-all relative ${
                          studio.bgTheme === th.id
                            ? 'bg-[#D4AF37]/25 border-[#D4AF37] text-[#F3D068] shadow-md ring-1 ring-[#D4AF37]/50'
                            : 'bg-[#090B10] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        {th.isAi && (
                          <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded bg-indigo-900/80 border border-indigo-500/60 text-[9px] font-bold text-indigo-200">
                            AI ART
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 font-bold text-xs truncate pr-10">
                          <span>{th.label}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 truncate">
                          {th.sub}
                        </div>
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center justify-between pt-2 text-neutral-300 cursor-pointer">
                    <span>Show 8 Category Compartment Boxes</span>
                    <input
                      type="checkbox"
                      checked={studio.showCompartmentBoxes}
                      onChange={(e) =>
                        setStudio((prev) => ({
                          ...prev,
                          showCompartmentBoxes: e.target.checked,
                        }))
                      }
                    />
                  </label>
                </div>

                {/* Auto-Arrange Layouts */}
                <div className="p-3.5 rounded-xl bg-[#11141E] border border-neutral-800 space-y-2.5">
                  <div className="font-semibold text-[#F3D068] uppercase tracking-wider">
                    Auto-Arrange Participant Cards
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      pushHistory(
                        {
                          ...studio,
                          canvasWidth: 1600,
                          canvasHeight: 1130,
                          showCompartmentBoxes: true,
                          cards: computeCompartmentCards(studio.cards),
                        },
                        'Arranged into Official 8 Compartments'
                      )
                    }
                    className="w-full py-2 px-3 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37] text-[#F3D068] font-bold cursor-pointer"
                  >
                    Arrange into Official 8 Compartments
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { cols: 3, label: '3-Column Grid' },
                      { cols: 4, label: '4-Column Grid' },
                      { cols: 5, label: '5-Column Grid' },
                      { cols: 6, label: '6-Column Compact' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          pushHistory(
                            {
                              ...studio,
                              showCompartmentBoxes: false,
                              cards: computeGridCards(
                                studio.cards,
                                preset.cols,
                                studio.canvasWidth
                              ),
                            },
                            `Arranged ${preset.label}`
                          )
                        }
                        className="p-2 rounded-lg bg-[#090B10] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Portrait Frame Style */}
                <div className="p-3.5 rounded-xl bg-[#11141E] border border-neutral-800 space-y-2.5">
                  <div className="font-semibold text-[#F3D068] uppercase tracking-wider">
                    Portrait Frame Shape
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'ROUNDED', label: 'Rounded Card' },
                        { id: 'CIRCLE', label: 'Circular Medallion' },
                        { id: 'ARCH', label: 'Classical Arch' },
                        { id: 'SQUARE', label: 'Sharp Square' },
                      ] as const
                    ).map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() =>
                          setStudio((prev) => ({
                            ...prev,
                            frameShape: sh.id,
                          }))
                        }
                        className={`p-2 rounded-lg border text-center cursor-pointer ${
                          studio.frameShape === sh.id
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3D068]'
                            : 'bg-[#090B10] border-neutral-800 text-neutral-300'
                        }`}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 4: INTERACTIVE PHOTOSHOP HISTORY STACK
               =============================================================== */}
            {rightTab === 'HISTORY' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-neutral-400 font-semibold uppercase tracking-wider">
                  <span>History States ({history.length + 1})</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={history.length === 0}
                      className="text-[#00D4FF] disabled:opacity-30 cursor-pointer"
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className="text-[#00D4FF] disabled:opacity-30 cursor-pointer"
                    >
                      Redo
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {history.map((snap, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const target = history[idx];
                        const after = history.slice(idx + 1);
                        setRedoStack([...after, studio, ...redoStack]);
                        setHistory(history.slice(0, idx));
                        setStudio(target);
                      }}
                      className="w-full p-2.5 rounded-lg bg-[#11141E] hover:bg-neutral-800 border border-neutral-800 text-left flex items-center justify-between text-neutral-300 cursor-pointer"
                    >
                      <span>
                        #{idx + 1} · {snap.historyLabel}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        Restore
                      </span>
                    </button>
                  ))}
                  <div className="p-2.5 rounded-lg bg-[#162038] border border-[#00D4FF] text-white font-semibold flex items-center justify-between">
                    <span>Current: {studio.historyLabel}</span>
                    <span className="text-[10px] text-[#00D4FF]">Active</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* =====================================================================
          SHARE TO FEED MODAL INSIDE STUDIO
         ===================================================================== */}
      {showFeedPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0E1118] border border-[#D4AF37]/50 p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white">
              Share Class {poster.classCode} Poster to Public Feed
            </h3>
            <p className="text-xs text-neutral-400">
              Exports your edited high-resolution poster, uploads it to ImgBB, and publishes it to the Class {poster.classCode} Feed.
            </p>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">
                Feed Post Caption
              </label>
              <textarea
                rows={3}
                value={feedCaption}
                onChange={(e) => setFeedCaption(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#12151F] border border-neutral-700 text-xs text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFeedPrompt(false)}
                className="px-4 py-2 rounded-lg bg-neutral-900 text-xs text-neutral-300 border border-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={postingFeed}
                onClick={handleTriggerPostToFeed}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-neutral-950 font-bold text-xs cursor-pointer"
              >
                {postingFeed ? 'Publishing...' : 'Publish to Feed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
