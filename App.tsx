import React, { useState, useEffect, useRef } from 'react';
import yaml from 'js-yaml';
import { marked } from 'marked';
import { 
  FLOWER_THEMES, 
  AVAILABLE_MODELS, 
  DEFAULT_MIND_MAP_DATA, 
  TRANSLATIONS 
} from './constants';
import { 
  MindMapData, 
  AgentConfig, 
  Language, 
  FlowerTheme,
  LLMProvider
} from './types';
import { 
  transformToMindMapFormat, 
  compareDocuments, 
  runGeminiAgent,
  processSmartNote
} from './services/geminiService';
import MindMap from './components/MindMap';
import LuckyWheel from './components/LuckyWheel';
import { 
  Settings, 
  Upload, 
  Play, 
  Plus, 
  Trash2, 
  Sun, 
  Moon, 
  Palette,
  Network,
  FileText,
  X,
  Save,
  Download,
  NotebookPen,
  Highlighter,
  Wand2
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<FlowerTheme>(FLOWER_THEMES[0]);
  const [darkMode, setDarkMode] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [activeTab, setActiveTab] = useState<'mindmap' | 'analysis' | 'smartnote'>('mindmap');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mind Map
  const [mmInput, setMmInput] = useState('');
  const [mmData, setMmData] = useState<MindMapData>(DEFAULT_MIND_MAP_DATA);

  // Analysis
  const [doc1, setDoc1] = useState('');
  const [doc2, setDoc2] = useState('');
  const [agents, setAgents] = useState<AgentConfig[]>([{
    id: 1,
    name: 'Analyst 1',
    prompt: 'Summarize the key points.',
    model: 'gemini-2.5-flash',
    maxTokens: 500,
    temperature: 0.7,
    contextType: 'both',
    isLoading: false
  }]);

  // Smart Note
  const [noteInput, setNoteInput] = useState('');
  const [noteOutput, setNoteOutput] = useState('');
  const [highlightKeyword, setHighlightKeyword] = useState('');
  const [highlightColor, setHighlightColor] = useState('#fde047'); // Default yellow
  const [renderHtml, setRenderHtml] = useState('');

  // --- Effects ---
  useEffect(() => {
    // Apply Theme CSS Variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme, darkMode]);

  useEffect(() => {
    // Smart Note Renderer
    if (!noteOutput) {
      setRenderHtml('');
      return;
    }

    try {
      // 1. Parse Markdown to HTML
      let html = marked.parse(noteOutput) as string;

      // 2. Apply Highlighting (Regex on text content within HTML is tricky, simpler to replace safe strings)
      // A safe way is to replace after parsing, but avoid tags.
      if (highlightKeyword.trim()) {
        const regex = new RegExp(`(${highlightKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        // We only want to replace text outside of tags. 
        // For simplicity in this demo, we'll do a basic replace which might break attributes if keyword matches generic attr names.
        // A more robust way uses a DOM parser, but let's stick to a simpler approach for the "Neat UI" demo.
        html = html.replace(regex, `<mark style="background-color: ${highlightColor}; color: #000; border-radius: 4px; padding: 0 2px;">$1</mark>`);
      }
      setRenderHtml(html);
    } catch (e) {
      console.error(e);
      setRenderHtml('<p class="text-red-500">Error rendering markdown</p>');
    }
  }, [noteOutput, highlightKeyword, highlightColor]);

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setter(evt.target?.result as string);
    reader.readAsText(file);
  };

  const handleGenerateMindMap = async () => {
    if (!mmInput) return;
    setLoading(true);
    setError(null);
    try {
      const data = await transformToMindMapFormat(mmInput, apiKey);
      setMmData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Agents Logic
  const handleRunAgent = async (id: number) => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return;

    setAgents(prev => prev.map(a => a.id === id ? { ...a, isLoading: true, output: '' } : a));
    setError(null);

    try {
      let context = '';
      if (agent.contextType === 'doc1') context = doc1;
      else if (agent.contextType === 'doc2') context = doc2;
      else context = `Document 1:\n${doc1}\n\nDocument 2:\n${doc2}`;

      const result = await runGeminiAgent(
        agent.prompt,
        agent.model,
        agent.maxTokens,
        context,
        apiKey
      );

      setAgents(prev => prev.map(a => a.id === id ? { ...a, isLoading: false, output: result } : a));
    } catch (err: any) {
      setError(err.message);
      setAgents(prev => prev.map(a => a.id === id ? { ...a, isLoading: false } : a));
    }
  };

  const handleRunAllAgents = async () => {
    for (const agent of agents) {
      await handleRunAgent(agent.id);
    }
  };

  const downloadAgents = () => {
    const yamlStr = yaml.dump(agents);
    const blob = new Blob([yamlStr], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agents.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadAgents = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const loaded = yaml.load(evt.target?.result as string) as AgentConfig[];
        if (Array.isArray(loaded)) {
          setAgents(loaded);
          setError(null);
        } else {
          setError("Invalid YAML format: Expected a list of agents.");
        }
      } catch (err: any) {
        setError(`Failed to parse YAML: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Smart Note Logic
  const handleProcessSmartNote = async () => {
    if (!noteInput) return;
    setLoading(true);
    setError(null);
    try {
      const result = await processSmartNote(noteInput, apiKey);
      setNoteOutput(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadSmartNote = () => {
    if (!noteOutput) return;
    const blob = new Blob([noteOutput], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart-note.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Render Helpers ---

  const renderHeader = () => (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-white/10 dark:border-gray-800 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl filter drop-shadow-sm">{theme.icon}</span>
          <h1 className="text-2xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            {t('appTitle')}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowWheel(true)} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative group"
            title={t('luckyWheel')}
          >
            <Palette className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full animate-ping"></span>
          </button>
          
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>

          <button onClick={() => setLang(lang === 'en' ? 'zh-TW' : 'en')} className="font-bold text-sm px-3 py-1 border rounded-md border-gray-300 dark:border-gray-700">
            {lang === 'en' ? 'EN' : '中'}
          </button>

          <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );

  const renderMindMapTab = () => (
    <div className="grid lg:grid-cols-3 gap-8 p-6 animate-in fade-in duration-500">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-surface rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Network className="text-primary" /> {t('inputData')}
          </h2>
          <textarea
            value={mmInput}
            onChange={(e) => setMmInput(e.target.value)}
            className="w-full h-64 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none font-mono text-sm"
            placeholder={t('inputPlaceholder')}
          />
          <div className="flex gap-4 mt-4">
             <label className="flex-1 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-text font-semibold py-3 px-4 rounded-xl transition-all text-center flex items-center justify-center gap-2">
                <Upload size={18} /> {t('upload')}
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, setMmInput)} accept=".txt,.md,.csv,.json"/>
            </label>
            <button
              onClick={handleGenerateMindMap}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Thinking...' : <>{t('transform')} ✨</>}
            </button>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2">
         <div className="bg-surface rounded-2xl p-2 shadow-xl border border-gray-100 dark:border-gray-800 h-[600px] flex flex-col">
            <MindMap data={mmData} primaryColor={theme.primary} />
         </div>
      </div>
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-2 gap-6">
        {[doc1, doc2].map((doc, idx) => (
          <div key={idx} className="bg-surface rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <label className="cursor-pointer p-2 bg-gray-100 dark:bg-gray-700 rounded-full inline-flex">
                 <Upload size={16} />
                 <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, idx === 0 ? setDoc1 : setDoc2)} />
               </label>
            </div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <FileText className="text-primary" /> {idx === 0 ? t('doc1') : t('doc2')}
            </h3>
            <textarea
              value={doc}
              onChange={(e) => idx === 0 ? setDoc1(e.target.value) : setDoc2(e.target.value)}
              className="w-full h-48 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder="Paste content..."
            />
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-serif font-bold">{t('agents')}</h2>
          <div className="flex gap-2">
             <label className="cursor-pointer p-2 bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-primary hover:text-white transition-colors" title="Load Agents (YAML)">
                <Upload size={20} />
                <input type="file" className="hidden" onChange={uploadAgents} accept=".yaml,.yml"/>
             </label>
             <button onClick={downloadAgents} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-primary hover:text-white transition-colors" title="Save Agents (YAML)">
                <Save size={20} />
             </button>
             <div className="w-4" /> {/* Spacer */}
             <button onClick={() => setAgents([...agents, { id: Date.now(), name: `Analyst ${agents.length + 1}`, prompt: '', model: 'gemini-2.5-flash', maxTokens: 1000, temperature: 0.7, contextType: 'both', isLoading: false }])} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-primary hover:text-white transition-colors">
              <Plus size={20} />
             </button>
             <button onClick={handleRunAllAgents} className="px-4 py-2 bg-green-500 text-white rounded-full font-bold flex items-center gap-2 hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30">
               <Play size={18} fill="currentColor" /> {t('runAgents')}
             </button>
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-surface rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 transition-all hover:border-primary/50">
               <div className="flex justify-between items-start mb-4">
                 <input 
                   value={agent.name}
                   onChange={(e) => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, name: e.target.value } : a))}
                   className="text-lg font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary outline-none"
                 />
                 <button onClick={() => setAgents(prev => prev.filter(a => a.id !== agent.id))} className="text-red-400 hover:text-red-600">
                   <Trash2 size={18} />
                 </button>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-4">
                  <select 
                    value={agent.model}
                    onChange={(e) => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, model: e.target.value } : a))}
                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  
                  <select 
                    value={agent.contextType}
                    onChange={(e) => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, contextType: e.target.value as any } : a))}
                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="both">Both Docs</option>
                    <option value="doc1">Doc 1 Only</option>
                    <option value="doc2">Doc 2 Only</option>
                  </select>

                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-xs uppercase text-gray-400">Max Tokens:</span>
                    <input 
                      type="range" min="100" max="12000" step="100"
                      value={agent.maxTokens}
                      onChange={(e) => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, maxTokens: parseInt(e.target.value) } : a))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs font-mono w-12 text-right">{agent.maxTokens}</span>
                  </div>
               </div>

               <textarea
                 value={agent.prompt}
                 onChange={(e) => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, prompt: e.target.value } : a))}
                 className="w-full h-24 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm mb-4 focus:ring-1 focus:ring-primary outline-none resize-none"
                 placeholder="Enter instruction for this agent..."
               />

               <button 
                onClick={() => handleRunAgent(agent.id)}
                disabled={agent.isLoading}
                className="w-full py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg font-semibold transition-colors flex justify-center items-center gap-2"
               >
                 {agent.isLoading ? 'Processing...' : 'Execute Agent'}
               </button>

               {agent.output && (
                 <div className="mt-4 p-4 bg-gray-50 dark:bg-black/30 rounded-lg border-l-4 border-primary animate-in slide-in-from-top-2">
                   <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Output</h4>
                   <div className="prose prose-sm dark:prose-invert max-w-none">
                     {agent.output.split('\n').map((line, i) => <p key={i} className="my-1">{line}</p>)}
                   </div>
                 </div>
               )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSmartNoteTab = () => (
    <div className="p-6 h-[calc(100vh-12rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      {/* Left: Input */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-surface rounded-2xl p-4 shadow-xl border border-gray-100 dark:border-gray-800 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-lg flex items-center gap-2"><NotebookPen className="text-primary"/> Raw Input</h3>
             <label className="cursor-pointer text-xs flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200">
                <Upload size={14}/> Upload
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, setNoteInput)} accept=".txt,.md"/>
             </label>
          </div>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            className="flex-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none resize-none font-mono text-sm"
            placeholder="Paste your document or rough notes here..."
          />
        </div>
        
        <button
          onClick={handleProcessSmartNote}
          disabled={loading || !noteInput}
          className="w-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? 'Processing...' : <>{t('processAll')} <Wand2 className="animate-pulse" /></>}
        </button>
      </div>

      {/* Right: Output */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-surface rounded-2xl p-4 shadow-xl border border-gray-100 dark:border-gray-800 flex-1 flex flex-col overflow-hidden relative">
           {/* Toolbar */}
           <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                 <Highlighter size={16} className="text-gray-500"/>
                 <input 
                   type="text" 
                   placeholder="Keyword..." 
                   value={highlightKeyword}
                   onChange={(e) => setHighlightKeyword(e.target.value)}
                   className="w-24 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-primary outline-none text-sm"
                 />
                 <input 
                   type="color" 
                   value={highlightColor}
                   onChange={(e) => setHighlightColor(e.target.value)}
                   className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                 />
              </div>
              <div className="flex gap-2">
                 <button onClick={downloadSmartNote} disabled={!noteOutput} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 disabled:opacity-30" title="Download Markdown">
                    <Download size={18}/>
                 </button>
              </div>
           </div>

           {/* Markdown View */}
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {noteOutput ? (
                <div 
                  className="markdown-body text-text"
                  dangerouslySetInnerHTML={{ __html: renderHtml }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                  AI Generated content will appear here...
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 text-text transition-colors duration-300 font-sans selection:bg-primary selection:text-white`}>
      {renderHeader()}

      <div className="max-w-[1600px] mx-auto py-8">
        {/* Navigation */}
        <div className="flex justify-center mb-8 px-4">
          <div className="bg-surface p-1.5 rounded-2xl flex space-x-2 border border-gray-200 dark:border-gray-800 shadow-md">
             <button
              onClick={() => setActiveTab('mindmap')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'mindmap' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}
             >
               {t('mindMap')}
             </button>
             <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'analysis' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}
             >
               {t('analysis')}
             </button>
             <button
              onClick={() => setActiveTab('smartnote')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'smartnote' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}
             >
               {t('smartNote')}
             </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl flex justify-between items-center">
             <span>{error}</span>
             <button onClick={() => setError(null)}><X size={18}/></button>
          </div>
        )}

        <main>
          {activeTab === 'mindmap' && renderMindMapTab()}
          {activeTab === 'analysis' && renderAnalysisTab()}
          {activeTab === 'smartnote' && renderSmartNoteTab()}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 border border-gray-200 dark:border-gray-800">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold font-serif">{t('settings')}</h2>
               <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X/></button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-bold mb-2">{t('apiKey')}</label>
                 <input 
                   type="password"
                   value={apiKey}
                   onChange={(e) => setApiKey(e.target.value)}
                   placeholder={t('apiKeyDesc')}
                   className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"
                 />
                 <p className="text-xs text-gray-400 mt-2">The key is stored in memory only. Leave empty to use system environment variables (if configured).</p>
               </div>
               
               <div>
                  <label className="block text-sm font-bold mb-2">{t('theme')}</label>
                  <div className="grid grid-cols-5 gap-2">
                    {FLOWER_THEMES.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setTheme(t)}
                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-xl hover:scale-110 transition-transform ${theme.id === t.id ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                        style={{ backgroundColor: t.primary + '20' }}
                        title={t.name}
                      >
                        {t.icon}
                      </button>
                    ))}
                  </div>
               </div>
             </div>
             
             <button onClick={() => setShowSettings(false)} className="w-full mt-8 bg-primary text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-primary/50 transition-all">
               Done
             </button>
          </div>
        </div>
      )}

      {/* Lucky Wheel Modal */}
      {showWheel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
           <div className="relative">
              <button 
                onClick={() => setShowWheel(false)}
                className="absolute -top-12 right-0 text-white hover:text-primary transition-colors"
              >
                <X size={32} />
              </button>
              <div className="bg-surface rounded-full p-8 shadow-2xl animate-in zoom-in-95 border-4 border-primary/20">
                <LuckyWheel 
                  themes={FLOWER_THEMES} 
                  onSelect={(t) => {
                    setTheme(t);
                    setTimeout(() => setShowWheel(false), 1500); // Close after win
                  }} 
                />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;