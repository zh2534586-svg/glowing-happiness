export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: string;
  plan: string;
  credits: number;
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
}

export interface VoiceModel {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  downloads: number;
  description: string;
  seller: string;
  previewUrl?: string;
}

export interface Project {
  id: string;
  type: string;
  title: string;
  status: string;
  outputUrl?: string;
  createdAt: string;
}

export interface AIDetectResult {
  id: string;
  score: number;
  isAI: boolean;
  details: {
    spectralAnalysis: number;
    patternRecognition: number;
    voiceArtifact: number;
  };
  processingTime: string;
}

export interface TrackSeparationResult {
  tracks: { name: string; label: string; url: string; waveform: number[] }[];
  processingTime: string;
  model: string;
}

export interface CopyrightRecord {
  id: string;
  title: string;
  contentHash: string;
  status: string;
  txHash?: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  rateLimit: number;
  createdAt: string;
}
