
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, Search,
  Clock, Star, Flame, Trophy, Users,
  Send, X
} from 'lucide-react';
import { useWorksStore, Work, Comment } from '../store/worksStore';
import { useUserStore } from '../store/userStore';

const categories = ['全部', '传统', '节庆', '花鸟', '瑞兽', '人物', '现代'];
const sortOptions = [
  { value: 'hot', label: '最热', icon: Flame },
  { value: 'new', label: '最新', icon: Clock },
  { value: 'top', label: '精选', icon: Star },
];

const categoryBackgroundMap: Record<string, string[]> = {
  传统: ['traditional', 'classic'],
  节庆: ['festive'],
  花鸟: ['floral', 'nature'],
  瑞兽: ['zodiac'],
  人物: ['figure', 'character'],
  现代: ['modern'],
};

function matchesCategory(work: Work, category: string) {
  if (category === '全部') return true;
  const background = (work.background || '').toLowerCase();
  const expectedBackgrounds = categoryBackgroundMap[category] || [];
  if (expectedBackgrounds.includes(background)) return true;

  const text = `${work.title} ${work.notes}`;
  switch (category) {
    case '传统':
      return /传统|经典|窗花|民俗/.test(text);
    case '节庆':
      return /节庆|新春|贺岁|福|喜|龙凤/.test(text);
    case '花鸟':
      return /花|鸟|蝶|梅|牡丹/.test(text);
    case '瑞兽':
      return /龙|凤|虎|鱼|生肖|瑞兽/.test(text);
    case '人物':
      return /人物|仕女|孩童|角色/.test(text);
    case '现代':
      return /现代|简约/.test(text);
    default:
      return false;
  }
}

export default function Community() {
  const { works, likeWork, addComment } = useWorksStore();
  const { isLoggedIn, currentUser } = useUserStore();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [sortBy, setSortBy] = useState('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [commentText, setCommentText] = useState('');

  const filteredWorks = works.filter((work) => {
    if (searchQuery && !work.title.includes(searchQuery) && !work.authorName.includes(searchQuery)) {
      return false;
    }

    if (!matchesCategory(work, activeCategory)) {
      return false;
    }

    return true;
  });

  const sortedWorks = [...filteredWorks].sort((a, b) => {
    if (sortBy === 'hot') return b.likes - a.likes;
    if (sortBy === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'top') return b.complexity - a.complexity;
    return 0;
  });

  useEffect(() => {
    if (!selectedWork) return;
    const latest = works.find((work) => work.id === selectedWork.id);
    if (latest) setSelectedWork(latest);
  }, [works, selectedWork?.id]);

  const handleComment = () => {
    if (!selectedWork || !commentText.trim() || !isLoggedIn || !currentUser) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      content: commentText,
      createdAt: new Date(),
    };
    
    addComment(selectedWork.id, newComment);
    setCommentText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-8 h-8 text-red-600" />
            剪纸社区
          </h1>
          <p className="text-gray-500 mt-1">探索精彩作，分享创作灵感</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索作品或作者..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-4 py-2 rounded-full whitespace-nowrap transition
                ${activeCategory === cat
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-red-50 border border-gray-200'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Sort */}
        <div className="flex items-center gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`
                flex items-center gap-1 px-4 py-2 rounded-full transition
                ${sortBy === option.value
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
              `}
            >
              <option.icon className="w-4 h-4" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Challenge Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-6 mb-8 text-white"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">本周挑战赛：新春贺岁</h3>
              <p className="text-red-100">创作属于你的生肖剪纸，赢取专属勋章</p>
            </div>
          </div>
          <Link
            to="/studio"
            className="px-6 py-3 bg-white text-red-600 rounded-full font-semibold hover:bg-red-50 transition"
          >
            参与挑战
          </Link>
        </div>
      </motion.div>

      {/* Works Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedWorks.map((work, index) => (
          <WorkCard
            key={work.id}
            work={work}
            index={index}
            onLike={() => likeWork(work.id)}
            onComment={() => setSelectedWork(work)}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedWorks.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">未找到作品</h3>
          <p className="text-gray-500">尝试其他搜索词或分类</p>
        </div>
      )}

      {/* Work Detail Modal */}
      <AnimatePresence>
        {selectedWork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedWork(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image */}
                <div className="aspect-square bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                  <div className="w-48 h-48 bg-red-600/80 rounded-lg flex items-center justify-center transform rotate-45">
                    <span className="text-6xl text-white -rotate-45">✂️</span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 flex flex-col h-full max-h-[90vh] md:max-h-full overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <Link
                      to={`/profile/${selectedWork.authorId}`}
                      className="flex items-center gap-3"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedWork.authorName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{selectedWork.authorName}</h4>
                        <p className="text-sm text-gray-500">Lv.{selectedWork.authorLevel}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => setSelectedWork(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Title & Description */}
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedWork.title}</h2>
                  <p className="text-gray-600 mb-4">{selectedWork.notes}</p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                    <span className="text-sm text-gray-500">
                      难度: <span className="font-semibold text-red-600">{selectedWork.complexity.toFixed(1)}</span>
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(selectedWork.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  
                  {/* Comments */}
                  <div className="flex-1 overflow-y-auto mb-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      评论 ({selectedWork.comments.length})
                    </h4>
                    {selectedWork.comments.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">暂无评论，快来抢沙发吧~</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedWork.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm flex-shrink-0">
                              {comment.username.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800 text-sm">{comment.username}</span>
                                <span className="text-xs text-gray-400">
                                  {new Date(comment.createdAt).toLocaleString('zh-CN')}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Comment Input */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={isLoggedIn ? "说点什么..." : "请先登录"}
                      disabled={!isLoggedIn}
                      className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleComment}
                      disabled={!isLoggedIn || !commentText.trim()}
                      className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkCard({ 
  work, 
  index, 
  onLike, 
  onComment 
}: { 
  work: Work; 
  index: number;
  onLike: () => void;
  onComment: () => void;
}) {
  const isLiked = !!work.isLiked;

  const handleLike = () => {
    if (!isLiked) {
      onLike();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition group"
    >
      {/* Image */}
      <div 
        className="relative aspect-square bg-gradient-to-br from-red-100 to-red-200 overflow-hidden cursor-pointer"
        onClick={onComment}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-red-600/80 rounded-lg flex items-center justify-center transform rotate-45 group-hover:rotate-0 transition-transform duration-500">
            <span className="text-5xl text-white -rotate-45 group-hover:rotate-0 transition-transform duration-500">✂️</span>
          </div>
        </div>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <span className="text-white font-semibold">查看详情</span>
        </div>
        
        {/* Complexity Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-red-600">
          难度 {work.complexity.toFixed(1)}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Author */}
        <Link
          to={`/profile/${work.authorId}`}
          className="flex items-center gap-2 mb-3 hover:opacity-80 transition"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white text-sm">
            {work.authorName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{work.authorName}</p>
            <p className="text-xs text-gray-500">Lv.{work.authorLevel}</p>
          </div>
        </Link>
        
        <h3 className="font-bold text-gray-800 mb-1">{work.title}</h3>
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
              <span className="text-sm">{work.likes}</span>
            </motion.button>
            <button 
              onClick={onComment}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-500"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{work.comments.length}</span>
            </button>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}