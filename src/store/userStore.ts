import { create } from 'zustand';

export interface UserWork {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: Date;
  likes: number;
  comments: number;
  complexity: number;
  background?: string;
  notes?: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: Date;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  level: number;
  exp: number;
  totalLikes: number;
  followers: number;
  following: number;
  works: UserWork[];
  badges: Badge[];
  joinedAt: Date;
}

interface UserState {
  currentUser: User | null;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addWork: (work: UserWork) => void;
  likeWork: (workId: string) => void;
  addExp: (amount: number) => void;
}

const defaultBadges: Badge[] = [
  { id: '1', name: '初出茅庐', icon: '🌱', description: '完成第一幅作品' },
  { id: '2', name: '剪纸新秀', icon: '✂️', description: '获得10个赞' },
  { id: '3', name: '技艺精湛', icon: '⭐', description: '达到5级' },
  { id: '4', name: '社区明星', icon: '🌟', description: '获得100个赞' },
  { id: '5', name: '剪纸大师', icon: '👑', description: '达到10级' },
];

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  isLoggedIn: false,
  
  setUser: (user) => set({ currentUser: user, isLoggedIn: !!user }),
  
  login: async (username, password) => {
    // Mock login
    const mockUser: User = {
      id: '1',
      username,
      avatar: '',
      level: 1,
      exp: 0,
      totalLikes: 0,
      followers: 0,
      following: 0,
      works: [],
      badges: [],
      joinedAt: new Date(),
    };
    set({ currentUser: mockUser, isLoggedIn: true });
    return true;
  },
  
  logout: () => set({ currentUser: null, isLoggedIn: false }),
  
  addWork: (work) => {
    const { currentUser } = get();
    if (currentUser) {
      const updatedWorks = [...currentUser.works, work];
      const newExp = currentUser.exp + Math.floor(work.complexity * 10);
      const newLevel = Math.floor(newExp / 100) + 1;
      
      set({
        currentUser: {
          ...currentUser,
          works: updatedWorks,
          exp: newExp,
          level: newLevel,
        },
      });
    }
  },
  
  likeWork: (workId) => {
    const { currentUser } = get();
    if (currentUser) {
      const updatedWorks = currentUser.works.map((work) =>
        work.id === workId ? { ...work, likes: work.likes + 1 } : work
      );
      set({
        currentUser: {
          ...currentUser,
          works: updatedWorks,
          totalLikes: currentUser.totalLikes + 1,
        },
      });
    }
  },
  
  addExp: (amount) => {
    const { currentUser } = get();
    if (currentUser) {
      const newExp = currentUser.exp + amount;
      const newLevel = Math.floor(newExp / 100) + 1;
      set({
        currentUser: {
          ...currentUser,
          exp: newExp,
          level: newLevel,
        },
      });
    }
  },
}));
