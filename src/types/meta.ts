// Meta System Types
// Defines patch notes and meta shift data

import type { SeasonPhase } from './calendar';

export interface MetaPatch {
  id: string;
  version: string;       // display: '7.04'
  title: string;
  summary: string;
  nerfedAgents: string[];
  buffedAgents: string[];
  changes: MetaPatchChange[];
  scheduledPhase: SeasonPhase;
}

export interface MetaPatchChange {
  map: string;
  agent: string;
  direction: 'buff' | 'nerf';
  toPosition: number;    // 0 = highest priority
}
