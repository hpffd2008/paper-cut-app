import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Sparkles, Image, Download, RefreshCw, Save,
  Palette, History, Trash2, Zap
} from 'lucide-react';

const styles = [
  { id: 'traditional', name: '传统风格', icon: '🏮', description: '经典中国剪纸风格' },
  { id: 'modern', name: '现代风格', icon: '✨', description: '简约现代设计' },
  { id: 'festive', name: '节庆风格', icon: '🧧', description: '喜庆节日主题' },
  { id: 'nature', name: '自然风格', icon: '🌸', description: '花鸟虫鱼主题' },
];

const colorOptions = [
  { name: '中国红', color: '#c62828' },
  { name: '金黄', color: '#ffc107' },
  { name: '墨黑', color: '#212121' },
  { name: '翠绿', color: '#2e7d32' },
  { name: '宝蓝', color: '#1565c0' },
];

const stylePromptMap: Record<string, string> = {
  traditional: '传统民间窗花风格',
  modern: '现代简化剪纸风格',
  festive: '节庆吉祥剪纸风格',
  nature: '花鸟草木自然主题剪纸风格',
};

interface GeneratedWork {
  id: string;
  prompt: string;
  style: string;
  color: string;
  imageUrl: string;
  createdAt: Date;
}
interface PendingAiInputImagePayload {
  source: 'studio' | 'upload';
  mimeType: string;
  dataUrl: string;
  createdAt: number;
}
export default function AIGeneration() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('traditional');
  const [selectedColor, setSelectedColor] = useState('#c62828');
  const [complexity, setComplexity] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedWork[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingAiInputImage, setPendingAiInputImage] = useState<PendingAiInputImagePayload | null>(null);
  const [inputImagePreviewUrl, setInputImagePreviewUrl] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
useEffect(() => {
  const raw = sessionStorage.getItem('pendingAiInputImage');
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as PendingAiInputImagePayload;
    if (
      parsed &&
      typeof parsed.dataUrl === 'string' &&
      typeof parsed.mimeType === 'string' &&
      (parsed.source === 'studio' || parsed.source === 'upload')
    ) {
      setPendingAiInputImage(parsed);
      setInputImagePreviewUrl(parsed.dataUrl);
    }
  } catch (error) {
    console.error('读取 pendingAiInputImage 失败：', error);
  } finally {
    sessionStorage.removeItem('pendingAiInputImage');
  }
}, []);
  const handleGenerate = async () => {
  if (!prompt.trim() && !pendingAiInputImage) {
    alert('请输入剪纸描述');
    return;
  }

  setIsGenerating(true);
  setGeneratedImage(null);

  try {
    const endpoint =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/generate'
        : '/api/generate';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: pendingAiInputImage ? 'image-to-image' : 'text-to-image',
        prompt: `主题：${prompt}；风格偏好：${stylePromptMap[selectedStyle] || selectedStyle}；颜色偏好：${selectedColor}；复杂度：${complexity}`,
        inputImage: pendingAiInputImage?.dataUrl ?? null,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.image) {
      console.error('后端返回：', data);
      alert(
        data?.detail?.message ||
        data?.detail?.code ||
        data?.error ||
        '生成失败'
      );
      return;
    }

    setGeneratedImage(data.image);

    const newWork: GeneratedWork = {
      id: Date.now().toString(),
      prompt,
      style: selectedStyle,
      color: selectedColor,
      imageUrl: data.image,
      createdAt: new Date(),
    };

    setHistory((prev) => [newWork, ...prev]);
  } catch (error) {
    console.error(error);
    alert('请求失败，请确认后端已启动');
  } finally {
    setIsGenerating(false);
  }
};

  const handleSave = () => {
    if (generatedImage) {
      alert('作品已保存到作品集！');
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.download = `ai-papercut-${Date.now()}.png`;
      link.href = generatedImage;
      link.click();
    }
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };
const handleUploadInputImage = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('当前只支持图片上传');
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;

    setPendingAiInputImage({
      source: 'upload',
      mimeType: file.type || 'image/png',
      dataUrl,
      createdAt: Date.now(),
    });
    setInputImagePreviewUrl(dataUrl);
  };

  reader.readAsDataURL(file);
  e.target.value = '';
};

const handleRemoveInputImage = () => {
  setPendingAiInputImage(null);
  setInputImagePreviewUrl(null);
};
  const suggestions = [
    '龙凤呈祥，寓意吉祥',
    '双喜临门，喜庆风格',
    '锦鲤戏水，年年有余',
    '梅花傲雪，坚韧不拔',
    '蝴蝶戏花，春意盎然',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-red-800 flex items-center justify-center gap-2 mb-2">
          <Wand2 className="w-8 h-8" />
          AI 智能剪纸
        </h1>
        <p className="text-gray-600">输入描述，AI为你生成独特的剪纸艺术作品</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              描述你想要的剪纸
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：龙凤呈祥，传统中国风格，寓意吉祥如意..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="mt-3">
  <input
    ref={uploadInputRef}
    type="file"
    accept="image/*"
    onChange={handleUploadInputImage}
    className="hidden"
  />

  <div className="flex items-center gap-2">
    <button
      onClick={() => uploadInputRef.current?.click()}
      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
    >
      {pendingAiInputImage ? '替换图片' : '上传图片附件'}
    </button>

    {pendingAiInputImage && (
      <button
        onClick={handleRemoveInputImage}
        className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:text-red-600 hover:border-red-200 transition"
      >
        移除图片
      </button>
    )}
  </div>
</div>

{inputImagePreviewUrl && pendingAiInputImage && (
  <div className="mt-3 p-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center gap-3">
    <img
      src={inputImagePreviewUrl}
      alt="输入附件"
      className="w-14 h-14 object-cover rounded-md border border-gray-200"
    />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-700 font-medium">待处理图片附件</p>
      <p className="text-xs text-gray-500 truncate">
        来源：{pendingAiInputImage.source === 'studio' ? '来自创作室' : '本地上传'}
      </p>
    </div>
  </div>
)}
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">快速提示：</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(suggestion)}
                    className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition"
                  >
                    {suggestion.split('，')[0]}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-red-600" />
              选择风格
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`
                    p-4 rounded-xl border-2 transition text-center
                    ${selectedStyle === style.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-100 hover:border-red-200'}
                  `}
                >
                  <div className="text-2xl mb-2">{style.icon}</div>
                  <p className="font-medium text-gray-800 text-sm">{style.name}</p>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              颜色与复杂度
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">剪纸颜色</p>
              <div className="flex gap-3">
                {colorOptions.map((option) => (
                  <button
                    key={option.color}
                    onClick={() => setSelectedColor(option.color)}
                    className={`
                      w-10 h-10 rounded-full transition-transform
                      ${selectedColor === option.color
                        ? 'ring-2 ring-offset-2 ring-red-500 scale-110'
                        : 'hover:scale-110'}
                    `}
                    style={{ backgroundColor: option.color }}
                    title={option.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">复杂度</p>
                <span className="text-sm font-medium text-red-600">{complexity}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={complexity}
                onChange={(e) => setComplexity(parseInt(e.target.value))}
                className="w-full accent-red-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>简约</span>
                <span>复杂</span>
              </div>
            </div>
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-semibold text-lg shadow-lg hover:from-red-700 hover:to-red-800 transition disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI生成中...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                生成剪纸
              </>
            )}
          </motion.button>
        </div>

        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Image className="w-5 h-5 text-red-600" />
                生成预览
              </h3>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition"
              >
                <History className="w-4 h-4" />
                历史记录 ({history.length})
              </button>
            </div>

            <div
              className="aspect-square max-w-lg mx-auto rounded-xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: '#fff5e6' }}
            >
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <div className="w-20 h-20 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">AI正在创作剪纸艺术...</p>
                    <p className="text-sm text-gray-400 mt-2">正在调用AI模型生成中，请稍候</p>
                    <div className="flex items-center gap-1 justify-center mt-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                ) : generatedImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full h-full flex items-center justify-center p-4"
                  >
                    <img
                      ref={imgRef}
                      src={generatedImage}
                      alt="AI生成的剪纸作品"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
                    />
                    {selectedColor !== '#c62828' && (
                      <div
                        className="absolute inset-4 rounded-lg pointer-events-none mix-blend-color"
                        style={{ backgroundColor: selectedColor, opacity: 0.3 }}
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center p-8"
                  >
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wand2 className="w-12 h-12 text-red-300" />
                    </div>
                    <p className="text-gray-500 mb-2">输入描述并点击生成</p>
                    <p className="text-sm text-gray-400">AI将为你创作独特的剪纸艺术</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {generatedImage && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex items-center justify-center gap-4 mt-6"
                >
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重新生成
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                  >
                    <Save className="w-4 h-4" />
                    保存作品
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-5 py-2 bg-white border-2 border-red-600 text-red-600 rounded-full hover:bg-red-50 transition"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {showHistory && history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 bg-white rounded-2xl p-6 shadow-lg overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-600" />
                    生成历史
                  </h3>
                  <button
                    onClick={() => setHistory([])}
                    className="text-sm text-gray-500 hover:text-red-600 transition"
                  >
                    清空历史
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {history.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="relative group rounded-xl overflow-hidden border border-gray-100 hover:border-red-200 transition cursor-pointer"
                      onClick={() => setGeneratedImage(item.imageUrl)}
                    >
                      <div className="aspect-square flex items-center justify-center bg-[#fff5e6]">
                        <img
                          src={item.imageUrl}
                          alt={item.prompt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-gray-600 truncate">{item.prompt}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHistory(item.id);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}