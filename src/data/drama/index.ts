import type { DramaEventTemplate } from '../../types/drama';

import { PLAYER_EGO_EVENTS } from './player_ego';
import { TEAM_SYNERGY_EVENTS } from './team_synergy';
import { EXTERNAL_PRESSURE_EVENTS } from './external_pressure';
import { PRACTICE_BURNOUT_EVENTS } from './practice_burnout';
import { BREAKTHROUGH_EVENTS } from './breakthrough';
import { META_RUMORS_EVENTS } from './meta_rumors';
import { ARC_SYSTEM_EVENTS } from './arc_system';
import { TEAM_IDENTITY_EVENTS } from './team_identity';
import { VISA_ARC_EVENTS } from './visa_arc';
import { COACHING_OVERHAUL_EVENTS } from './coaching_overhaul';

export const DRAMA_EVENT_TEMPLATES: DramaEventTemplate[] = [
  ...PLAYER_EGO_EVENTS,
  ...TEAM_SYNERGY_EVENTS,
  ...EXTERNAL_PRESSURE_EVENTS,
  ...PRACTICE_BURNOUT_EVENTS,
  ...BREAKTHROUGH_EVENTS,
  ...META_RUMORS_EVENTS,
  ...ARC_SYSTEM_EVENTS,
  ...TEAM_IDENTITY_EVENTS,
  ...VISA_ARC_EVENTS,
  ...COACHING_OVERHAUL_EVENTS,
];
