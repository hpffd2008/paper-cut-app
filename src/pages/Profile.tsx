import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Settings, Award, Scissors, Heart, Star,
  Calendar, TrendingUp, Users, Edit3, Bell, LogOut,
  ChevronRight, Grid3X3, BookOpen, Target, Medal
} from 'lucide-react';
import { useUserStore, Badge } from '../store/userStore';
import { useWorksStore } from '../store/worksStore';

const badges: Badge[] = [
  { id: '1', name: '初出茅庐', icon: '🌱', description: '完成第一幅作品' },
  { id: '2', name: '剪纸新秀', icon: '✂️', description: '获得10个赞' },
  { id: '3', name: '技艺精湛', icon: '⭐', description: '达到5级' },
  { id: '4', name: '社区明星', icon: '🌟', description: '获得100个赞' },
  { id: '5', name: '剪纸大师', icon: '👑', description: '达到10级' },
  { id: '6', name: '创意达人', icon: '💡', description: '创作10幅不同风格作品' },
  { id: '7', name: '人气之王', icon: '🔥', description: '单幅作品获赞超过50' },
  { id: '8', name: '挑战勇士', icon: '🏆', description: '参与5次挑战赛' },
];

const milestones = [
  { level: 1, title: '初学者', reward: '解锁基础模板' },
  { level: 3, title: '学徒', reward: '解锁传统配色' },
  { level: 5, title: '熟练工', reward: '解锁高级纹样' },
  { level: 7, title: '匠人', reward: '解锁稀有背景' },
  { level: 10, title: '大师', reward: '解锁全部功能' },
];

export default function Profile() {
  const { userId } = useParams();
  const { currentUser, isLoggedIn, logout } = useUserStore();
  const { works } = useWorksStore();
  const [activeTab, setActiveTab] = useState<'works' | 'badges' | 'growth'>('works');
  
  // If viewing own profile or no userId
  const isOwnProfile = !userId || userId === currentUser?.id;
  const displayUser = isOwnProfile ? currentUser : null;
  
  // Get user's works
  const userWorks = works.filter(w => 
    isOwnProfile ? w.authorId === currentUser?.id : w.authorId === userId
  );

  if (!isLoggedIn || !displayUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">请先登录</h2>
        <p className="text-gray-500 mb-8">登录后可查看个人中心，管理作品和勋章</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
        >
          立即登录
        </Link>
      </div>
    );
  }

  const expProgress = (displayUser.exp % 100) / 100 * 100;
  const nextLevel = displayUser.level + 1;
  const nextMilestone = milestones.find(m => m.level > displayUser.level);
  const unlockedBadges = badges.slice(0, Math.min(displayUser.level, badges.length));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="profile-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="1" fill="white" />
            </pattern>
            <rect fill="url(#profile-pattern)" width="100" height="100" />
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center text-5xl font-bold backdrop-blur-sm border-4 border-white/30">
              {displayUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-lg shadow-lg">
              {displayUser.level}
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{displayUser.username}</h1>
            <p className="text-red-200 mb-4">
              加入于 {new Date(displayUser.joinedAt).toLocaleDateString('zh-CN')}
            </p>
            
            {/* Level Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>等级 {displayUser.level}</span>
                <span>等级 {nextLevel}</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${expProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                />
              </div>
              <p className="text-xs text-red-200 mt-1">
                经验值: {displayUser.exp % 100} / 100
              </p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <p className="text-2xl font-bold">{userWorks.length}</p>
                <p className="text-xs text-red-200">作品</p>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <p className="text-2xl font-bold">{displayUser.totalLikes}</p>
                <p className="text-xs text-red-200">获赞</p>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <p className="text-2xl font-bold">{unlockedBadges.length}</p>
                <p className="text-xs text-red-200">勋章</p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          {isOwnProfile && (
            <div className="flex flex-col gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                <Edit3 className="w-4 h-4" />
                编辑资料
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                <Settings className="w-4 h-4" />
                设置
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition text-red-200"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'works', label: '我的作品', icon: Grid3X3 },
          { id: 'badges', label: '荣誉勋章', icon: Award },
          { id: 'growth', label: '成长轨迹', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap transition
              ${activeTab === tab.id
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-red-50 border border-gray-200'}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'works' && (
          <motion.div
            key="works"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {userWorks.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">还没有作品</h3>
                <p className="text-gray-500 mb-6">去创作室开始你的第一幅剪纸作品吧</p>
                <Link
                  to="/studio"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-md"
                >
                  <Scissors className="w-4 h-4" />
                  开始创作
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userWorks.map((work, index) => (
                  <motion.div
                    key={work.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg"
                  >
                    <div className="aspect-square bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                      <div className="w-24 h-24 bg-red-600/80 rounded-lg flex items-center justify-center transform rotate-45">
                        <span className="text-4xl text-white -rotate-45">✂️</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800">{work.title}</h3>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-500" /> {work.likes}
                        </span>
                        <span>{new Date(work.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'badges' && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {badges.map((badge, index) => {
              const isUnlocked = index < unlockedBadges.length;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * index }}
                  className={`
                    bg-white rounded-2xl p-6 text-center shadow-lg transition
                    ${isUnlocked ? '' : 'opacity-50 grayscale'}
                  `}
                >
                  <div className="text-5xl mb-3">{badge.icon}</div>
                  <h4 className="font-bold text-gray-800 mb-1">{badge.name}</h4>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                  {isUnlocked && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      已解锁
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'growth' && (
          <motion.div
            key="growth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-red-600" />
              成长里程碑
            </h3>
            
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
              
              <div className="space-y-6">
                {milestones.map((milestone, index) => {
                  const isCompleted = displayUser.level >= milestone.level;
                  const isCurrent = displayUser.level < milestone.level && 
                    (index === 0 || displayUser.level >= milestones[index - 1].level);
                  
                  return (
                    <motion.div
                      key={milestone.level}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start gap-4 relative"
                    >
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center z-10
                        ${isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-gray-200 text-gray-400'}
                      `}>
                        {isCompleted ? '✓' : milestone.level}
                      </div>
                      <div className={`flex-1 p-4 rounded-xl ${
                        isCompleted ? 'bg-green-50' : isCurrent ? 'bg-red-50' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-800">{milestone.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isCompleted 
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            Lv.{milestone.level}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          奖励: {milestone.reward}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Next Goal */}
            {nextMilestone && (
              <div className="mt-8 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  下一个目标
                </h4>
                <p className="text-gray-700">
                  再升 <span className="font-bold text-red-600">{nextMilestone.level - displayUser.level}</span> 级
                  即可达成「{nextMilestone.title}」，解锁 {nextMilestone.reward}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
