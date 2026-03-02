// Pre-defined meta patches — one per major phase boundary
// These are scheduled as patch_notes CalendarEvents at game initialization

import type { MetaPatch } from '../../types/meta';

export const META_PATCHES: MetaPatch[] = [
  {
    id: 'patch_7_01',
    version: '7.01',
    title: 'Wall Duration Reduced',
    summary: 'Viper wall duration cut significantly. Sage and Omen step up as replacements in certain maps.',
    nerfedAgents: ['Viper'],
    buffedAgents: ['Sage', 'Omen'],
    scheduledPhase: 'kickoff',
    changes: [
      { map: 'Icebox', agent: 'Viper', direction: 'nerf', toPosition: 4 },
      { map: 'Icebox', agent: 'Sage', direction: 'buff', toPosition: 1 },
      { map: 'Breeze', agent: 'Viper', direction: 'nerf', toPosition: 4 },
      { map: 'Breeze', agent: 'Omen', direction: 'buff', toPosition: 1 },
    ],
  },

  {
    id: 'patch_7_04',
    version: '7.04',
    title: 'Dash Charges 2→1',
    summary: 'Jett dash reworked to a single charge. Neon and Raze gain priority on most maps.',
    nerfedAgents: ['Jett'],
    buffedAgents: ['Neon', 'Raze'],
    scheduledPhase: 'stage1',
    changes: [
      { map: 'Ascent', agent: 'Jett', direction: 'nerf', toPosition: 4 },
      { map: 'Ascent', agent: 'Neon', direction: 'buff', toPosition: 1 },
      { map: 'Haven', agent: 'Jett', direction: 'nerf', toPosition: 4 },
      { map: 'Split', agent: 'Jett', direction: 'nerf', toPosition: 4 },
      { map: 'Split', agent: 'Raze', direction: 'buff', toPosition: 0 },
      { map: 'Icebox', agent: 'Jett', direction: 'nerf', toPosition: 4 },
      { map: 'Breeze', agent: 'Jett', direction: 'nerf', toPosition: 4 },
      { map: 'Pearl', agent: 'Jett', direction: 'nerf', toPosition: 4 },
      { map: 'Pearl', agent: 'Neon', direction: 'buff', toPosition: 1 },
    ],
  },

  {
    id: 'patch_7_07',
    version: '7.07',
    title: 'Ult Range Nerfed',
    summary: 'Chamber ultimate range cut. Killjoy becomes the dominant sentinel across the board.',
    nerfedAgents: ['Chamber'],
    buffedAgents: ['Killjoy'],
    scheduledPhase: 'stage1_playoffs',
    changes: [
      { map: 'Bind', agent: 'Chamber', direction: 'nerf', toPosition: 4 },
      { map: 'Bind', agent: 'Killjoy', direction: 'buff', toPosition: 1 },
      { map: 'Breeze', agent: 'Chamber', direction: 'nerf', toPosition: 4 },
      { map: 'Icebox', agent: 'Chamber', direction: 'nerf', toPosition: 4 },
      { map: 'Pearl', agent: 'Killjoy', direction: 'buff', toPosition: 0 },
      { map: 'Lotus', agent: 'Killjoy', direction: 'buff', toPosition: 0 },
    ],
  },

  {
    id: 'patch_7_10',
    version: '7.10',
    title: 'Seize Duration Cut',
    summary: 'Fade Seize duration nerfed. Breach and Skye move into initiator spots vacated on certain maps.',
    nerfedAgents: ['Fade'],
    buffedAgents: ['Breach', 'Skye'],
    scheduledPhase: 'stage2',
    changes: [
      { map: 'Pearl', agent: 'Fade', direction: 'nerf', toPosition: 4 },
      { map: 'Pearl', agent: 'Skye', direction: 'buff', toPosition: 1 },
      { map: 'Lotus', agent: 'Fade', direction: 'nerf', toPosition: 4 },
      { map: 'Lotus', agent: 'Breach', direction: 'buff', toPosition: 1 },
      { map: 'Fracture', agent: 'Fade', direction: 'nerf', toPosition: 4 },
      { map: 'Fracture', agent: 'Breach', direction: 'buff', toPosition: 0 },
    ],
  },

  {
    id: 'patch_8_00',
    version: '8.00',
    title: 'Cam Range Reduced',
    summary: 'Cypher camera range nerfed significantly. Sage and Killjoy gain ground as late-season sentinels.',
    nerfedAgents: ['Cypher'],
    buffedAgents: ['Sage', 'Killjoy'],
    scheduledPhase: 'stage2_playoffs',
    changes: [
      { map: 'Split', agent: 'Cypher', direction: 'nerf', toPosition: 4 },
      { map: 'Split', agent: 'Sage', direction: 'buff', toPosition: 1 },
      { map: 'Sunset', agent: 'Cypher', direction: 'nerf', toPosition: 4 },
      { map: 'Sunset', agent: 'Killjoy', direction: 'buff', toPosition: 1 },
      { map: 'Pearl', agent: 'Killjoy', direction: 'buff', toPosition: 0 },
    ],
  },
];
