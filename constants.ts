import { FlowerTheme, LLMModelInfo, LLMProvider, Translations } from './types';

export const FLOWER_THEMES: FlowerTheme[] = [
  { id: 'rose', name: 'Red Rose', primary: '#e11d48', secondary: '#ffe4e6', icon: '🌹' },
  { id: 'sunflower', name: 'Sunflower', primary: '#d97706', secondary: '#fef3c7', icon: '🌻' },
  { id: 'lavender', name: 'Lavender', primary: '#7c3aed', secondary: '#ede9fe', icon: '🪻' },
  { id: 'cherry', name: 'Cherry Blossom', primary: '#db2777', secondary: '#fce7f3', icon: '🌸' },
  { id: 'tulip', name: 'Orange Tulip', primary: '#ea580c', secondary: '#ffedd5', icon: '🌷' },
  { id: 'lily', name: 'White Lily', primary: '#059669', secondary: '#d1fae5', icon: '⚜️' },
  { id: 'daisy', name: 'Daisy', primary: '#ca8a04', secondary: '#fef9c3', icon: '🌼' },
  { id: 'orchid', name: 'Orchid', primary: '#9333ea', secondary: '#f3e8ff', icon: '🌺' },
  { id: 'hibiscus', name: 'Hibiscus', primary: '#dc2626', secondary: '#fee2e2', icon: '🌺' },
  { id: 'lotus', name: 'Lotus', primary: '#be185d', secondary: '#fce7f3', icon: '🪷' },
  { id: 'jasmine', name: 'Jasmine', primary: '#0d9488', secondary: '#ccfbf1', icon: '💮' },
  { id: 'poppy', name: 'Poppy', primary: '#b91c1c', secondary: '#fee2e2', icon: '⚘️' },
  { id: 'violet', name: 'Violet', primary: '#4c1d95', secondary: '#ddd6fe', icon: '🟣' },
  { id: 'dahlia', name: 'Dahlia', primary: '#9f1239', secondary: '#ffe4e6', icon: '🏵️' },
  { id: 'peony', name: 'Peony', primary: '#ec4899', secondary: '#fbcfe8', icon: '🌸' },
  { id: 'marigold', name: 'Marigold', primary: '#eab308', secondary: '#fef08a', icon: '🌼' },
  { id: 'bluebell', name: 'Bluebell', primary: '#2563eb', secondary: '#dbeafe', icon: '🔔' },
  { id: 'iris', name: 'Iris', primary: '#4338ca', secondary: '#e0e7ff', icon: '💠' },
  { id: 'camellia', name: 'Camellia', primary: '#be123c', secondary: '#ffe4e6', icon: '🌺' },
  { id: 'magnolia', name: 'Magnolia', primary: '#be185d', secondary: '#fae8ff', icon: '🌸' },
];

export const AVAILABLE_MODELS: LLMModelInfo[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: LLMProvider.GEMINI },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: LLMProvider.GEMINI },
  { id: 'gemini-2.5-flash-thinking', name: 'Gemini 2.5 Thinking', provider: LLMProvider.GEMINI }, // Conceptual alias, handled in service
];

export const TRANSLATIONS: Translations = {
  appTitle: { en: 'FlorAI Workspace', 'zh-TW': '花語 AI 工作區' },
  mindMap: { en: 'Mind Map', 'zh-TW': '思維導圖' },
  analysis: { en: 'Doc Analysis & Agents', 'zh-TW': '文檔分析與代理' },
  smartNote: { en: 'Smart Note', 'zh-TW': '智慧筆記' },
  inputData: { en: 'Input Data', 'zh-TW': '輸入數據' },
  inputPlaceholder: { en: 'Enter text to generate mind map...', 'zh-TW': '輸入文本以生成思維導圖...' },
  transform: { en: 'Transform', 'zh-TW': '轉換' },
  upload: { en: 'Upload File', 'zh-TW': '上傳文件' },
  doc1: { en: 'Document 1', 'zh-TW': '文檔 1' },
  doc2: { en: 'Document 2', 'zh-TW': '文檔 2' },
  process: { en: 'Process & Analyze', 'zh-TW': '處理並分析' },
  agents: { en: 'Agents', 'zh-TW': '代理' },
  runAgents: { en: 'Run All Agents', 'zh-TW': '運行所有代理' },
  settings: { en: 'Settings', 'zh-TW': '設置' },
  theme: { en: 'Theme', 'zh-TW': '主題' },
  luckyWheel: { en: 'Lucky Wheel', 'zh-TW': '幸運轉盤' },
  spin: { en: 'Spin!', 'zh-TW': '旋轉!' },
  apiKey: { en: 'API Key', 'zh-TW': 'API 金鑰' },
  apiKeyDesc: { en: 'Enter your Gemini API Key', 'zh-TW': '輸入您的 Gemini API 金鑰' },
  smartFormat: { en: 'Smart Format', 'zh-TW': '智慧格式化' },
  aiSummarize: { en: 'AI Summarize', 'zh-TW': 'AI 摘要' },
  aiKeywords: { en: 'AI Keywords', 'zh-TW': 'AI 關鍵詞' },
  aiQuestions: { en: 'AI Questions', 'zh-TW': 'AI 提問' },
  downloadMd: { en: 'Download Markdown', 'zh-TW': '下載 Markdown' },
  processAll: { en: 'Process All', 'zh-TW': '一鍵處理' },
  highlight: { en: 'Highlight', 'zh-TW': '高亮' },
};

export const DEFAULT_MIND_MAP_DATA = {
  nodes: [
    { id: "AI", group: 1 },
    { id: "Machine Learning", group: 2 },
    { id: "Deep Learning", group: 2 },
    { id: "NLP", group: 3 }
  ],
  links: [
    { source: "AI", target: "Machine Learning", value: 1 },
    { source: "AI", target: "Deep Learning", value: 1 },
    { source: "AI", target: "NLP", value: 1 }
  ]
};