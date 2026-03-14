import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, Clock, Eye, Star, ChevronRight } from 'lucide-react';
import { useLangStore } from '../store/langStore';

interface Tutorial {
  id: number;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  duration: number;
  views: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'culture';
  thumbnail: string;
}

const tutorials: Tutorial[] = [
  { id: 1, titleZh: '剪纸入门：认识工具与材料', titleEn: 'Getting Started: Tools & Materials', descZh: '学习剪纸所需的基本工具和红纸选择技巧', descEn: 'Learn basic tools and paper selection techniques', duration: 12, views: 8520, level: 'beginner', thumbnail: '✂️' },
  { id: 2, titleZh: '基础剪法：对折与窗花', titleEn: 'Basic Cuts: Folding & Window Flowers', descZh: '掌握对折剪纸和简单窗花的制作方法', descEn: 'Master folding techniques and simple window flowers', duration: 18, views: 6340, level: 'beginner', thumbnail: '🌸' },
  { id: 3, titleZh: '喜字剪纸全教程', titleEn: 'Double Happiness Tutorial', descZh: '从零开始学习传统喜字的剪法', descEn: 'Learn to cut the traditional double happiness character', duration: 15, views: 12680, level: 'beginner', thumbnail: '囍' },
  { id: 4, titleZh: '十二生肖系列：马', titleEn: 'Zodiac Series: Horse', descZh: '学习马的剪纸技巧，掌握动物造型要点', descEn: 'Learn horse paper-cutting techniques', duration: 25, views: 4890, level: 'intermediate', thumbnail: '🐴' },
  { id: 5, titleZh: '团花剪纸进阶', titleEn: 'Advanced Rosette Patterns', descZh: '多角对称团花的设计与裁剪技巧', descEn: 'Design and cutting techniques for multi-fold rosettes', duration: 30, views: 3560, level: 'intermediate', thumbnail: '🌺' },
  { id: 6, titleZh: '阴阳结合剪法', titleEn: 'Yin-Yang Combined Cutting', descZh: '学习阳剪和阴剪的结合运用', descEn: 'Learn to combine positive and negative cutting', duration: 22, views: 2780, level: 'intermediate', thumbnail: '☯️' },
  { id: 7, titleZh: '大型创作：龙凤呈祥', titleEn: 'Large Work: Dragon & Phoenix', descZh: '挑战大尺寸复杂剪纸作品的创作过程', descEn: 'Challenge large-scale complex paper-cutting creation', duration: 45, views: 5120, level: 'advanced', thumbnail: '🐉' },
  { id: 8, titleZh: '剪纸的历史与文化', titleEn: 'History & Culture of Paper-Cutting', descZh: '了解中国剪纸的千年发展历程与文化内涵', descEn: 'Explore the thousand-year history and cultural significance', duration: 20, views: 9340, level: 'culture', thumbnail: '📜' },
  { id: 9, titleZh: '各地剪纸风格鉴赏', titleEn: 'Regional Styles Appreciation', descZh: '比较南北方剪纸流派的艺术特色', descEn: 'Compare artistic styles of northern and southern schools', duration: 18, views: 4210, level: 'culture', thumbnail: '🎨' },
];

const levelColors: Record<string, string> = {
  beginner: 'from-green-400 to-green-600',
  intermediate: 'from-blue-400 to-blue-600',
  advanced: 'from-purple-400 to-purple-600',
  culture: 'from-amber-400 to-amber-600',
};

export default function Learning() {
  const { lang, t } = useLangStore();
  const [activeLevel, setActiveLevel] = useState<string>('all');

  const levels = [
    { key: 'all', label: lang === 'zh' ? '全部' : 'All' },
    { key: 'beginner', label: t('learn.beginner') },
    { key: 'intermediate', label: t('learn.intermediate') },
    { key: 'advanced', label: t('learn.advanced') },
    { key: 'culture', label: t('learn.culture') },
  ];

  const filteredTutorials = activeLevel === 'all' ? tutorials : tutorials.filter(tut => tut.level === activeLevel);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full mb-4">
          <BookOpen className="w-5 h-5" />
          <span className="font-medium">{t('learn.title')}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">{t('learn.title')}</h1>
        <p className="text-gray-500 text-lg max-w-lg mx-auto">{t('learn.subtitle')}</p>
      </motion.div>

      {/* Level Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {levels.map((level) => (
          <button
            key={level.key}
            onClick={() => setActiveLevel(level.key)}
            className={`px-5 py-2 rounded-full font-medium transition ${
              activeLevel === level.key
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            {level.label}
          </button>
        ))}
      </div>

      {/* Tutorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.map((tutorial, index) => (
          <motion.div
            key={tutorial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition group cursor-pointer"
          >
            {/* Thumbnail */}
            <div className={`relative aspect-video bg-gradient-to-br ${levelColors[tutorial.level]} flex items-center justify-center`}>
              <span className="text-6xl">{tutorial.thumbnail}</span>
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                  <Play className="w-7 h-7 text-red-600 ml-1" />
                </div>
              </div>
              {/* Level badge */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700">
                {levels.find(l => l.key === tutorial.level)?.label}
              </div>
              {/* Duration */}
              <div className="absolute bottom-3 right-3 bg-black/60 text-white rounded-lg px-2 py-1 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {tutorial.duration} {t('learn.video.duration')}
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="font-bold text-gray-800 mb-2 group-hover:text-red-600 transition">
                {lang === 'zh' ? tutorial.titleZh : tutorial.titleEn}
              </h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {lang === 'zh' ? tutorial.descZh : tutorial.descEn}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{tutorial.views.toLocaleString()} {t('learn.video.views')}</span>
                </div>
                <button className="flex items-center gap-1 text-red-600 font-medium text-sm hover:text-red-700 transition">
                  {t('learn.video.play')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
