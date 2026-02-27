import type { InterviewTemplate } from '../../types/interview';

import { KICKOFF_TEMPLATES } from './kickoff';
import { PRE_MATCH_TEMPLATES } from './pre_match';
import { POST_MATCH_WIN_TEMPLATES } from './post_match_win';
import { POST_MATCH_LOSS_TEMPLATES } from './post_match_loss';
import { CRISIS_TEMPLATES } from './crisis';
import { ARC_AWARE_TEMPLATES } from './arc_aware';
import { OPPONENT_AWARENESS_TEMPLATES } from './opponent_awareness';
import { TEAM_IDENTITY_TEMPLATES } from './team_identity';
import { VISA_ARC_TEMPLATES } from './visa_arc';
import { COACHING_OVERHAUL_TEMPLATES } from './coaching_overhaul';
import { AGENT_STRATEGY_TEMPLATES } from './agent_strategy';

export const INTERVIEW_TEMPLATES: InterviewTemplate[] = [
  ...KICKOFF_TEMPLATES,
  ...PRE_MATCH_TEMPLATES,
  ...POST_MATCH_WIN_TEMPLATES,
  ...POST_MATCH_LOSS_TEMPLATES,
  ...CRISIS_TEMPLATES,
  ...ARC_AWARE_TEMPLATES,
  ...OPPONENT_AWARENESS_TEMPLATES,
  ...TEAM_IDENTITY_TEMPLATES,
  ...VISA_ARC_TEMPLATES,
  ...COACHING_OVERHAUL_TEMPLATES,
  ...AGENT_STRATEGY_TEMPLATES,
];
