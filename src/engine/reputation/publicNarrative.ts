// Public Narrative Generator
// Produces a human-readable label describing how the media/public perceives the team

import type { Team } from '../../types/team';

/**
 * Returns a short narrative string describing the team's public image.
 * Based on fan approval (fanbase), current win/loss streak, and reputation tier.
 */
export function getPublicNarrative(team: Team): string {
  const { fanbase } = team.reputation;
  const { currentStreak } = team.standings;

  // Crisis territory
  if (fanbase < 20) {
    if (currentStreak <= -3) return 'Community demanding roster overhaul';
    return 'Public support at rock bottom';
  }

  // Low approval
  if (fanbase < 35) {
    if (currentStreak <= -3) return 'Fans losing faith after brutal skid';
    if (currentStreak === -2) return 'Social media turning on the team';
    return 'Struggling to win over skeptical fans';
  }

  // Below average
  if (fanbase < 50) {
    if (currentStreak <= -2) return 'Negative results hurting public image';
    if (currentStreak >= 2) return 'Win streak helping rebuild fanbase';
    return 'Building trust with a limited fanbase';
  }

  // Average / established
  if (fanbase < 65) {
    if (currentStreak >= 3) return 'Momentum building with the fanbase';
    if (currentStreak <= -2) return 'Slipping in public perception';
    return 'Steady reputation in the scene';
  }

  // Popular
  if (fanbase < 80) {
    if (currentStreak >= 3) return 'Fan hype building toward iconic status';
    if (currentStreak <= -2) return 'Fans disappointed by recent results';
    return 'Strong fanbase, reliable contender';
  }

  // Iconic / peak
  if (currentStreak >= 3) return 'Community hype at peak levels';
  if (currentStreak <= -2) return 'High expectations meet disappointing results';
  if (currentStreak <= -3) return 'Fans questioning the dynasty';
  return 'Iconic status — every match is an event';
}

/**
 * Returns a short context blurb for interview modals based on approval level.
 * Returns null if approval is neutral (no context needed).
 */
export function getInterviewApprovalContext(fanbase: number): string | null {
  if (fanbase < 25) return 'Fans are calling for major changes.';
  if (fanbase < 40) return 'Public confidence in your leadership is shaky.';
  if (fanbase >= 82) return 'The fanbase is fully behind you right now.';
  if (fanbase >= 70) return 'Fans are riding high on your recent momentum.';
  return null;
}
