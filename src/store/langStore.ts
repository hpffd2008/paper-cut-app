import { create } from 'zustand';

type Lang = 'zh' | 'en';

interface LangStore {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  // Layout nav
  'nav.home': { zh: '首页', en: 'Home' },
  'nav.studio': { zh: '创作室', en: 'Studio' },
  'nav.ai': { zh: 'AI剪纸', en: 'AI Cut' },
  'nav.community': { zh: '社区', en: 'Community' },
  'nav.profile': { zh: '我的', en: 'Profile' },
  'nav.login': { zh: '登录', en: 'Login' },
  'footer.text': { zh: '© 2024 剪纸生花 - 传承非遗文化，剪出精彩人生', en: '© 2024 Paper-Cut Art — Inheriting Intangible Cultural Heritage' },

  // Studio tabs
  'studio.single': { zh: '单剪', en: 'Free Cut' },
  'studio.double': { zh: '对折', en: 'Fold' },
  'studio.tuanhua': { zh: '团花', en: 'Rosette' },
  'studio.single.desc': { zh: '自由剪裁', en: 'Free Style' },
  'studio.double.desc': { zh: '左右对称', en: 'Symmetry' },
  'studio.tuanhua.desc': { zh: '多角对称', en: 'Multi-fold' },
  'studio.freeCreate': { zh: '自由创作', en: 'Free Create' },
  'studio.publish': { zh: '发布作品', en: 'Publish' },

  // Tools
  'tool.pencil': { zh: '画笔', en: 'Pencil' },
  'tool.scissors': { zh: '剪刀', en: 'Scissors' },
  'tool.eraser': { zh: '橡皮', en: 'Eraser' },
  'tool.toolbox': { zh: '工具箱', en: 'Toolbox' },
  'tool.pencilHint': { zh: '🖊 在纸上自由绘画', en: '🖊 Draw freely on paper' },
  'tool.scissorsHint': { zh: '✂️ 画闭合路径或从边界穿入穿出裁剪', en: '✂️ Draw closed path or cut through edges' },
  'tool.eraserHint': { zh: '🧹 擦除画布上的内容', en: '🧹 Erase content on canvas' },
  'tool.eraserSize': { zh: '橡皮大小', en: 'Eraser Size' },
  'tool.brushWidth': { zh: '笔触粗细', en: 'Brush Width' },
  'tool.brushColor': { zh: '笔触颜色', en: 'Brush Color' },

  // Paper
  'paper.settings': { zh: '纸张设置', en: 'Paper Settings' },
  'paper.color': { zh: '纸张颜色', en: 'Paper Color' },
  'paper.thickness': { zh: '纸张厚度', en: 'Thickness' },

  // History
  'history.title': { zh: '操作历史', en: 'History' },
  'history.clear': { zh: '清空画布', en: 'Clear Canvas' },

  // Templates
  'template.title': { zh: '剪纸模板', en: 'Templates' },
  'template.guide': { zh: '📐 模板图案参考', en: '📐 Template Guide' },
  'template.guideHint': { zh: '对照此图案在红纸上进行裁剪', en: 'Cut along this pattern on red paper' },

  // Culture
  'culture.title': { zh: '文化故事', en: 'Cultural Story' },

  // Backgrounds
  'bg.title': { zh: '虚拟背景', en: 'Virtual Backgrounds' },

  // Collab
  'collab.title': { zh: '双人协作', en: 'Collaboration' },
  'collab.desc': { zh: '邀请好友一起创作，完成精美的合作作品', en: 'Invite friends to create together' },
  'collab.invite': { zh: '邀请好友协作', en: 'Invite Friends' },

  // Preview
  'preview.simulate': { zh: '模拟剪纸', en: 'Simulate Cut' },
  'preview.download': { zh: '下载作品', en: 'Download' },
  'preview.close': { zh: '关闭', en: 'Close' },

  // Fullscreen
  'fs.title': { zh: '全屏绘图模式', en: 'Fullscreen Drawing' },
  'fs.btn': { zh: '全屏绘图', en: 'Fullscreen' },
  'fs.done': { zh: '完成', en: 'Done' },
  'fs.confirmTitle': { zh: '确认应用绘图', en: 'Confirm Apply' },
  'fs.confirmDesc': { zh: '将当前绘图内容应用到红纸上？', en: 'Apply current drawing to paper?' },
  'fs.cancel': { zh: '取消', en: 'Cancel' },
  'fs.confirm': { zh: '确定', en: 'Confirm' },
  'fs.brushSize': { zh: '粗细', en: 'Size' },

  // Publish modal
  'pub.title': { zh: '发布作品', en: 'Publish Work' },
  'pub.name': { zh: '作品名称', en: 'Work Title' },
  'pub.notes': { zh: '创作心得', en: 'Creator Notes' },
  'pub.notesPlaceholder': { zh: '分享你的创作灵感和心得...', en: 'Share your creative inspiration...' },
  'pub.cancel': { zh: '取消', en: 'Cancel' },
  'pub.submit': { zh: '立即发布', en: 'Publish Now' },

  // TuanHua
  'th.shape': { zh: '形状', en: 'Shape' },
  'th.scissorTool': { zh: '剪刀（裁剪区域）', en: 'Scissors (Cut Area)' },
  'th.eraserTool': { zh: '橡皮（恢复纸张）', en: 'Eraser (Restore Paper)' },
  'th.eraserSize': { zh: '橡皮大小', en: 'Eraser Size' },
  'th.cutSensitivity': { zh: '裁剪灵敏度', en: 'Cut Sensitivity' },
  'th.paperColor': { zh: '纸色', en: 'Color' },
  'th.save': { zh: '保存作品', en: 'Save Work' },
  'th.cutArea': { zh: '剪裁区域', en: 'Cut Area' },
  'th.cutAreaHintScissors': { zh: '画闭合路径裁剪区域，或从扇形外穿入再穿出裁剪', en: 'Draw closed path or cut through sector edges' },
  'th.cutAreaHintEraser': { zh: '用橡皮恢复已裁剪的区域', en: 'Use eraser to restore cut areas' },
  'th.preview': { zh: '展示区域', en: 'Preview' },
  'th.previewHint': { zh: '镂空区域显示为棋盘格（透明），可保存为 PNG', en: 'Cut areas shown as checkerboard (transparent), save as PNG' },
  'th.scissorMode': { zh: '✂️ 剪刀模式 — 画闭合路径或从边界穿入穿出裁剪区域', en: '✂️ Scissors — Draw closed path or cut through edges' },
  'th.eraserMode': { zh: '🧹 橡皮模式 — 恢复已剪掉的纸张', en: '🧹 Eraser — Restore cut paper' },

  // Home hero
  'home.hero.title': { zh: '剪纸生花', en: 'Paper-Cut Art' },
  'home.hero.subtitle': { zh: '传承千年非遗艺术，在指尖绽放创意之花', en: 'Inheriting thousand-year intangible heritage art, blooming creative flowers at your fingertips' },
  'home.hero.cta': { zh: '开始创作', en: 'Start Creating' },
  'home.hero.community': { zh: '探索社区', en: 'Explore Community' },

  // Home stats
  'home.stat.creators': { zh: '创作者', en: 'Creators' },
  'home.stat.works': { zh: '作品总数', en: 'Total Works' },
  'home.stat.likes': { zh: '点赞总数', en: 'Total Likes' },
  'home.stat.masters': { zh: '大师认证', en: 'Master Certified' },

  // Home tabs
  'home.tab.hot': { zh: '热门作品', en: 'Popular Works' },
  'home.tab.recent': { zh: '实时动态', en: 'Recent Activity' },
  'home.tab.more': { zh: '查看更多', en: 'View More' },

  // Home rankings
  'home.rank.title': { zh: '剪纸大师排行榜', en: 'Master Leaderboard' },
  'home.rank.master': { zh: '剪纸大师', en: 'Master' },
  'home.rank.works': { zh: '作品数', en: 'Works' },
  'home.rank.likes': { zh: '获赞数', en: 'Likes' },

  // Home challenge
  'home.challenge.title': { zh: '本周挑战赛', en: 'Weekly Challenge' },
  'home.challenge.desc': { zh: '主题：新春贺岁 - 创作属于你的生肖剪纸', en: 'Theme: Lunar New Year - Create your own zodiac paper-cut' },
  'home.challenge.participants': { zh: '参与', en: 'Joined' },
  'home.challenge.remaining': { zh: '剩余 3 天', en: '3 days left' },
  'home.challenge.join': { zh: '参与挑战', en: 'Join Challenge' },

  // Home difficulty
  'home.difficulty': { zh: '难度', en: 'Difficulty' },

  // Learning
  'nav.learning': { zh: '学习', en: 'Learn' },
  'learn.title': { zh: '剪纸教程', en: 'Paper-Cut Tutorials' },
  'learn.subtitle': { zh: '跟着大师学剪纸，从入门到精通', en: 'Learn paper-cutting from masters, from beginner to expert' },
  'learn.beginner': { zh: '入门教程', en: 'Beginner' },
  'learn.intermediate': { zh: '进阶技巧', en: 'Intermediate' },
  'learn.advanced': { zh: '高级创作', en: 'Advanced' },
  'learn.culture': { zh: '文化赏析', en: 'Culture' },
  'learn.video.duration': { zh: '分钟', en: 'min' },
  'learn.video.views': { zh: '次观看', en: 'views' },
  'learn.video.play': { zh: '开始学习', en: 'Start Learning' },

  // Duizhe
  'dz.title': { zh: '对折模式', en: 'Fold Mode' },
  'dz.desc': { zh: '即将上线，敬请期待…', en: 'Coming soon...' },
};

export const useLangStore = create<LangStore>((set, get) => ({
  lang: 'zh',
  toggleLang: () => set((s) => ({ lang: s.lang === 'zh' ? 'en' : 'zh' })),
  t: (key: string) => {
    const lang = get().lang;
    return translations[key]?.[lang] ?? key;
  },
}));
