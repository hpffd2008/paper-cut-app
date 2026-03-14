import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Scissors, Eraser, Undo2, Redo2,
  Download, RotateCcw
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */
interface Point { x: number; y: number }

const SECTOR_SIZE = 500;
const PREVIEW_SIZE = 500;
const MAX_SNAPSHOTS = 40;
const CLOSE_THRESHOLD = 18; // px – snap-close distance

const FOLD_OPTIONS = [
  { label: '四角', value: 4 },
  { label: '六角', value: 6 },
  { label: '八角', value: 8 },
  { label: '十二角', value: 12 },
  { label: '十六角', value: 16 },
] as const;

const PAPER_COLORS = [
  { name: '中国红', color: '#c62828' },
  { name: '金黄', color: '#ffc107' },
  { name: '墨黑', color: '#212121' },
  { name: '翠绿', color: '#2e7d32' },
  { name: '宝蓝', color: '#1565c0' },
  { name: '紫罗兰', color: '#7b1fa2' },
];

type ToolType = 'scissors' | 'eraser';

/* ------------------------------------------------------------------ */
/*  Geometry helpers                                                   */
/* ------------------------------------------------------------------ */
function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Check if a point is inside the sector wedge.
 *  Sector centre = (cx,cy), radius = r,
 *  angular span = -sectorAngle … +sectorAngle relative to the 12 o'clock axis.
 */
function isInsideSector(
  pt: Point, cx: number, cy: number, r: number, halfAngle: number
): boolean {
  const dx = pt.x - cx;
  const dy = pt.y - cy;
  const d = Math.hypot(dx, dy);
  if (d > r) return false;
  // angle from 12 o'clock (negative-y direction), range [-PI, PI]
  const angle = Math.atan2(dx, -dy); // note: atan2(sin, cos) → sin=dx, cos=-dy
  return Math.abs(angle) <= halfAngle + 0.01; // small tolerance
}

/** Generate a series of points along the sector boundary (CW from left radial → arc → right radial → center).
 *  Returns { boundary, leftRadial, arcPoints, rightRadial } for path closure.
 */
function sectorBoundaryPoints(
  cx: number, cy: number, r: number, halfAngle: number, steps = 64
): Point[] {
  const pts: Point[] = [];
  // center
  pts.push({ x: cx, y: cy });
  // left radial: from center to left edge
  const leftAngle = -Math.PI / 2 - halfAngle;
  const lx = cx + r * Math.cos(leftAngle);
  const ly = cy + r * Math.sin(leftAngle);
  for (let i = 1; i <= 10; i++) {
    const t = i / 10;
    pts.push({ x: cx + (lx - cx) * t, y: cy + (ly - cy) * t });
  }
  // arc: from left to right
  const startAngle = -Math.PI / 2 - halfAngle;
  const endAngle = -Math.PI / 2 + halfAngle;
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / steps);
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  // right radial: from right edge back to center
  const rx = cx + r * Math.cos(endAngle);
  const ry = cy + r * Math.sin(endAngle);
  for (let i = 1; i <= 10; i++) {
    const t = i / 10;
    pts.push({ x: rx + (cx - rx) * t, y: ry + (cy - ry) * t });
  }
  return pts;
}

/** Find the closest point on the sector boundary to a given point */
function closestBoundaryPoint(
  pt: Point, boundary: Point[]
): { point: Point; index: number; dist: number } {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < boundary.length; i++) {
    const d = dist(pt, boundary[i]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return { point: boundary[bestIdx], index: bestIdx, dist: bestDist };
}

/** Trace boundary points between two indices (shorter direction) */
function traceBoundary(
  boundary: Point[], idxA: number, idxB: number
): Point[] {
  const n = boundary.length;
  // clockwise distance
  const cwDist = (idxB - idxA + n) % n;
  const ccwDist = (idxA - idxB + n) % n;

  const result: Point[] = [];
  if (cwDist <= ccwDist) {
    // go clockwise (increasing index)
    let i = idxA;
    while (i !== idxB) {
      result.push(boundary[i]);
      i = (i + 1) % n;
    }
    result.push(boundary[idxB]);
  } else {
    // go counter-clockwise (decreasing index)
    let i = idxA;
    while (i !== idxB) {
      result.push(boundary[i]);
      i = (i - 1 + n) % n;
    }
    result.push(boundary[idxB]);
  }
  return result;
}

/** Trace boundary CW from idxA to idxB */
function traceBoundaryCW(boundary: Point[], idxA: number, idxB: number): Point[] {
  const n = boundary.length;
  const result: Point[] = [];
  let i = idxA;
  while (i !== idxB) {
    result.push(boundary[i]);
    i = (i + 1) % n;
  }
  result.push(boundary[idxB]);
  return result;
}

/** Trace boundary CCW from idxA to idxB */
function traceBoundaryCCW(boundary: Point[], idxA: number, idxB: number): Point[] {
  const n = boundary.length;
  const result: Point[] = [];
  let i = idxA;
  while (i !== idxB) {
    result.push(boundary[i]);
    i = (i - 1 + n) % n;
  }
  result.push(boundary[idxB]);
  return result;
}

/** Compute polygon area using shoelace formula */
function polygonArea(poly: Point[]): number {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    area += poly[i].x * poly[j].y;
    area -= poly[j].x * poly[i].y;
  }
  return Math.abs(area) / 2;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function TuanHuaStudio() {
  /* refs */
  const sectorCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const cutMaskRef = useRef<HTMLCanvasElement | null>(null);

  /* history */
  const snapshotsRef = useRef<ImageData[]>([]);
  const snapIdxRef = useRef(0);

  /* drawing state */
  const pointsRef = useRef<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  /* tool state */
  const [tool, setTool] = useState<ToolType>('scissors');
  const [brushSize, setBrushSize] = useState(4);
  const [folds, setFolds] = useState(8);
  const [paperColor, setPaperColor] = useState('#c62828');
  const [historyLen, setHistoryLen] = useState(1);
  const [historyIdx, setHistoryIdx] = useState(0);

  /* computed geometry */
  const halfAngle = Math.PI / folds;
  const cx = SECTOR_SIZE / 2;
  const cy = SECTOR_SIZE / 2;
  const radius = SECTOR_SIZE / 2 - 2;

  /* ---- bootstrap ---- */
  useEffect(() => {
    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = SECTOR_SIZE;
      off.height = SECTOR_SIZE;
      offscreenRef.current = off;
    }
    if (!cutMaskRef.current) {
      const mask = document.createElement('canvas');
      mask.width = SECTOR_SIZE;
      mask.height = SECTOR_SIZE;
      cutMaskRef.current = mask;
    }
    resetCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    resetCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folds, paperColor]);

  /* ================================================================ */
  /*  CORE RENDERING                                                   */
  /* ================================================================ */

  const resetCanvas = useCallback(() => {
    const mask = cutMaskRef.current;
    if (mask) {
      const mctx = mask.getContext('2d')!;
      mctx.clearRect(0, 0, SECTOR_SIZE, SECTOR_SIZE);
      const snap = mctx.getImageData(0, 0, SECTOR_SIZE, SECTOR_SIZE);
      snapshotsRef.current = [snap];
      snapIdxRef.current = 0;
      setHistoryLen(1);
      setHistoryIdx(0);
    }
    composeSectorCanvas();
    renderPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folds, paperColor]);

  /** Compose sector canvas = solid paper wedge minus cut mask regions */
  const composeSectorCanvas = useCallback(() => {
    const off = offscreenRef.current;
    const mask = cutMaskRef.current;
    const vis = sectorCanvasRef.current;
    if (!off || !mask || !vis) return;

    const octx = off.getContext('2d')!;
    const sa = Math.PI / folds;
    const c = SECTOR_SIZE / 2;
    const r = SECTOR_SIZE / 2 - 2;

    // 1) draw solid paper sector
    octx.clearRect(0, 0, SECTOR_SIZE, SECTOR_SIZE);
    octx.save();
    octx.beginPath();
    octx.moveTo(c, c);
    octx.arc(c, c, r, -Math.PI / 2 - sa, -Math.PI / 2 + sa);
    octx.closePath();
    octx.fillStyle = paperColor;
    octx.fill();
    // subtle texture
    octx.globalAlpha = 0.04;
    octx.clip();
    for (let i = 0; i < SECTOR_SIZE; i += 4) {
      for (let j = 0; j < SECTOR_SIZE; j += 4) {
        if (Math.random() > 0.75) {
          octx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
          octx.fillRect(i, j, 1, 1);
        }
      }
    }
    octx.restore();

    // 2) subtract the cut mask
    octx.save();
    octx.globalCompositeOperation = 'destination-out';
    octx.drawImage(mask, 0, 0);
    octx.restore();

    // 3) copy to visible canvas
    const vctx = vis.getContext('2d')!;
    vctx.clearRect(0, 0, SECTOR_SIZE, SECTOR_SIZE);
    vctx.fillStyle = '#f5f0eb';
    vctx.fillRect(0, 0, SECTOR_SIZE, SECTOR_SIZE);
    vctx.drawImage(off, 0, 0);

    // draw sector guide lines
    vctx.save();
    vctx.strokeStyle = 'rgba(180,160,140,0.5)';
    vctx.lineWidth = 1;
    vctx.setLineDash([6, 4]);
    vctx.beginPath();
    vctx.moveTo(c, c);
    const x1 = c + r * Math.sin(-sa);
    const y1 = c - r * Math.cos(-sa);
    const x2 = c + r * Math.sin(sa);
    const y2 = c - r * Math.cos(sa);
    vctx.lineTo(x1, y1);
    vctx.moveTo(c, c);
    vctx.lineTo(x2, y2);
    vctx.moveTo(c + r * Math.sin(-sa), c - r * Math.cos(-sa));
    vctx.arc(c, c, r, -Math.PI / 2 - sa, -Math.PI / 2 + sa);
    vctx.stroke();
    // center bisector
    vctx.beginPath();
    vctx.moveTo(c, c);
    vctx.lineTo(c, c - r);
    vctx.stroke();
    vctx.restore();
  }, [folds, paperColor]);

  /** Render preview – full circle with mirrored cut-outs */
  const renderPreview = useCallback(() => {
    const preview = previewCanvasRef.current;
    const mask = cutMaskRef.current;
    if (!preview || !mask) return;
    const pctx = preview.getContext('2d')!;
    const c = PREVIEW_SIZE / 2;
    const r = PREVIEW_SIZE / 2 - 2;
    const sa = (2 * Math.PI) / folds;
    const mCx = SECTOR_SIZE / 2;
    const mCy = SECTOR_SIZE / 2;

    // 1) solid paper circle
    pctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    pctx.save();
    pctx.beginPath();
    pctx.arc(c, c, r, 0, Math.PI * 2);
    pctx.fillStyle = paperColor;
    pctx.fill();
    pctx.globalAlpha = 0.03;
    pctx.clip();
    for (let i = 0; i < PREVIEW_SIZE; i += 5) {
      for (let j = 0; j < PREVIEW_SIZE; j += 5) {
        if (Math.random() > 0.8) {
          pctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
          pctx.fillRect(i, j, 1, 1);
        }
      }
    }
    pctx.restore();

    // 2) mirror the cut mask N times and subtract
    pctx.save();
    pctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < folds; i++) {
      pctx.save();
      pctx.translate(c, c);
      pctx.rotate(sa * i);
      if (i % 2 === 1) pctx.scale(-1, 1);
      pctx.drawImage(mask, -mCx, -mCy);
      pctx.restore();
    }
    pctx.restore();
  }, [folds, paperColor]);

  /* ================================================================ */
  /*  SNAPSHOT MANAGEMENT                                              */
  /* ================================================================ */
  const saveSnapshot = useCallback(() => {
    const mask = cutMaskRef.current;
    if (!mask) return;
    const mctx = mask.getContext('2d')!;
    const snap = mctx.getImageData(0, 0, SECTOR_SIZE, SECTOR_SIZE);
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
    const mask = cutMaskRef.current!;
    mask.getContext('2d')!.putImageData(snapshotsRef.current[snapIdxRef.current], 0, 0);
    setHistoryIdx(snapIdxRef.current);
    composeSectorCanvas();
    renderPreview();
  }, [composeSectorCanvas, renderPreview]);

  const handleRedo = useCallback(() => {
    if (snapIdxRef.current >= snapshotsRef.current.length - 1) return;
    snapIdxRef.current += 1;
    const mask = cutMaskRef.current!;
    mask.getContext('2d')!.putImageData(snapshotsRef.current[snapIdxRef.current], 0, 0);
    setHistoryIdx(snapIdxRef.current);
    composeSectorCanvas();
    renderPreview();
  }, [composeSectorCanvas, renderPreview]);

  /* ================================================================ */
  /*  COORDINATE HELPER                                                */
  /* ================================================================ */
  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
      const canvas = sectorCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = SECTOR_SIZE / rect.width;
      const scaleY = SECTOR_SIZE / rect.height;
      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  /* ================================================================ */
  /*  DRAWING HANDLERS                                                 */
  /* ================================================================ */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    pointsRef.current = [pt];

    if (tool === 'eraser') {
      applyEraserDot(pt);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    if (pt) setCursorPos(pt);
    drawCursorOverlay(pt);

    if (!isDrawing || !pt) return;
    pointsRef.current.push(pt);

    if (tool === 'scissors') {
      // Draw preview path on visible canvas (dashed line)
      drawScissorsPreview();
    } else if (tool === 'eraser') {
      const prev = pointsRef.current[pointsRef.current.length - 2];
      applyEraserStroke(prev, pt);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === 'scissors') {
      const pts = pointsRef.current;
      if (pts.length >= 3) {
        applyScissorsCut(pts);
      }
      // clear any preview by re-composing
      composeSectorCanvas();
      renderPreview();
    } else if (tool === 'eraser') {
      saveSnapshot();
      composeSectorCanvas();
      renderPreview();
    }

    pointsRef.current = [];
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
    clearCursorOverlay();
    if (isDrawing) handleMouseUp();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); handleMouseDown(e as any); };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); handleMouseMove(e as any); };
  const handleTouchEnd = () => handleMouseUp();

  /* ================================================================ */
  /*  SCISSORS – show dashed preview while drawing                     */
  /* ================================================================ */
  const drawScissorsPreview = useCallback(() => {
    const vis = sectorCanvasRef.current;
    if (!vis) return;
    // first re-compose the base sector view
    composeSectorCanvas();
    const ctx = vis.getContext('2d')!;
    const pts = pointsRef.current;
    if (pts.length < 2) return;

    // draw the cut path as a dashed line
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // inner coloured dashed line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // show close indicator when near start
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (pts.length > 10 && dist(first, last) < CLOSE_THRESHOLD * 2) {
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(first.x, first.y, CLOSE_THRESHOLD, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }, [composeSectorCanvas]);

  /* ================================================================ */
  /*  SCISSORS – apply the cut                                         */
  /* ================================================================ */
  const applyScissorsCut = useCallback(
    (pts: Point[]) => {
      const mask = cutMaskRef.current;
      if (!mask) return;
      const mctx = mask.getContext('2d')!;

      const first = pts[0];
      const last = pts[pts.length - 1];

      const firstInside = isInsideSector(first, cx, cy, radius, halfAngle);
      const lastInside = isInsideSector(last, cx, cy, radius, halfAngle);

      // Case 1: Closed path (end near start)
      if (pts.length > 8 && dist(first, last) < CLOSE_THRESHOLD) {
        mctx.save();
        mctx.globalCompositeOperation = 'source-over';
        mctx.fillStyle = '#ffffff';
        mctx.beginPath();
        mctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          mctx.lineTo(pts[i].x, pts[i].y);
        }
        mctx.closePath();
        mctx.fill();
        mctx.restore();
        saveSnapshot();
        return;
      }

      // Case 2: Through-cut (starts outside, enters sector, exits)
      // or starts/ends on/near boundary
      if (!firstInside || !lastInside) {
        // Find the entry and exit points (first/last inside points)
        let entryIdx = -1;
        let exitIdx = -1;
        for (let i = 0; i < pts.length; i++) {
          if (isInsideSector(pts[i], cx, cy, radius, halfAngle)) {
            if (entryIdx === -1) entryIdx = i;
            exitIdx = i;
          }
        }

        if (entryIdx === -1 || exitIdx === -1 || entryIdx === exitIdx) return;

        // Get the path segment inside the sector
        const insidePts = pts.slice(entryIdx, exitIdx + 1);
        if (insidePts.length < 2) return;

        // Find closest boundary points for entry and exit
        const boundary = sectorBoundaryPoints(cx, cy, radius, halfAngle, 80);
        const entryBnd = closestBoundaryPoint(insidePts[0], boundary);
        const exitBnd = closestBoundaryPoint(insidePts[insidePts.length - 1], boundary);

        // Try both boundary traces (CW and CCW) and pick the one that creates SMALLER polygon
        const traceCW = traceBoundaryCW(boundary, exitBnd.index, entryBnd.index);
        const traceCCW = traceBoundaryCCW(boundary, exitBnd.index, entryBnd.index);

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

        // Fill the smaller polygon on the cut mask
        mctx.save();
        mctx.globalCompositeOperation = 'source-over';
        mctx.fillStyle = '#ffffff';
        mctx.beginPath();
        mctx.moveTo(chosenPoly[0].x, chosenPoly[0].y);
        for (let i = 1; i < chosenPoly.length; i++) {
          mctx.lineTo(chosenPoly[i].x, chosenPoly[i].y);
        }
        mctx.closePath();
        mctx.fill();
        mctx.restore();
        saveSnapshot();
        return;
      }

      // Case 3: Both inside but not closed – do nothing (path too short or not closed)
      // User needs to close the path for internal cuts
    },
    [cx, cy, radius, halfAngle, saveSnapshot]
  );

  /* ================================================================ */
  /*  ERASER – brush-based restore                                     */
  /* ================================================================ */
  const applyEraserDot = useCallback(
    (pt: Point) => {
      const mask = cutMaskRef.current;
      if (!mask) return;
      const mctx = mask.getContext('2d')!;
      mctx.save();
      mctx.globalCompositeOperation = 'destination-out';
      mctx.beginPath();
      mctx.arc(pt.x, pt.y, brushSize * 2, 0, Math.PI * 2);
      mctx.fill();
      mctx.restore();
      composeSectorCanvas();
      renderPreview();
    },
    [brushSize, composeSectorCanvas, renderPreview]
  );

  const applyEraserStroke = useCallback(
    (from: Point, to: Point) => {
      const mask = cutMaskRef.current;
      if (!mask) return;
      const mctx = mask.getContext('2d')!;
      mctx.save();
      mctx.globalCompositeOperation = 'destination-out';
      mctx.strokeStyle = '#ffffff';
      mctx.lineWidth = brushSize * 4;
      mctx.lineCap = 'round';
      mctx.lineJoin = 'round';
      mctx.beginPath();
      mctx.moveTo(from.x, from.y);
      mctx.lineTo(to.x, to.y);
      mctx.stroke();
      mctx.restore();
      composeSectorCanvas();
      renderPreview();
    },
    [brushSize, composeSectorCanvas, renderPreview]
  );

  /* ================================================================ */
  /*  CURSOR OVERLAY                                                   */
  /* ================================================================ */
  const drawCursorOverlay = useCallback((pt: Point | null) => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, SECTOR_SIZE, SECTOR_SIZE);
    if (!pt) return;
    const size = tool === 'eraser' ? brushSize * 2 : 8;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = tool === 'eraser' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)';
    ctx.fill();
    // crosshair for scissors
    if (tool === 'scissors') {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pt.x - 12, pt.y);
      ctx.lineTo(pt.x + 12, pt.y);
      ctx.moveTo(pt.x, pt.y - 12);
      ctx.lineTo(pt.x, pt.y + 12);
      ctx.stroke();
    }
    ctx.restore();
  }, [tool, brushSize]);

  const clearCursorOverlay = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    overlay.getContext('2d')!.clearRect(0, 0, SECTOR_SIZE, SECTOR_SIZE);
  }, []);

  /* ---- download (transparent PNG) ---- */
  const handleDownload = () => {
    const mask = cutMaskRef.current;
    if (!mask) return;
    // Create a new canvas with transparent background, draw the paper minus cuts
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = PREVIEW_SIZE;
    exportCanvas.height = PREVIEW_SIZE;
    const ectx = exportCanvas.getContext('2d')!;
    const c = PREVIEW_SIZE / 2;
    const r = PREVIEW_SIZE / 2 - 2;
    const sa = (2 * Math.PI) / folds;
    const mCx = SECTOR_SIZE / 2;
    const mCy = SECTOR_SIZE / 2;

    // 1) solid paper circle (transparent background)
    ectx.save();
    ectx.beginPath();
    ectx.arc(c, c, r, 0, Math.PI * 2);
    ectx.fillStyle = paperColor;
    ectx.fill();
    ectx.globalAlpha = 0.03;
    ectx.clip();
    for (let i = 0; i < PREVIEW_SIZE; i += 5) {
      for (let j = 0; j < PREVIEW_SIZE; j += 5) {
        if (Math.random() > 0.8) {
          ectx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
          ectx.fillRect(i, j, 1, 1);
        }
      }
    }
    ectx.restore();

    // 2) mirror the cut mask N times and subtract
    ectx.save();
    ectx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < folds; i++) {
      ectx.save();
      ectx.translate(c, c);
      ectx.rotate(sa * i);
      if (i % 2 === 1) ectx.scale(-1, 1);
      ectx.drawImage(mask, -mCx, -mCy);
      ectx.restore();
    }
    ectx.restore();

    const link = document.createElement('a');
    link.download = `tuanhua-${folds}角-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pb-8">
      <div className="max-w-[1400px] mx-auto px-4 py-4">
        {/* ====== Toolbar row ====== */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Fold selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">形状:</span>
              <div className="flex gap-1">
                {FOLD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFolds(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      folds === opt.value
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTool('scissors')}
                title="剪刀（裁剪区域）"
                className={`p-2 rounded-lg transition ${tool === 'scissors' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
              >
                <Scissors className="w-5 h-5" />
              </button>
              <button
                onClick={() => setTool('eraser')}
                title="橡皮（恢复纸张）"
                className={`p-2 rounded-lg transition ${tool === 'eraser' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
              >
                <Eraser className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <button onClick={handleUndo} disabled={historyIdx <= 0} title="撤销"
                className={`p-2 rounded-lg transition ${historyIdx > 0 ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>
                <Undo2 className="w-5 h-5" />
              </button>
              <button onClick={handleRedo} disabled={historyIdx >= historyLen - 1} title="重做"
                className={`p-2 rounded-lg transition ${historyIdx < historyLen - 1 ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>
                <Redo2 className="w-5 h-5" />
              </button>
              <button onClick={resetCanvas} title="清空重置"
                className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition">
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Brush size (for eraser) */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{tool === 'eraser' ? '橡皮大小' : '裁剪灵敏度'}:</span>
              <input
                type="range" min="1" max="20" value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-24 accent-red-600"
              />
              <span className="text-xs text-gray-400 w-8">{brushSize}px</span>
            </div>

            {/* Paper colors */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">纸色:</span>
              {PAPER_COLORS.map((pc) => (
                <button
                  key={pc.color}
                  onClick={() => setPaperColor(pc.color)}
                  className={`w-7 h-7 rounded-full border-2 transition ${paperColor === pc.color ? 'border-yellow-400 scale-110' : 'border-gray-200'}`}
                  style={{ backgroundColor: pc.color }}
                  title={pc.name}
                />
              ))}
            </div>

            {/* Download */}
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow text-sm">
              <Download className="w-4 h-4" />
              保存作品
            </button>
          </div>
        </div>

        {/* ====== Main area: Sector + Preview side by side ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: Sector cutting area */}
          <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col items-center">
            <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-red-600" />
              剪裁区域
              <span className="text-xs text-gray-400 font-normal ml-2">
                {tool === 'scissors'
                  ? '画闭合路径裁剪区域，或从扇形外穿入再穿出裁剪'
                  : '用橡皮恢复已裁剪的区域'}
              </span>
            </h3>
            <div className="relative bg-[#f5f0eb] rounded-xl overflow-hidden" style={{ width: '100%', maxWidth: SECTOR_SIZE, aspectRatio: '1' }}>
              <canvas
                ref={sectorCanvasRef}
                width={SECTOR_SIZE}
                height={SECTOR_SIZE}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-full h-full absolute inset-0"
                style={{ touchAction: 'none', cursor: 'none' }}
              />
              <canvas
                ref={overlayCanvasRef}
                width={SECTOR_SIZE}
                height={SECTOR_SIZE}
                className="w-full h-full absolute inset-0 pointer-events-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {tool === 'scissors'
                ? '✂️ 剪刀模式 — 画闭合路径或从边界穿入穿出裁剪区域'
                : '🧹 橡皮模式 — 恢复已剪掉的纸张'}
            </p>
          </div>

          {/* RIGHT: Preview area */}
          <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col items-center">
            <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-red-600 text-lg">✿</span>
              展示区域
              <span className="text-xs text-gray-400 font-normal ml-2">{folds} 角对称团花实时预览</span>
            </h3>
            <div
              className="relative rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                width: '100%', maxWidth: PREVIEW_SIZE, aspectRatio: '1',
                background: '#ffffff',
              }}
            >
              <canvas
                ref={previewCanvasRef}
                width={PREVIEW_SIZE}
                height={PREVIEW_SIZE}
                className="w-full h-full"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              镂空区域显示为棋盘格（透明），可保存为 PNG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
