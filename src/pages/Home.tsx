import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, MessageCircle, Eye, Flame, Clock, Users, 
  TrendingUp, Scissors, ChevronRight, Star, Award
} from 'lucide-react';
import { useWorksStore, Work, Activity } from '../store/worksStore';
import { useLangStore } from '../store/langStore';

/* Shake animation keyframes for horse card click */
const shakeAnimation = {
  shake: {
    rotate: [0, -3, 3, -3, 3, -2, 2, -1, 1, 0],
    transition: { duration: 0.6, ease: 'easeInOut' }
  }
};

export default function Home() {
  const { hotWorks, recentActivities } = useWorksStore();
  const { t, lang } = useLangStore();
  const [activeTab, setActiveTab] = useState<'hot' | 'recent'>('hot');
  const [isShaking, setIsShaking] = useState(false);

  const handleHorseClick = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 700);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative p-8 md:p-12 mb-12 overflow-hidden"
      >
        {/* Background: 对马团花 - large, left-aligned, half off-screen, rotating, 70% opacity */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, rotate: 360 }}
          transition={{ opacity: { duration: 1 }, rotate: { duration: 40, repeat: Infinity, ease: 'linear' } }}
          className="absolute pointer-events-none"
          style={{
            width: '520px',
            height: '520px',
            top: '-40px',
            left: '-260px',
            opacity: 0.7,
            zIndex: 0,
          }}
        >
          <img 
            src="/images/tuanhua-hero.png" 
            alt="团花背景" 
            className="w-full h-full object-contain" 
          />
        </motion.div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-bold text-red-800 mb-4 tracking-wide"
              style={{ fontSize: '84px', lineHeight: 1.1 }}
            >
              {t('home.hero.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-red-600/80 text-lg mb-6 max-w-md"
            >
              {t('home.hero.subtitle')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3 justify-center md:justify-start"
            >
              <Link
                to="/studio"
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition shadow-lg"
              >
                <Scissors className="w-5 h-5" />
                {t('home.hero.cta')}
              </Link>
              <Link
                to="/community"
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-full font-semibold hover:bg-red-100 transition border border-red-200"
              >
                <Users className="w-5 h-5" />
                {t('home.hero.community')}
              </Link>
            </motion.div>
          </div>
          
          {/* Horse Paper-cut Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={handleHorseClick}
            className="relative w-64 h-72 md:w-80 md:h-[360px] flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer shadow-xl border-2 border-amber-200/60"
            style={{ background: 'linear-gradient(135deg, #fef9e7 0%, #fdf6e3 50%, #fef3cd 100%)' }}
          >
            {/* Faint 隶书 "馬" character background */}
            <div 
              className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
              style={{
                fontFamily: "'LiSu', 'STLiti', 'FangSong', 'KaiTi', serif",
                fontSize: '220px',
                color: 'rgba(180, 120, 60, 0.08)',
                fontWeight: 'bold',
                lineHeight: 1,
              }}
            >
              馬
            </div>
            
            {/* Horse paper-cut image */}
            <motion.div
              className="relative z-10 w-full h-full flex items-center justify-center p-4"
              animate={isShaking ? shakeAnimation.shake : {}}
            >
              <img 
                src="/images/horse-papercut-user.jpg" 
                alt="马剪纸" 
                className="w-full h-full object-contain drop-shadow-lg rounded-lg"
              />
            </motion.div>
            
            {/* Subtle frame effect */}
            <div className="absolute inset-2 border border-amber-300/30 rounded-xl pointer-events-none" />
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { icon: Users, labelKey: 'home.stat.creators', value: '12,580', color: 'from-blue-500 to-blue-600' },
          { icon: Scissors, labelKey: 'home.stat.works', value: '45,892', color: 'from-red-500 to-red-600' },
          { icon: Heart, labelKey: 'home.stat.likes', value: '328K', color: 'from-pink-500 to-pink-600' },
          { icon: Award, labelKey: 'home.stat.masters', value: '156', color: 'from-yellow-500 to-yellow-600' },
        ].map((stat, index) => (
          <motion.div
            key={stat.labelKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 * index }}
            className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500">{t(stat.labelKey)}</p>
          </motion.div>
        ))}
      </section>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab('hot')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full transition ${
              activeTab === 'hot'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <Flame className="w-4 h-4" />
            {t('home.tab.hot')}
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full transition ${
              activeTab === 'recent'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            {t('home.tab.recent')}
          </button>
        </div>
        
        <Link
          to="/community"
          className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
        >
          {t('home.tab.more')} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'hot' ? (
          <motion.section
            key="hot"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {hotWorks.map((work, index) => (
              <WorkCard key={work.id} work={work} index={index} />
            ))}
          </motion.section>
        ) : (
          <motion.section
            key="recent"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {recentActivities.map((activity, index) => (
              <ActivityCard key={activity.id} activity={activity} index={index} />
            ))}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Rankings Section */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-red-600" />
            {t('home.rank.title')}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { rank: 1, nameZh: '剪纸大师', nameEn: 'Paper Master', level: 10, works: 156, likes: 12580, medal: '👑' },
            { rank: 2, nameZh: '民俗传人', nameEn: 'Folk Heir', level: 9, works: 134, likes: 10892, medal: '🥈' },
            { rank: 3, nameZh: '花样剪纸', nameEn: 'Fancy Cuts', level: 8, works: 98, likes: 8654, medal: '🥉' },
          ].map((master, index) => {
            const name = lang === 'zh' ? master.nameZh : master.nameEn;
            return (
            <motion.div
              key={master.rank}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className={`
                relative bg-white rounded-2xl p-6 shadow-lg border-2
                ${master.rank === 1 ? 'border-yellow-400' : master.rank === 2 ? 'border-gray-300' : 'border-amber-600'}
              `}
            >
              <div className="absolute -top-3 -right-3 text-4xl">{master.medal}</div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      Lv.{master.level}
                    </span>
                    <span className="text-xs text-gray-500">{t('home.rank.master')}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-gray-800">{master.works}</p>
                  <p className="text-xs text-gray-500">{t('home.rank.works')}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-red-600">{master.likes.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{t('home.rank.likes')}</p>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </section>

      {/* Challenge Section */}
      <section className="mt-12 bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-8 border border-red-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-red-800 mb-2 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              {t('home.challenge.title')}
            </h2>
            <p className="text-red-700 mb-4">{t('home.challenge.desc')}</p>
            <div className="flex items-center gap-4 text-sm text-red-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> 1,280 {t('home.challenge.participants')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {t('home.challenge.remaining')}
              </span>
            </div>
          </div>
          <Link
            to="/studio"
            className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition shadow-lg"
          >
            {t('home.challenge.join')}
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function WorkCard({ work, index }: { work: Work; index: number }) {
  const { likeWork } = useWorksStore();
  const { t } = useLangStore();
  const [isLiked, setIsLiked] = useState(work.isLiked);

  const handleLike = () => {
    if (!isLiked) {
      likeWork(work.id);
      setIsLiked(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 * index }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition group"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-red-100 to-red-200 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-red-600/80 rounded-lg flex items-center justify-center transform rotate-45 group-hover:rotate-0 transition-transform duration-500">
            <Scissors className="w-16 h-16 text-white -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition" />
        
        {/* Complexity Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-red-600">
          {t('home.difficulty')} {work.complexity.toFixed(1)}
        </div>
        
        {/* Quick Actions */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
          <Link
            to={`/profile/${work.authorId}`}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1"
          >
            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">
              {work.authorName.charAt(0)}
            </div>
            <span className="text-sm font-medium text-gray-800">{work.authorName}</span>
          </Link>
          <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition">
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-2">{work.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{work.notes}</p>
        
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{work.likes + (isLiked && !work.isLiked ? 1 : 0)}</span>
            </motion.button>
            <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{work.comments.length}</span>
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(work.createdAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const { lang } = useLangStore();

  const getActivityText = () => {
    if (lang === 'en') {
      switch (activity.type) {
        case 'create': return `published "${activity.workTitle}"`;
        case 'like': return `liked "${activity.workTitle}"`;
        case 'comment': return `commented on "${activity.workTitle}"`;
        case 'follow': return `followed ${activity.targetUsername}`;
        default: return '';
      }
    }
    switch (activity.type) {
      case 'create': return `发布了新作品《${activity.workTitle}》`;
      case 'like': return `点赞了作品《${activity.workTitle}》`;
      case 'comment': return `评论了作品《${activity.workTitle}》`;
      case 'follow': return `关注了 ${activity.targetUsername}`;
      default: return '';
    }
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'create': return <Scissors className="w-4 h-4" />;
      case 'like': return <Heart className="w-4 h-4 fill-current" />;
      case 'comment': return <MessageCircle className="w-4 h-4" />;
      case 'follow': return <Users className="w-4 h-4" />;
      default: return null;
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case 'create': return 'bg-green-100 text-green-600';
      case 'like': return 'bg-red-100 text-red-600';
      case 'comment': return 'bg-blue-100 text-blue-600';
      case 'follow': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex items-center gap-4"
    >
      <Link to={`/profile/${activity.userId}`} className="flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold">
          {activity.username.charAt(0)}
        </div>
      </Link>
      
      <div className="flex-1 min-w-0">
        <p className="text-gray-800">
          <Link to={`/profile/${activity.userId}`} className="font-semibold hover:text-red-600">
            {activity.username}
          </Link>
          <span className="text-gray-600 ml-1">{getActivityText()}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(activity.createdAt).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}
        </p>
      </div>
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor()}`}>
        {getActivityIcon()}
      </div>
    </motion.div>
  );
}
