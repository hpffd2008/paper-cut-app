import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors, Pencil, Eraser, Undo2, Redo2, Save, Share2,
  Palette, Settings, Volume2, VolumeX, Users, Sparkles,
  ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut,
  RotateCcw, Layers, Grid3X3, BookOpen, FlipHorizontal2, Flower2,
  Maximize, X, Check
} from 'lucide-react';
import { useCanvasStore, getTemplates, Template } from '../store/canvasStore';
import { useUserStore } from '../store/userStore';
import TuanHuaStudio from './TuanHuaStudio';

type StudioMode = 'single' | 'double' | 'tuanhua';
const STUDIO_TABS: { id: StudioMode; label: string; icon: any; desc: string }[] = [
  { id: 'single', label: '单剪', icon: Scissors, desc: '自由剪裁' },
  { id: 'double', label: '对折', icon: FlipHorizontal2, desc: '左右对称' },
  { id: 'tuanhua', label: '团花', icon: Flower2, desc: '多角对称' },
];

interface Point { x: number; y: number }
type FullscreenModeType = 'draw' | 'cut';

const CANVAS_W = 600;
const CANVAS_H = 600;
const CLOSE_THRESHOLD = 20;
const MAX_SNAPSHOTS = 60;

const paperColors = [
  { name: '中国红', color: '#c62828' },
  { name: '金黄', color: '#ffc107' },
  { name: '墨黑', color: '#212121' },
  { name: '翠绿', color: '#2e7d32' },
  { name: '宝蓝', color: '#1565c0' },
  { name: '紫罗兰', color: '#7b1fa2' },
  { name: '橙色', color: '#ef6c00' },
  { name: '粉红', color: '#d81b60' },
];

const backgrounds = [
  { name: '无背景', value: 'none', preview: 'bg-gray-100' },
  { name: '宣纸', value: 'paper', preview: 'bg-amber-50' },
  { name: '木纹', value: 'wood', preview: 'bg-amber-800' },
  { name: '水墨', value: 'ink', preview: 'bg-gradient-to-br from-gray-200 to-gray-400' },
  { name: '喜庆', value: 'festive', preview: 'bg-gradient-to-br from-red-500 to-yellow-500' },
];

/* helpers */
function dist(a: Point, b: Point) { return Math.hypot(a.x - b.x, a.y - b.y); }
function isOnEdge(p: Point) { return p.x <= 1 || p.y <= 1 || p.x >= CANVAS_W - 1 || p.y >= CANVAS_H - 1; }
function clampPoint(p: Point): Point { return { x: Math.max(0, Math.min(CANVAS_W, p.x)), y: Math.max(0, Math.min(CANVAS_H, p.y)) }; }

/* ------------------------------------------------------------------ */
export default function Studio() {
  const [studioMode, setStudioMode] = useState<StudioMode>('single');
  if (studioMode === 'tuanhua') return <div><StudioTabs mode={studioMode} setMode={setStudioMode} /><TuanHuaStudio /></div>;
  if (studioMode === 'double') return <div><StudioTabs mode={studioMode} setMode={setStudioMode} /><DuiZheStudio /></div>;
  return <SingleFoldStudio studioMode={studioMode} setStudioMode={setStudioMode} />;
}

function StudioTabs({ mode, setMode }: { mode: StudioMode; setMode: (m: StudioMode) => void }) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 pt-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-0">
          {STUDIO_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = mode === tab.id;
            return (
              <button key={tab.id} onClick={() => setMode(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl font-medium transition-all text-sm ${active ? 'bg-white text-red-700 shadow-lg border-b-0' : 'bg-white/50 text-gray-500 hover:bg-white/80 hover:text-red-600'}`}>
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className="text-xs opacity-60 hidden sm:inline">({tab.desc})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DuiZheStudio() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
      <div className="text-center p-12 bg-white rounded-2xl shadow-lg">
        <FlipHorizontal2 className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">对折模式</h2>
        <p className="text-gray-400">即将上线，敬请期待…</p>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  SingleFoldStudio – main component                               */
/* ================================================================ */
function SingleFoldStudio({ studioMode, setStudioMode }: { studioMode: StudioMode; setStudioMode: (m: StudioMode) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const snapshotsRef = useRef<ImageData[]>([]);
  const snapIdxRef = useRef(0);
  const pointsRef = useRef<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [historyLen, setHistoryLen] = useState(1);
  const [historyIdx, setHistoryIdx] = useState(0);

  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCultureInfo, setShowCultureInfo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cutAnimation, setCutAnimation] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedBackground, setSelectedBackground] = useState('none');
  const [publishModal, setPublishModal] = useState(false);
  const [publishNotes, setPublishNotes] = useState('');

  /* NEW states */
  const [showPreview, setShowPreview] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [fullscreenMode, setFullscreenMode] = useState<FullscreenModeType | null>(null);
  const [showFinishResult, setShowFinishResult] = useState(false);
  const [finishResultType, setFinishResultType] = useState<'yinke' | 'yangke' | 'yinyangke'>('yinke');
  const [finishDataUrls, setFinishDataUrls] = useState<{ yinke: string; yangke: string; yinyangke: string }>({ yinke: '', yangke: '', yinyangke: '' });
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const fsOverlayRef = useRef<HTMLCanvasElement>(null);
  const fsOffscreenRef = useRef<HTMLCanvasElement | null>(null);
  const fsSnapshotsRef = useRef<ImageData[]>([]);
  const fsSnapIdxRef = useRef(0);
  const fsPointsRef = useRef<Point[]>([]);
  const [fsIsDrawing, setFsIsDrawing] = useState(false);
  const [fsHistoryLen, setFsHistoryLen] = useState(1);
  const [fsHistoryIdx, setFsHistoryIdx] = useState(0);
  const [fsZoom, setFsZoom] = useState(1);
  const [smoothCurves, setSmoothCurves] = useState(false);
  const fsWrapRef = useRef<HTMLDivElement>(null);

  const {
    tool, strokeWidth, strokeColor, paperColor, paperThickness, selectedTemplate,
    setTool, setStrokeWidth, setStrokeColor, setPaperColor, setPaperThickness, setTemplate
  } = useCanvasStore();
  const { isLoggedIn, addWork } = useUserStore();
  const templates = getTemplates();

  /* ---- offscreen bootstrap ---- */
  useEffect(() => {
    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = CANVAS_W; off.height = CANVAS_H;
      offscreenRef.current = off;
    }
    drawInitialPaper();
  }, []);

  useEffect(() => {
    if (snapshotsRef.current.length <= 1) drawInitialPaper();
  }, [paperColor]);

  const drawInitialPaper = useCallback(() => {
    const off = offscreenRef.current;
    if (!off) return;
    const ctx = off.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = paperColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < CANVAS_W; i += 3) {
      for (let j = 0; j < CANVAS_H; j += 3) {
        if (Math.random() > 0.65) {
          ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1;
    if (selectedTemplate) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      const path = new Path2D(selectedTemplate.svgPath);
      ctx.stroke(path);
      ctx.setLineDash([]);
    }
    const snap = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    snapshotsRef.current = [snap];
    snapIdxRef.current = 0;
    setHistoryLen(1);
    setHistoryIdx(0);
    syncVisible();
  }, [paperColor, selectedTemplate]);

  const syncVisible = useCallback(() => {
    const canvas = canvasRef.current;
    const off = offscreenRef.current;
    if (!canvas || !off) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(off, 0, 0);
  }, []);

  /* ---- snapshots ---- */
  const saveSnapshot = useCallback(() => {
    const off = offscreenRef.current;
    if (!off) return;
    const ctx = off.getContext('2d')!;
    const snap = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const arr = snapshotsRef.current.slice(0, snapIdxRef.current + 1);
    arr.push(snap);
    if (arr.length > MAX_SNAPSHOTS) arr.shift();
    snapshotsRef.current = arr;
    snapIdxRef.current = arr.length - 1;
    setHistoryLen(arr.length);
    setHistoryIdx(arr.length - 1);
  }, []);

  const handleUndo = useCallback(() => {
    if (snapIdxRef.current <= 0) return;
    snapIdxRef.current -= 1;
    offscreenRef.current!.getContext('2d')!.putImageData(snapshotsRef.current[snapIdxRef.current], 0, 0);
    setHistoryIdx(snapIdxRef.current);
    syncVisible();
  }, [syncVisible]);

  const handleRedo = useCallback(() => {
    if (snapIdxRef.current >= snapshotsRef.current.length - 1) return;
    snapIdxRef.current += 1;
    offscreenRef.current!.getContext('2d')!.putImageData(snapshotsRef.current[snapIdxRef.current], 0, 0);
    setHistoryIdx(snapIdxRef.current);
    syncVisible();
  }, [syncVisible]);

  const handleClearCanvas = useCallback(() => {
    // Clear template selection first so the paper is fully clean
    setTemplate(null);
    // Force redraw plain paper without template
    const off = offscreenRef.current;
    if (!off) return;
    const ctx = off.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = paperColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < CANVAS_W; i += 3) {
      for (let j = 0; j < CANVAS_H; j += 3) {
        if (Math.random() > 0.65) {
          ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1;
    const snap = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    snapshotsRef.current = [snap];
    snapIdxRef.current = 0;
    setHistoryLen(1);
    setHistoryIdx(0);
    syncVisible();
  }, [paperColor, setTemplate, syncVisible]);

  /* ---- coordinates ---- */
  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      let cx: number, cy: number;
      if ('touches' in e) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
      else { cx = e.clientX; cy = e.clientY; }
      return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
    }, []);

  /* ---- cursor overlay (FEAT-1) ---- */
  const drawCursorOverlay = useCallback((pt: Point | null) => {
    const ov = overlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    if (!pt) return;
    const size = tool === 'eraser' ? strokeWidth * 2 : tool === 'scissors' ? 10 : strokeWidth;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = tool === 'eraser' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)';
    ctx.fill();
    if (tool === 'scissors') {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pt.x - 14, pt.y); ctx.lineTo(pt.x + 14, pt.y);
      ctx.moveTo(pt.x, pt.y - 14); ctx.lineTo(pt.x, pt.y + 14);
      ctx.stroke();
    }
    ctx.restore();
  }, [tool, strokeWidth]);

  /* ---- drawing handlers (FEAT-1, FEAT-2) ---- */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    pointsRef.current = [pt];
    if (tool === 'eraser') {
      const off = offscreenRef.current!;
      const ctx = off.getContext('2d')!;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, strokeWidth * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      syncVisible();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    drawCursorOverlay(pt);
    if (!isDrawing || !pt) return;
    const pts = pointsRef.current;
    pts.push(pt);

    if (tool === 'pencil') {
      const off = offscreenRef.current!;
      const ctx = off.getContext('2d')!;
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const prev = pts[pts.length - 2];
      if (smoothCurves && pts.length >= 4) {
        // Catmull-Rom smoothing: use last 4 points
        const p0 = pts[pts.length - 4] || prev;
        const p1 = pts[pts.length - 3] || prev;
        const p2 = pts[pts.length - 2];
        const p3 = pt;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
      }
      syncVisible();
    } else if (tool === 'eraser') {
      const off = offscreenRef.current!;
      const ctx = off.getContext('2d')!;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      const prev = pts[pts.length - 2];
      ctx.lineWidth = strokeWidth * 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
      ctx.restore();
      syncVisible();
    } else if (tool === 'scissors') {
      syncVisible();
      const vis = canvasRef.current!;
      const ctx = vis.getContext('2d')!;
      ctx.save();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.restore();
      const first = pts[0]; const last = pts[pts.length - 1];
      if (pts.length > 10 && dist(first, last) < CLOSE_THRESHOLD * 2) {
        ctx.save(); ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(first.x, first.y, CLOSE_THRESHOLD, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pts = pointsRef.current;
    if (pts.length < 2) { pointsRef.current = []; return; }
    if (tool === 'pencil' || tool === 'eraser') {
      saveSnapshot(); syncVisible();
    } else if (tool === 'scissors') {
      const first = pts[0]; const last = pts[pts.length - 1];
      const startOnEdge = isOnEdge(first); const endOnEdge = isOnEdge(last);
      const isClosed = (pts.length > 10 && dist(first, last) < CLOSE_THRESHOLD) || (startOnEdge && endOnEdge);
      if (isClosed && pts.length > 5) { applyCut(pts, startOnEdge && endOnEdge); saveSnapshot(); }
      syncVisible();
    }
    pointsRef.current = [];
  };

  /* FEAT-1: don't stop drawing on mouse leave */
  const handleMouseLeave = () => {
    drawCursorOverlay(null);
    // don't call handleMouseUp — allow strokes to continue after re-enter
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); handleMouseDown(e as any); };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); handleMouseMove(e as any); };
  const handleTouchEnd = () => handleMouseUp();

  /* ---- scissors cut ---- */
  function polygonArea(poly: Point[]): number {
    let area = 0;
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      area += poly[i].x * poly[j].y;
      area -= poly[j].x * poly[i].y;
    }
    return Math.abs(area) / 2;
  }

  function getEdge(p: Point): number {
    if (p.y <= 1) return 0; if (p.x >= CANVAS_W - 1) return 1; if (p.y >= CANVAS_H - 1) return 2; return 3;
  }

  function traceEdgeCW(eFrom: number, eTo: number): Point[] {
    const corners: Point[] = [{ x: 0, y: 0 }, { x: CANVAS_W, y: 0 }, { x: CANVAS_W, y: CANVAS_H }, { x: 0, y: CANVAS_H }];
    const result: Point[] = [];
    let e = eFrom;
    while (e !== eTo) { result.push(corners[e]); e = (e + 1) % 4; }
    return result;
  }

  function traceEdgeCCW(eFrom: number, eTo: number): Point[] {
    const corners: Point[] = [{ x: 0, y: 0 }, { x: CANVAS_W, y: 0 }, { x: CANVAS_W, y: CANVAS_H }, { x: 0, y: CANVAS_H }];
    const result: Point[] = [];
    let e = eFrom;
    while (e !== eTo) { e = (e + 3) % 4; result.push(corners[e]); }
    return result;
  }

  const applyCut = useCallback((pts: Point[], edgeClosed: boolean) => {
    const off = offscreenRef.current!;
    const ctx = off.getContext('2d')!;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    if (edgeClosed) {
      const clamped = pts.map(clampPoint);
      const eA = getEdge(clamped[clamped.length - 1]);
      const eB = getEdge(clamped[0]);
      if (eA === eB) {
        // Same edge - just close the polygon directly
        ctx.beginPath(); ctx.moveTo(clamped[0].x, clamped[0].y);
        for (let i = 1; i < clamped.length; i++) ctx.lineTo(clamped[i].x, clamped[i].y);
        ctx.closePath(); ctx.fill();
      } else {
        // Build both possible polygons and pick the SMALLER one
        const cwCorners = traceEdgeCW(eA, eB);
        const ccwCorners = traceEdgeCCW(eA, eB);

        const buildPoly = (corners: Point[]): Point[] => {
          const poly = [...clamped];
          for (const c of corners) poly.push(c);
          return poly;
        };
        const polyCW = buildPoly(cwCorners);
        const polyCCW = buildPoly(ccwCorners);
        const areaCW = polygonArea(polyCW);
        const areaCCW = polygonArea(polyCCW);
        const chosenPoly = areaCW <= areaCCW ? polyCW : polyCCW;

        ctx.beginPath(); ctx.moveTo(chosenPoly[0].x, chosenPoly[0].y);
        for (let i = 1; i < chosenPoly.length; i++) ctx.lineTo(chosenPoly[i].x, chosenPoly[i].y);
        ctx.closePath(); ctx.fill();
      }
    } else {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath(); ctx.fill();
    }
    ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }, []);

  /* ---- misc ---- */
  const speakCultureInfo = () => {
    if (selectedTemplate?.voiceDescription && 'speechSynthesis' in window) {
      if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
      else {
        const u = new SpeechSynthesisUtterance(selectedTemplate.voiceDescription);
        u.lang = 'zh-CN'; u.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u); setIsSpeaking(true);
      }
    }
  };

  const handlePublish = () => {
    if (!isLoggedIn) { alert('请先登录'); return; }
    addWork({
      id: Date.now().toString(), title: selectedTemplate?.name || '我的剪纸作品',
      imageUrl: canvasRef.current?.toDataURL() || '', createdAt: new Date(),
      likes: 0, comments: 0, complexity: Math.max(1, Math.min(10, historyIdx * 0.8)),
      background: selectedBackground, notes: publishNotes,
    });
    setPublishModal(false); setPublishNotes(''); alert('作品发布成功！');
  };

  const toolList = [
    { id: 'pencil' as const, icon: Pencil, label: '画笔' },
    { id: 'scissors' as const, icon: Scissors, label: '剪刀' },
    { id: 'eraser' as const, icon: Eraser, label: '橡皮' },
  ];

  /* ---- Fullscreen Mode ---- */
  const FS_W = CANVAS_W; const FS_H = CANVAS_H;

  const initFullscreenCanvas = useCallback(() => {
    if (!fsOffscreenRef.current) {
      const c = document.createElement('canvas');
      c.width = FS_W; c.height = FS_H;
      fsOffscreenRef.current = c;
    }
    const ctx = fsOffscreenRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, FS_W, FS_H);
    // Fill with paper color + texture
    ctx.fillStyle = paperColor;
    ctx.fillRect(0, 0, FS_W, FS_H);
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < FS_W; i += 3) {
      for (let j = 0; j < FS_H; j += 3) {
        if (Math.random() > 0.65) {
          ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1;
    const snap = ctx.getImageData(0, 0, FS_W, FS_H);
    fsSnapshotsRef.current = [snap]; fsSnapIdxRef.current = 0;
    setFsHistoryLen(1); setFsHistoryIdx(0);
    syncFsVisible();
  }, [paperColor]);

  const finishResultTypeRef = useRef<'yinke' | 'yangke' | 'yinyangke'>('yinke');

  const syncFsVisible = useCallback(() => {
    const c = fullscreenCanvasRef.current;
    const off = fsOffscreenRef.current;
    if (!c || !off) return;
    const ctx = c.getContext('2d')!;
    const image = off.getContext('2d')!.getImageData(0, 0, FS_W, FS_H);
    ctx.putImageData(image, 0, 0);
  }, []);

  const syncMainToFs = useCallback(() => {
    const srcOff = offscreenRef.current;
    const dstOff = fsOffscreenRef.current;
    if (!srcOff || !dstOff) return;
    const srcData = srcOff.getContext('2d')!.getImageData(0, 0, CANVAS_W, CANVAS_H);
    dstOff.getContext('2d')!.putImageData(srcData, 0, 0);
  }, []);

  const syncFsToMain = useCallback(() => {
    const srcOff = fsOffscreenRef.current;
    const dstOff = offscreenRef.current;
    if (!srcOff || !dstOff) return;
    const srcData = srcOff.getContext('2d')!.getImageData(0, 0, FS_W, FS_H);
    dstOff.getContext('2d')!.putImageData(srcData, 0, 0);
    syncVisible();
    saveSnapshot();
  }, [saveSnapshot, syncVisible]);

  /* Render engraving style preview on the visible canvas */
  const renderEngravingPreview = useCallback((mode: 'yinke' | 'yangke' | 'yinyangke') => {
    const c = fullscreenCanvasRef.current;
    const off = fsOffscreenRef.current;
    if (!c || !off) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, FS_W, FS_H);

    if (mode === 'yinke') {
      // 阴刻: background paper preserved, pattern/design is cut away (hollow)
      ctx.drawImage(off, 0, 0);
    } else if (mode === 'yangke') {
      // 阳刻: pattern preserved, background is removed
      const tmp = document.createElement('canvas');
      tmp.width = FS_W; tmp.height = FS_H;
      const tctx = tmp.getContext('2d')!;
      tctx.fillStyle = paperColor;
      tctx.fillRect(0, 0, FS_W, FS_H);
      tctx.globalCompositeOperation = 'destination-out';
      tctx.drawImage(off, 0, 0);
      // Draw on a light background for visibility
      ctx.fillStyle = '#faf6f0';
      ctx.fillRect(0, 0, FS_W, FS_H);
      ctx.drawImage(tmp, 0, 0);
    } else {
      // 阴阳刻: combination of both - paper + contrasting fill in cut areas
      // Background with warm tone
      ctx.fillStyle = '#fdf5e6';
      ctx.fillRect(0, 0, FS_W, FS_H);
      // Draw yangke (cut areas) with gold-brown contrasting shade
      const tmpYang = document.createElement('canvas');
      tmpYang.width = FS_W; tmpYang.height = FS_H;
      const yctx = tmpYang.getContext('2d')!;
      yctx.fillStyle = '#c9963a';
      yctx.fillRect(0, 0, FS_W, FS_H);
      yctx.globalCompositeOperation = 'destination-out';
      yctx.drawImage(off, 0, 0);
      ctx.drawImage(tmpYang, 0, 0);
      // Draw yinke (remaining paper) on top
      ctx.drawImage(off, 0, 0);
    }
  }, [paperColor]);

  const saveFsSnapshot = useCallback(() => {
    const off = fsOffscreenRef.current;
    if (!off) return;
    const snap = off.getContext('2d')!.getImageData(0, 0, FS_W, FS_H);
    const arr = fsSnapshotsRef.current.slice(0, fsSnapIdxRef.current + 1);
    arr.push(snap);
    if (arr.length > MAX_SNAPSHOTS) arr.shift();
    fsSnapshotsRef.current = arr;
    fsSnapIdxRef.current = arr.length - 1;
    setFsHistoryLen(arr.length); setFsHistoryIdx(arr.length - 1);
  }, []);

  const openFullscreenByTool = useCallback(() => {
    const mode: FullscreenModeType = tool === 'scissors' ? 'cut' : 'draw';
    setFullscreenMode(mode);
    setFsZoom(1);
    setTimeout(() => {
      initFullscreenCanvas();
      syncMainToFs();
      syncFsVisible();
      saveFsSnapshot();
      if (mode === 'cut') renderEngravingPreview(finishResultTypeRef.current);
    }, 50);
  }, [initFullscreenCanvas, renderEngravingPreview, saveFsSnapshot, syncFsVisible, syncMainToFs, tool]);

  const closeFullscreen = useCallback(() => {
    syncFsToMain();
    setFullscreenMode(null);
  }, [syncFsToMain]);

  const handleFsUndo = useCallback(() => {
    if (fsSnapIdxRef.current <= 0) return;
    fsSnapIdxRef.current -= 1;
    fsOffscreenRef.current!.getContext('2d')!.putImageData(fsSnapshotsRef.current[fsSnapIdxRef.current], 0, 0);
    setFsHistoryIdx(fsSnapIdxRef.current); syncFsVisible();
  }, [syncFsVisible]);

  const handleFsRedo = useCallback(() => {
    if (fsSnapIdxRef.current >= fsSnapshotsRef.current.length - 1) return;
    fsSnapIdxRef.current += 1;
    fsOffscreenRef.current!.getContext('2d')!.putImageData(fsSnapshotsRef.current[fsSnapIdxRef.current], 0, 0);
    setFsHistoryIdx(fsSnapIdxRef.current); syncFsVisible();
  }, [syncFsVisible]);

  const handleFsClear = useCallback(() => {
    initFullscreenCanvas();
    syncFsToMain();
  }, [initFullscreenCanvas, syncFsToMain]);

  function fsIsOnEdge(p: Point) { return p.x <= 1 || p.y <= 1 || p.x >= FS_W - 1 || p.y >= FS_H - 1; }
  function fsClampPoint(p: Point): Point { return { x: Math.max(0, Math.min(FS_W, p.x)), y: Math.max(0, Math.min(FS_H, p.y)) }; }
  function getFsEdge(p: Point): number {
    if (p.y <= 1) return 0; if (p.x >= FS_W - 1) return 1; if (p.y >= FS_H - 1) return 2; return 3;
  }
  function traceFsEdgeCW(eFrom: number, eTo: number): Point[] {
    const corners: Point[] = [{ x: 0, y: 0 }, { x: FS_W, y: 0 }, { x: FS_W, y: FS_H }, { x: 0, y: FS_H }];
    const result: Point[] = []; let e = eFrom;
    while (e !== eTo) { result.push(corners[e]); e = (e + 1) % 4; }
    return result;
  }
  function traceFsEdgeCCW(eFrom: number, eTo: number): Point[] {
    const corners: Point[] = [{ x: 0, y: 0 }, { x: FS_W, y: 0 }, { x: FS_W, y: FS_H }, { x: 0, y: FS_H }];
    const result: Point[] = []; let e = eFrom;
    while (e !== eTo) { e = (e + 3) % 4; result.push(corners[e]); }
    return result;
  }

  const applyFsCut = useCallback((pts: Point[], edgeClosed: boolean) => {
    const off = fsOffscreenRef.current!;
    const ctx = off.getContext('2d')!;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    if (edgeClosed) {
      const clamped = pts.map(fsClampPoint);
      const eA = getFsEdge(clamped[clamped.length - 1]);
      const eB = getFsEdge(clamped[0]);
      if (eA === eB) {
        ctx.beginPath(); ctx.moveTo(clamped[0].x, clamped[0].y);
        for (let i = 1; i < clamped.length; i++) ctx.lineTo(clamped[i].x, clamped[i].y);
        ctx.closePath(); ctx.fill();
      } else {
        const cwCorners = traceFsEdgeCW(eA, eB);
        const ccwCorners = traceFsEdgeCCW(eA, eB);
        const buildPoly = (corners: Point[]): Point[] => {
          const poly = [...clamped]; for (const c of corners) poly.push(c); return poly;
        };
        const polyCW = buildPoly(cwCorners);
        const polyCCW = buildPoly(ccwCorners);
        const areaCW = polygonArea(polyCW);
        const areaCCW = polygonArea(polyCCW);
        const chosenPoly = areaCW <= areaCCW ? polyCW : polyCCW;
        ctx.beginPath(); ctx.moveTo(chosenPoly[0].x, chosenPoly[0].y);
        for (let i = 1; i < chosenPoly.length; i++) ctx.lineTo(chosenPoly[i].x, chosenPoly[i].y);
        ctx.closePath(); ctx.fill();
      }
    } else {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath(); ctx.fill();
    }
    ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }, []);

  const getFsCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
      const canvas = fullscreenCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      let cx: number, cy: number;
      if ('touches' in e) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
      else { cx = e.clientX; cy = e.clientY; }
      return { x: (cx - rect.left) * (FS_W / rect.width), y: (cy - rect.top) * (FS_H / rect.height) };
    }, []);

  const drawFsCursorOverlay = useCallback((pt: Point | null) => {
    const ov = fsOverlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext('2d')!;
    ctx.clearRect(0, 0, FS_W, FS_H);
    if (!pt) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pt.x - 14, pt.y); ctx.lineTo(pt.x + 14, pt.y);
    ctx.moveTo(pt.x, pt.y - 14); ctx.lineTo(pt.x, pt.y + 14);
    ctx.stroke();
    ctx.restore();
  }, []);

  const handleFsDrawMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getFsCanvasPoint(e);
    if (!pt) return;
    setFsIsDrawing(true);
    fsPointsRef.current = [pt];
    if (tool === 'eraser') {
      const off = fsOffscreenRef.current!;
      const ctx = off.getContext('2d')!;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, strokeWidth * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      syncFsVisible();
    }
  };

  const handleFsDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getFsCanvasPoint(e);
    drawFsCursorOverlay(pt);
    if (!fsIsDrawing || !pt) return;
    const pts = fsPointsRef.current;
    pts.push(pt);
    const off = fsOffscreenRef.current!;
    const ctx = off.getContext('2d')!;
    const prev = pts[pts.length - 2];
    if (tool === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
    syncFsVisible();
  };

  const handleFsDrawMouseUp = () => {
    if (!fsIsDrawing) return;
    setFsIsDrawing(false);
    const pts = fsPointsRef.current;
    if (pts.length >= 2) saveFsSnapshot();
    fsPointsRef.current = [];
  };

  const handleFsDrawMouseLeave = () => {
    drawFsCursorOverlay(null);
  };

  /* ---- Fullscreen wrapping-div mouse handlers (TASK-3: allow cutting from outside paper) ---- */
  const getFsWrapCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): Point | null => {
      const canvas = fullscreenCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (FS_W / rect.width),
        y: (e.clientY - rect.top) * (FS_H / rect.height),
      };
    }, []);

  function isInsidePaper(pt: Point): boolean {
    return pt.x >= 0 && pt.x <= FS_W && pt.y >= 0 && pt.y <= FS_H;
  }

  /** Build rectangular boundary points for paper [0,0]-[FS_W,FS_H] */
  function paperBoundaryPoints(steps = 60): Point[] {
    const pts: Point[] = [];
    const perSide = Math.floor(steps / 4);
    // top edge: left to right
    for (let i = 0; i <= perSide; i++) pts.push({ x: (i / perSide) * FS_W, y: 0 });
    // right edge: top to bottom
    for (let i = 1; i <= perSide; i++) pts.push({ x: FS_W, y: (i / perSide) * FS_H });
    // bottom edge: right to left
    for (let i = 1; i <= perSide; i++) pts.push({ x: FS_W - (i / perSide) * FS_W, y: FS_H });
    // left edge: bottom to top
    for (let i = 1; i < perSide; i++) pts.push({ x: 0, y: FS_H - (i / perSide) * FS_H });
    return pts;
  }

  function closestBoundaryPointRect(pt: Point, boundary: Point[]): { point: Point; index: number } {
    let bestIdx = 0; let bestDist = Infinity;
    for (let i = 0; i < boundary.length; i++) {
      const d = dist(pt, boundary[i]);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    return { point: boundary[bestIdx], index: bestIdx };
  }

  function traceBoundaryCWRect(boundary: Point[], idxA: number, idxB: number): Point[] {
    const n = boundary.length; const result: Point[] = [];
    let i = idxA;
    while (i !== idxB) { result.push(boundary[i]); i = (i + 1) % n; }
    result.push(boundary[idxB]);
    return result;
  }

  function traceBoundaryCCWRect(boundary: Point[], idxA: number, idxB: number): Point[] {
    const n = boundary.length; const result: Point[] = [];
    let i = idxA;
    while (i !== idxB) { result.push(boundary[i]); i = (i - 1 + n) % n; }
    result.push(boundary[idxB]);
    return result;
  }

  const applyFsThroughCut = useCallback((pts: Point[]) => {
    const off = fsOffscreenRef.current!;
    const ctx = off.getContext('2d')!;

    const first = pts[0]; const last = pts[pts.length - 1];
    const firstIn = isInsidePaper(first); const lastIn = isInsidePaper(last);

    // Case 1: closed loop (end near start) - same as before
    if (pts.length > 8 && dist(first, last) < CLOSE_THRESHOLD) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    // Case 2: through-cut (start or end outside paper)
    if (!firstIn || !lastIn) {
      let entryIdx = -1; let exitIdx = -1;
      for (let i = 0; i < pts.length; i++) {
        if (isInsidePaper(pts[i])) {
          if (entryIdx === -1) entryIdx = i;
          exitIdx = i;
        }
      }
      if (entryIdx === -1 || exitIdx === -1 || entryIdx === exitIdx) return false;

      const insidePts = pts.slice(entryIdx, exitIdx + 1);
      if (insidePts.length < 2) return false;

      // Clamp entry/exit points to boundary
      const boundary = paperBoundaryPoints(80);
      const entryBnd = closestBoundaryPointRect(insidePts[0], boundary);
      const exitBnd = closestBoundaryPointRect(insidePts[insidePts.length - 1], boundary);

      const traceCW = traceBoundaryCWRect(boundary, exitBnd.index, entryBnd.index);
      const traceCCW = traceBoundaryCCWRect(boundary, exitBnd.index, entryBnd.index);

      const buildPoly = (trace: Point[]): Point[] => {
        const poly: Point[] = [...insidePts];
        for (const bp of trace) poly.push(bp);
        return poly;
      };
      const polyCW = buildPoly(traceCW);
      const polyCCW = buildPoly(traceCCW);
      const areaCW = polygonArea(polyCW);
      const areaCCW = polygonArea(polyCCW);
      const chosenPoly = areaCW <= areaCCW ? polyCW : polyCCW;

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.moveTo(chosenPoly[0].x, chosenPoly[0].y);
      for (let i = 1; i < chosenPoly.length; i++) ctx.lineTo(chosenPoly[i].x, chosenPoly[i].y);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      return true;
    }

    // Case 3: Edge-based (both on edge of paper)
    const startOnEdge = fsIsOnEdge(first); const endOnEdge = fsIsOnEdge(last);
    if (startOnEdge && endOnEdge && pts.length > 5) {
      applyFsCut(pts, true);
      return true;
    }

    return false;
  }, [applyFsCut]);

  const handleFsCutMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const pt = getFsWrapCanvasPoint(e);
    if (!pt) return;
    setFsIsDrawing(true);
    fsPointsRef.current = [pt];
  };

  const handleFsCut = (e: React.MouseEvent<HTMLDivElement>) => {
    const pt = getFsWrapCanvasPoint(e);
    if (pt && isInsidePaper(pt)) drawFsCursorOverlay(pt);
    else drawFsCursorOverlay(null);
    if (!fsIsDrawing || !pt) return;
    const pts = fsPointsRef.current;
    pts.push(pt);
    // Draw scissors preview
    syncFsVisible();
    const c = fullscreenCanvasRef.current!;
    const ctx = c.getContext('2d')!;
    ctx.save();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(Math.max(0, Math.min(FS_W, pts[0].x)), Math.max(0, Math.min(FS_H, pts[0].y)));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(Math.max(0, Math.min(FS_W, pts[i].x)), Math.max(0, Math.min(FS_H, pts[i].y)));
    ctx.stroke();
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(Math.max(0, Math.min(FS_W, pts[0].x)), Math.max(0, Math.min(FS_H, pts[0].y)));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(Math.max(0, Math.min(FS_W, pts[i].x)), Math.max(0, Math.min(FS_H, pts[i].y)));
    ctx.stroke();
    ctx.restore();
    const first = pts[0]; const last = pts[pts.length - 1];
    if (pts.length > 10 && dist(first, last) < CLOSE_THRESHOLD * 2) {
      ctx.save(); ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(Math.max(0, Math.min(FS_W, first.x)), Math.max(0, Math.min(FS_H, first.y)), CLOSE_THRESHOLD, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  };

  const handleFsCutMouseUp = () => {
    if (!fsIsDrawing) return;
    setFsIsDrawing(false);
    const pts = fsPointsRef.current;
    if (pts.length < 2) { fsPointsRef.current = []; return; }
    const didCut = applyFsThroughCut(pts);
    if (didCut) saveFsSnapshot();
    // After cutting, render with current engraving style preview
    renderEngravingPreview(finishResultTypeRef.current);
    fsPointsRef.current = [];
  };

  const generateFinishResults = useCallback(() => {
    const off = fsOffscreenRef.current;
    if (!off) return;

    // 阴刻 (yinke) = current paper with holes (transparent where cut)
    const yinkeUrl = off.toDataURL();

    // 阳刻 (yangke) = only the cut-away parts filled with paper color
    const tmpYang = document.createElement('canvas');
    tmpYang.width = FS_W; tmpYang.height = FS_H;
    const yctx = tmpYang.getContext('2d')!;
    // Start with full paper color
    yctx.fillStyle = paperColor;
    yctx.fillRect(0, 0, FS_W, FS_H);
    // Subtract the remaining paper (show only holes as solid)
    yctx.globalCompositeOperation = 'destination-out';
    yctx.drawImage(off, 0, 0);
    // Also add yangke with light background for better visibility in results
    const tmpYangBg = document.createElement('canvas');
    tmpYangBg.width = FS_W; tmpYangBg.height = FS_H;
    const ybgCtx = tmpYangBg.getContext('2d')!;
    ybgCtx.fillStyle = '#faf6f0';
    ybgCtx.fillRect(0, 0, FS_W, FS_H);
    ybgCtx.drawImage(tmpYang, 0, 0);
    const yangkeUrl = tmpYangBg.toDataURL();

    // 阴阳刻 (yinyangke) = combine both techniques with contrasting colors
    const tmpYY = document.createElement('canvas');
    tmpYY.width = FS_W; tmpYY.height = FS_H;
    const yyctx = tmpYY.getContext('2d')!;
    // Warm background
    yyctx.fillStyle = '#fdf5e6';
    yyctx.fillRect(0, 0, FS_W, FS_H);
    // Draw yangke (cut areas) with gold-brown contrasting color
    const tmpYYang = document.createElement('canvas');
    tmpYYang.width = FS_W; tmpYYang.height = FS_H;
    const yyangCtx = tmpYYang.getContext('2d')!;
    yyangCtx.fillStyle = '#c9963a';
    yyangCtx.fillRect(0, 0, FS_W, FS_H);
    yyangCtx.globalCompositeOperation = 'destination-out';
    yyangCtx.drawImage(off, 0, 0);
    yyctx.drawImage(tmpYYang, 0, 0);
    // Draw yinke (remaining paper) on top
    yyctx.drawImage(off, 0, 0);
    const yinyangkeUrl = tmpYY.toDataURL();

    setFinishDataUrls({ yinke: yinkeUrl, yangke: yangkeUrl, yinyangke: yinyangkeUrl });
    // Preserve the user's selected engraving type instead of overriding
    setShowFinishResult(true);
  }, [paperColor]);

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div>
      <StudioTabs mode={studioMode} setMode={setStudioMode} />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-red-800 flex items-center gap-2">
              <Scissors className="w-6 h-6" />自由创作
            </h1>
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPublishModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-md">
                <Share2 className="w-4 h-4" />发布作品
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:min-h-[calc(100vh-10rem)]">
            {/* Left Panel - Tools */}
            <div className="lg:col-span-1 space-y-4 min-h-0">
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />工具箱
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {toolList.map((t) => (
                    <motion.button key={t.id} whileTap={{ scale: 0.95 }} onClick={() => setTool(t.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition ${tool === t.id ? 'bg-red-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-red-50'}`}>
                      <t.icon className="w-5 h-5" />
                      <span className="text-xs">{t.label}</span>
                    </motion.button>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 text-center">
                    {tool === 'pencil' && '🖊 在纸上自由绘画'}
                    {tool === 'scissors' && '✂️ 画闭合路径或从边界穿入穿出裁剪'}
                    {tool === 'eraser' && '🧹 擦除画布上的内容'}
                  </p>
                </div>
                <div className="mt-4">
                  <label className="text-sm text-gray-600 mb-2 block">
                    {tool === 'eraser' ? '橡皮大小' : '笔触粗细'}: {tool === 'eraser' ? strokeWidth * 4 : strokeWidth}px
                  </label>
                  <input type="range" min="1" max="20" value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))} className="w-full accent-red-600" />
                </div>
                {tool === 'pencil' && (
                  <div className="mt-4">
                    <label className="text-sm text-gray-600 mb-2 block">笔触颜色</label>
                    <div className="flex flex-wrap gap-2">
                      {['#000000', '#ffffff', '#ffeb3b', '#4caf50', '#2196f3'].map((color) => (
                        <button key={color} onClick={() => setStrokeColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition ${strokeColor === color ? 'border-red-600 scale-110' : 'border-gray-200'}`}
                          style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    {/* TASK-4: Curve smoothing toggle */}
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => setSmoothCurves(!smoothCurves)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${smoothCurves ? 'bg-red-600' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${smoothCurves ? 'translate-x-5' : ''}`} />
                      </button>
                      <span className="text-xs text-gray-500">曲线修正</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Paper Settings */}
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />纸张设置
                </h3>
                <div className="mb-4">
                  <label className="text-sm text-gray-600 mb-2 block">纸张颜色</label>
                  <div className="grid grid-cols-4 gap-2">
                    {paperColors.map((pc) => (
                      <button key={pc.color} onClick={() => setPaperColor(pc.color)}
                        className={`w-full aspect-square rounded-lg border-2 transition relative group ${paperColor === pc.color ? 'border-yellow-400 scale-105' : 'border-transparent'}`}
                        style={{ backgroundColor: pc.color }}>
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 rounded-lg text-white text-xs">{pc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">纸张厚度: {paperThickness}</label>
                  <input type="range" min="1" max="5" value={paperThickness}
                    onChange={(e) => setPaperThickness(parseInt(e.target.value))} className="w-full accent-red-600" />
                </div>
              </div>


            </div>

            {/* Center - Canvas */}
            <div className="lg:col-span-2 min-h-0">
              <div ref={containerRef}
                className={`rounded-2xl p-4 shadow-lg relative overflow-hidden min-h-[650px]
                  ${selectedBackground === 'paper' ? 'bg-amber-50' : selectedBackground === 'wood' ? 'bg-amber-800' : selectedBackground === 'ink' ? 'bg-gradient-to-br from-gray-200 to-gray-400' : selectedBackground === 'festive' ? 'bg-gradient-to-br from-red-100 to-yellow-100' : 'bg-white/80'}`}>

                {/* Canvas Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(Math.max(0.5, zoom - (zoom > 2 ? 0.5 : 0.1)))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"><ZoomOut className="w-4 h-4" /></button>
                    <span className="text-sm text-gray-600 min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(8, zoom + (zoom >= 2 ? 0.5 : 0.1)))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"><ZoomIn className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={handleUndo} disabled={historyIdx <= 0} title="撤销"
                      className={`p-2 rounded-lg transition ${historyIdx > 0 ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button onClick={handleRedo} disabled={historyIdx >= historyLen - 1} title="重做"
                      className={`p-2 rounded-lg transition ${historyIdx < historyLen - 1 ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>
                      <Redo2 className="w-4 h-4" />
                    </button>
                    <button onClick={handleClearCanvas} title="清空画布"
                      className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={openFullscreenByTool} title={tool === 'scissors' ? '全屏裁剪模式' : '全屏绘制模式'}
                    className="p-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>

                {/* Canvas with overlay */}
                <div className="relative overflow-hidden rounded-xl bg-white/60"
                  style={{ height: '560px', width: '100%', contain: 'layout style' }}>
                  <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', willChange: 'transform' }}>
                    <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
                      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}
                      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                      className="rounded-xl shadow-inner max-w-full h-auto"
                      style={{ boxShadow: `0 ${paperThickness * 2}px ${paperThickness * 4}px rgba(0,0,0,0.2)`, cursor: 'none' }} />
                    {/* Cursor overlay */}
                    <canvas ref={overlayRef} width={CANVAS_W} height={CANVAS_H}
                      className="absolute top-0 left-0 pointer-events-none rounded-xl max-w-full h-auto" />
                  </div>

                  <AnimatePresence>
                    {cutAnimation && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-10">
                        <motion.div animate={{ rotateY: [0, 180, 360], scale: [1, 1.2, 1] }} transition={{ duration: 2 }} className="text-white text-center">
                          <Scissors className="w-16 h-16 mx-auto mb-4" /><p className="text-lg font-semibold">剪切中...</p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>

            {/* Right Panel */}
            <div className="lg:col-span-1 space-y-4 min-h-0">
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />剪纸模板
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                  {templates.map((template) => (
                    <motion.button key={template.id} whileTap={{ scale: 0.95 }}
                      onClick={() => { setTemplate(template); setShowCultureInfo(true); }}
                      className={`p-3 rounded-xl border-2 transition text-left ${selectedTemplate?.id === template.id ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-red-200'}`}>
                      <p className="font-medium text-gray-800 text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500">{template.category}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < Math.ceil(template.difficulty / 2) ? 'bg-red-500' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* FEAT-3: Template Pattern Preview */}
                {selectedTemplate && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-xs text-amber-700 mb-2 font-medium">📐 模板图案参考</p>
                    <svg viewBox="0 0 100 100" className="w-full h-24 mx-auto" style={{ maxWidth: 140 }}>
                      <rect width="100" height="100" fill="none" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
                      <path d={selectedTemplate.svgPath} fill="none" stroke="#c62828" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    <p className="text-xs text-gray-400 text-center mt-1">对照此图案在红纸上进行裁剪</p>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {selectedTemplate && showCultureInfo && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 shadow-lg border border-red-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-red-800 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />文化故事
                      </h3>
                      <button onClick={speakCultureInfo}
                        className={`p-2 rounded-full transition ${isSpeaking ? 'bg-red-600 text-white' : 'bg-white text-red-600 hover:bg-red-100'}`}>
                        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                    <h4 className="font-bold text-red-700 mb-2">{selectedTemplate.name}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedTemplate.culturalInfo}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />虚拟背景
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {backgrounds.map((bg) => (
                    <button key={bg.value} onClick={() => setSelectedBackground(bg.value)}
                      className={`aspect-square rounded-lg ${bg.preview} border-2 transition ${selectedBackground === bg.value ? 'border-red-500 scale-105' : 'border-transparent hover:border-red-200'}`} />
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 shadow-lg border border-purple-100">
                <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />双人协作
                </h3>
                <p className="text-sm text-gray-600 mb-3">邀请好友一起创作，完成精美的合作作品</p>
                <button className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition text-sm">
                  邀请好友协作
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================ Fullscreen Mode ================ */}
        <AnimatePresence>
          {fullscreenMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-white/95 flex flex-col">
              {/* Top bar */}
              <div className="bg-white/90 backdrop-blur border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  {fullscreenMode === 'cut' ? <Scissors className="w-5 h-5 text-red-600" /> : <Pencil className="w-5 h-5 text-red-600" />}
                  {fullscreenMode === 'cut' ? '全屏裁剪模式' : '全屏绘制模式'}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{fullscreenMode === 'cut' ? '✂️ 画闭合路径或从纸外穿入穿出裁剪' : '🖊 自由绘制（橡皮工具时为擦除）'}</span>
                  <button onClick={closeFullscreen}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Canvas area */}
              <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-white/60">
                <div style={{ transform: `scale(${fsZoom})`, transformOrigin: 'center center' }}>
                  <div className="relative" style={{ padding: '60px' }}
                    onMouseDown={fullscreenMode === 'cut' ? handleFsCutMouseDown : undefined}
                    onMouseMove={fullscreenMode === 'cut' ? handleFsCut : undefined}
                    onMouseUp={fullscreenMode === 'cut' ? handleFsCutMouseUp : undefined}>
                    <canvas ref={fullscreenCanvasRef} width={FS_W} height={FS_H}
                      onMouseDown={fullscreenMode === 'draw' ? handleFsDrawMouseDown : undefined}
                      onMouseMove={fullscreenMode === 'draw' ? handleFsDraw : undefined}
                      onMouseUp={fullscreenMode === 'draw' ? handleFsDrawMouseUp : undefined}
                      onMouseLeave={fullscreenMode === 'draw' ? handleFsDrawMouseLeave : undefined}
                      className="rounded-xl shadow-2xl block"
                      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.15)', cursor: 'none' }} />
                    <canvas ref={fsOverlayRef} width={FS_W} height={FS_H}
                      className="absolute pointer-events-none rounded-xl"
                      style={{ top: '60px', left: '60px' }} />
                  </div>
                </div>
              </div>

              {/* Bottom toolbar */}
              <div className="bg-white/90 backdrop-blur border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] px-6 py-3 flex items-center justify-center gap-3 flex-wrap">
                {/* Zoom controls */}
                <button onClick={() => setFsZoom(Math.max(0.5, fsZoom - (fsZoom > 2 ? 0.5 : 0.1)))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 transition"><ZoomOut className="w-5 h-5" /></button>
                <span className="text-sm text-gray-600 min-w-[50px] text-center">{Math.round(fsZoom * 100)}%</span>
                <button onClick={() => setFsZoom(Math.min(8, fsZoom + (fsZoom >= 2 ? 0.5 : 0.1)))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 transition"><ZoomIn className="w-5 h-5" /></button>

                <div className="w-px h-8 bg-gray-300 mx-1" />

                {/* Undo/Redo/Clear */}
                <button onClick={handleFsUndo} disabled={fsHistoryIdx <= 0} title="撤销"
                  className={`p-2 rounded-lg transition ${fsHistoryIdx > 0 ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>
                  <Undo2 className="w-5 h-5" />
                </button>
                <button onClick={handleFsRedo} disabled={fsHistoryIdx >= fsHistoryLen - 1} title="重做"
                  className={`p-2 rounded-lg transition ${fsHistoryIdx < fsHistoryLen - 1 ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>
                  <Redo2 className="w-5 h-5" />
                </button>
                <button onClick={handleFsClear} title="清空画布"
                  className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition">
                  <RotateCcw className="w-5 h-5" />
                </button>

                <div className="w-px h-8 bg-gray-300 mx-1" />

                <span className="text-sm text-gray-500">{fsHistoryIdx} / {fsHistoryLen - 1}</span>

                {fullscreenMode === 'draw' ? (
                  <>
                    <div className="w-px h-8 bg-gray-300 mx-1" />
                    <span className="text-sm text-gray-600">笔触粗细: {tool === 'eraser' ? strokeWidth * 4 : strokeWidth}px</span>
                    <input type="range" min="1" max="20" value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseInt(e.target.value))} className="w-32 accent-red-600" />
                    {tool !== 'eraser' && (
                      <>
                        <span className="text-sm text-gray-600">笔触颜色</span>
                        <div className="flex gap-1">
                          {['#000000', '#ffffff', '#ffeb3b', '#4caf50', '#2196f3'].map((color) => (
                            <button key={color} onClick={() => setStrokeColor(color)}
                              className={`w-6 h-6 rounded-full border ${strokeColor === color ? 'border-red-500' : 'border-gray-300'}`}
                              style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </>
                    )}
                    <span className="text-sm text-gray-600">纸张颜色</span>
                    <div className="flex gap-1">
                      {paperColors.slice(0, 6).map((pc) => (
                        <button key={pc.color} onClick={() => setPaperColor(pc.color)}
                          className={`w-6 h-6 rounded-full border ${paperColor === pc.color ? 'border-yellow-400' : 'border-gray-300'}`}
                          style={{ backgroundColor: pc.color }} />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-px h-8 bg-gray-300 mx-1" />
                    <div className="flex gap-1 bg-gray-100 rounded-full p-1">
                      {([
                        { key: 'yinke' as const, label: '阴刻' },
                        { key: 'yangke' as const, label: '阳刻' },
                        { key: 'yinyangke' as const, label: '阴阳刻' },
                      ]).map((t) => (
                        <button key={t.key} onClick={() => {
                          setFinishResultType(t.key);
                          finishResultTypeRef.current = t.key;
                          renderEngravingPreview(t.key);
                        }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${finishResultType === t.key ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:text-red-600'}`}>
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="w-px h-8 bg-gray-300 mx-1" />

                    <motion.button whileTap={{ scale: 0.95 }} onClick={generateFinishResults}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full hover:from-red-700 hover:to-red-800 transition shadow-lg font-medium">
                      <Check className="w-5 h-5" />完成作品
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================ Finish Result Modal (阴刻/阳刻/阴阳刻) ================ */}
        <AnimatePresence>
          {showFinishResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowFinishResult(false)}>
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 flex flex-col items-center gap-5 max-w-lg w-full mx-4">
                <h2 className="text-2xl font-bold text-gray-800">🎉 剪纸作品完成</h2>

                {/* Engraving style switcher in modal */}
                <div className="flex gap-1 bg-gray-100 rounded-full p-1">
                  {([
                    { key: 'yinke' as const, label: '阴刻', desc: '保留背景，图案镂空' },
                    { key: 'yangke' as const, label: '阳刻', desc: '保留图案，去掉背景' },
                    { key: 'yinyangke' as const, label: '阴阳刻', desc: '阴阳结合' },
                  ]).map((t) => (
                    <button key={t.key} onClick={() => setFinishResultType(t.key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${finishResultType === t.key ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:text-red-600 hover:bg-white'}`}
                      title={t.desc}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <div className="rounded-2xl shadow-xl overflow-hidden p-2 bg-white border border-gray-200">
                  <img src={finishDataUrls[finishResultType]} alt={`剪纸作品-${finishResultType}`}
                    className="max-w-[75vw] max-h-[55vh] object-contain rounded-xl" />
                </div>

                <div className="flex items-center gap-4">
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `paper-cut-${finishResultType}-${Date.now()}.png`;
                      link.href = finishDataUrls[finishResultType];
                      link.click();
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition font-medium">
                    <Download className="w-5 h-5" />下载作品
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowFinishResult(false); closeFullscreen(); }}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-full shadow-lg hover:bg-gray-200 transition font-medium">
                    <X className="w-5 h-5" />关闭
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Publish Modal */}
        <AnimatePresence>
          {publishModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setPublishModal(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h2 className="text-xl font-bold text-gray-800 mb-4">发布作品</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">作品名称</label>
                  <input type="text" defaultValue={selectedTemplate?.name || '我的剪纸作品'}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">创作心得</label>
                  <textarea value={publishNotes} onChange={(e) => setPublishNotes(e.target.value)} rows={4}
                    placeholder="分享你的创作灵感和心得..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setPublishModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition">取消</button>
                  <button onClick={handlePublish} className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition">立即发布</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
