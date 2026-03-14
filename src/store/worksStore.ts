import { create } from 'zustand';

export interface Work {
  id: string;
  title: string;
  imageUrl: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorLevel: number;
  createdAt: Date;
  likes: number;
  comments: Comment[];
  complexity: number;
  background: string;
  notes: string;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  createdAt: Date;
}

interface WorksState {
  works: Work[];
  hotWorks: Work[];
  recentActivities: Activity[];
  addWork: (work: Work) => void;
  likeWork: (workId: string) => void;
  addComment: (workId: string, comment: Comment) => void;
  getWorksByUser: (userId: string) => Work[];
}

export interface Activity {
  id: string;
  type: 'create' | 'like' | 'comment' | 'follow';
  userId: string;
  username: string;
  avatar: string;
  workId?: string;
  workTitle?: string;
  workImage?: string;
  targetUserId?: string;
  targetUsername?: string;
  createdAt: Date;
}

// Mock data
const mockWorks: Work[] = [
  {
    id: '1',
    title: '龙凤呈祥',
    imageUrl: '',
    authorId: '1',
    authorName: '剪纸大师',
    authorAvatar: '',
    authorLevel: 8,
    createdAt: new Date('2024-01-15'),
    likes: 156,
    comments: [],
    complexity: 9.5,
    background: 'traditional',
    notes: '这是一幅传统的龙凤呈祥剪纸作品，寓意吉祥如意。',
  },
  {
    id: '2',
    title: '福字迎春',
    imageUrl: '',
    authorId: '2',
    authorName: '巧手艺人',
    authorAvatar: '',
    authorLevel: 6,
    createdAt: new Date('2024-01-20'),
    likes: 128,
    comments: [],
    complexity: 7.8,
    background: 'modern',
    notes: '春节福字剪纸，采用镂空工艺，层次分明。',
  },
  {
    id: '3',
    title: '喜鹊登梅',
    imageUrl: '',
    authorId: '3',
    authorName: '民俗传人',
    authorAvatar: '',
    authorLevel: 9,
    createdAt: new Date('2024-01-25'),
    likes: 203,
    comments: [],
    complexity: 8.9,
    background: 'classic',
    notes: '喜鹊登梅象征喜上眉梢，是传统剪纸中的经典题材。',
  },
  {
    id: '4',
    title: '双鱼戏水',
    imageUrl: '',
    authorId: '4',
    authorName: '艺术新星',
    authorAvatar: '',
    authorLevel: 4,
    createdAt: new Date('2024-02-01'),
    likes: 89,
    comments: [],
    complexity: 6.5,
    background: 'water',
    notes: '双鱼戏水，年年有余，寓意美好生活。',
  },
  {
    id: '5',
    title: '牡丹富贵',
    imageUrl: '',
    authorId: '5',
    authorName: '花样剪纸',
    authorAvatar: '',
    authorLevel: 7,
    createdAt: new Date('2024-02-05'),
    likes: 167,
    comments: [],
    complexity: 8.2,
    background: 'floral',
    notes: '牡丹花开富贵，国色天香的传统剪纸表达。',
  },
  {
    id: '6',
    title: '十二生肖',
    imageUrl: '',
    authorId: '1',
    authorName: '剪纸大师',
    authorAvatar: '',
    authorLevel: 8,
    createdAt: new Date('2024-02-10'),
    likes: 245,
    comments: [],
    complexity: 9.8,
    background: 'zodiac',
    notes: '十二生肖完整系列，每个生肖都栩栩如生。',
  },
];

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'create',
    userId: '1',
    username: '剪纸大师',
    avatar: '',
    workId: '6',
    workTitle: '十二生肖',
    workImage: '',
    createdAt: new Date('2024-02-10T10:30:00'),
  },
  {
    id: '2',
    type: 'like',
    userId: '2',
    username: '巧手艺人',
    avatar: '',
    workId: '1',
    workTitle: '龙凤呈祥',
    createdAt: new Date('2024-02-10T09:15:00'),
  },
  {
    id: '3',
    type: 'comment',
    userId: '3',
    username: '民俗传人',
    avatar: '',
    workId: '2',
    workTitle: '福字迎春',
    createdAt: new Date('2024-02-10T08:45:00'),
  },
  {
    id: '4',
    type: 'follow',
    userId: '4',
    username: '艺术新星',
    avatar: '',
    targetUserId: '1',
    targetUsername: '剪纸大师',
    createdAt: new Date('2024-02-10T08:00:00'),
  },
];

export const useWorksStore = create<WorksState>((set, get) => ({
  works: mockWorks,
  hotWorks: [...mockWorks].sort((a, b) => b.likes - a.likes).slice(0, 6),
  recentActivities: mockActivities,
  
  addWork: (work) => {
    set((state) => ({
      works: [work, ...state.works],
      hotWorks: [...state.works, work].sort((a, b) => b.likes - a.likes).slice(0, 6),
    }));
  },
  
  likeWork: (workId) => {
    set((state) => ({
      works: state.works.map((work) =>
        work.id === workId
          ? { ...work, likes: work.likes + 1, isLiked: true }
          : work
      ),
      hotWorks: state.hotWorks.map((work) =>
        work.id === workId
          ? { ...work, likes: work.likes + 1, isLiked: true }
          : work
      ),
    }));
  },
  
  addComment: (workId, comment) => {
    set((state) => ({
      works: state.works.map((work) =>
        work.id === workId
          ? { ...work, comments: [...work.comments, comment] }
          : work
      ),
    }));
  },
  
  getWorksByUser: (userId) => {
    return get().works.filter((work) => work.authorId === userId);
  },
}));
