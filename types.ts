export interface FlowerTheme {
  id: string;
  name: string;
  primary: string; // Hex
  secondary: string; // Hex
  icon: string;
}

export interface MindMapNode {
  id: string;
  group?: number;
  val?: number;
}

export interface MindMapLink {
  source: string;
  target: string;
  value: number;
}

export interface MindMapData {
  nodes: MindMapNode[];
  links: MindMapLink[];
}

export interface AgentConfig {
  id: number;
  name: string;
  prompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  contextType: 'doc1' | 'doc2' | 'both';
  output?: string;
  isLoading: boolean;
}

export enum LLMProvider {
  GEMINI = 'Gemini',
  OTHER = 'Other'
}

export interface LLMModelInfo {
  id: string;
  name: string;
  provider: LLMProvider;
}

export type Language = 'en' | 'zh-TW';

export interface Translations {
  [key: string]: {
    en: string;
    'zh-TW': string;
  };
}