import { create } from 'zustand';

export interface Point {
  x: number;
  y: number;
}

export interface Path {
  id: string;
  points: Point[];
  color: string;
  strokeWidth: number;
  type: 'draw' | 'cut';
}

export interface CanvasState {
  paths: Path[];
  currentPath: Path | null;
  history: Path[][];
  historyIndex: number;
  paperColor: string;
  paperThickness: number;
  tool: 'pencil' | 'scissors' | 'eraser' | 'select';
  strokeWidth: number;
  strokeColor: string;
  selectedTemplate: Template | null;
  isPlaying: boolean;
  
  // Actions
  startPath: (point: Point) => void;
  addPointToPath: (point: Point) => void;
  endPath: () => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  setTool: (tool: CanvasState['tool']) => void;
  setStrokeWidth: (width: number) => void;
  setStrokeColor: (color: string) => void;
  setPaperColor: (color: string) => void;
  setPaperThickness: (thickness: number) => void;
  setTemplate: (template: Template | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  exportCanvas: () => string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  difficulty: number;
  svgPath: string;
  culturalInfo: string;
  voiceDescription?: string;
}

const templates: Template[] = [
  {
    id: '1',
    name: '双喜',
    category: '婚庆',
    difficulty: 3,
    svgPath: 'M10,10 L90,10 L90,90 L10,90 Z',
    culturalInfo: '双喜是中国传统婚庆中最常见的剪纸图案，象征着喜上加喜、双喜临门。红色双喜字通常贴在新房的门窗上，寓意新人婚姻美满、幸福长久。',
    voiceDescription: '这是双喜剪纸，象征着喜上加喜、双喜临门...',
  },
  {
    id: '2',
    name: '福字',
    category: '节庆',
    difficulty: 4,
    svgPath: 'M20,20 L80,20 L80,80 L20,80 Z',
    culturalInfo: '福字剪纸是春节期间最重要的装饰之一。民间有"倒贴福字"的习俗，寓意"福到了"。福字的剪法讲究，需要保持字形完整且线条流畅。',
    voiceDescription: '福字剪纸是春节期间最重要的装饰...',
  },
  {
    id: '3',
    name: '蝴蝶',
    category: '花鸟',
    difficulty: 5,
    svgPath: 'M50,10 Q80,30 50,50 Q20,30 50,10',
    culturalInfo: '蝴蝶在中国文化中象征着爱情和美好。梁山伯与祝英台的故事使蝴蝶成为忠贞爱情的象征。蝴蝶剪纸常与花卉组合，寓意花好蝶舞。',
    voiceDescription: '蝴蝶在中国文化中象征着爱情和美好...',
  },
  {
    id: '4',
    name: '窗花',
    category: '装饰',
    difficulty: 6,
    svgPath: 'M50,0 L61,35 L98,35 L68,57 L79,91 L50,70 L21,91 L32,57 L2,35 L39,35 Z',
    culturalInfo: '窗花是中国民间剪纸艺术的重要形式，多在春节期间贴于窗户上。窗花的图案丰富多彩，有花鸟、人物、神话故事等，寓意辟邪迎祥。',
    voiceDescription: '窗花是中国民间剪纸艺术的重要形式...',
  },
  {
    id: '5',
    name: '龙',
    category: '瑞兽',
    difficulty: 8,
    svgPath: 'M10,50 Q30,20 50,50 Q70,80 90,50',
    culturalInfo: '龙是中华民族的图腾，象征着权力、尊贵和祥瑞。龙剪纸工艺复杂，需要表现龙的鳞片、须发、爪子等细节，是考验剪纸技艺的高难度作品。',
    voiceDescription: '龙是中华民族的图腾，象征着权力...',
  },
  {
    id: '6',
    name: '凤凰',
    category: '瑞兽',
    difficulty: 8,
    svgPath: 'M30,80 Q50,20 70,80 Q50,60 30,80',
    culturalInfo: '凤凰是中国神话中的百鸟之王，象征着高贵、美丽和祥瑞。凤凰剪纸常与龙配对，寓意龙凤呈祥，是婚庆场合的吉祥图案。',
    voiceDescription: '凤凰是中国神话中的百鸟之王...',
  },
];

export const useCanvasStore = create<CanvasState>((set, get) => ({
  paths: [],
  currentPath: null,
  history: [[]],
  historyIndex: 0,
  paperColor: '#c62828',
  paperThickness: 2,
  tool: 'pencil',
  strokeWidth: 3,
  strokeColor: '#000000',
  selectedTemplate: null,
  isPlaying: false,
  
  startPath: (point) => {
    const { tool, strokeWidth, strokeColor } = get();
    const newPath: Path = {
      id: Date.now().toString(),
      points: [point],
      color: strokeColor,
      strokeWidth,
      type: tool === 'scissors' ? 'cut' : 'draw',
    };
    set({ currentPath: newPath });
  },
  
  addPointToPath: (point) => {
    const { currentPath } = get();
    if (currentPath) {
      set({
        currentPath: {
          ...currentPath,
          points: [...currentPath.points, point],
        },
      });
    }
  },
  
  endPath: () => {
    const { currentPath, paths, history, historyIndex } = get();
    if (currentPath && currentPath.points.length > 1) {
      const newPaths = [...paths, currentPath];
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newPaths);
      
      set({
        paths: newPaths,
        currentPath: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    } else {
      set({ currentPath: null });
    }
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        historyIndex: historyIndex - 1,
        paths: history[historyIndex - 1],
      });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        historyIndex: historyIndex + 1,
        paths: history[historyIndex + 1],
      });
    }
  },
  
  clearCanvas: () => {
    set({
      paths: [],
      currentPath: null,
      history: [[]],
      historyIndex: 0,
    });
  },
  
  setTool: (tool) => set({ tool }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setPaperColor: (paperColor) => set({ paperColor }),
  setPaperThickness: (paperThickness) => set({ paperThickness }),
  setTemplate: (template) => set({ selectedTemplate: template }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  exportCanvas: () => {
    const { paths, paperColor } = get();
    return JSON.stringify({ paths, paperColor });
  },
}));

export const getTemplates = () => templates;
