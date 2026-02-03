// Weapon Selection Helper
// Economy-aware weapon selection with agent preferences

import { WEAPONS, getAgentWeaponCategory, getAffordableWeapons } from './WeaponDatabase';

export function selectWeapon(credits: number, agent: string, mechanics: number): any {
  // Exclude melee from weapon selection - it's not a real combat weapon
  const affordableWeapons = getAffordableWeapons(credits).filter((w: any) => w.category !== 'melee');

  // Get agent's preferred weapon categories
  const preferredCategories = agent ? getAgentWeaponCategory(agent) : 'rifle';

  // Filter affordable weapons by agent preferences
  const preferredWeapons = affordableWeapons.filter((w: any) => w.category === preferredCategories);

  if (preferredWeapons.length > 0) {
    // Choose best option within preferred category (higher HS rate = better)
    return preferredWeapons.sort((a: any, b: any) => b.baseHeadshotRate - a.baseHeadshotRate)[0];
  }

  // Fallback to best affordable weapon (higher HS rate = better)
  return affordableWeapons.sort((a: any, b: any) => b.baseHeadshotRate - a.baseHeadshotRate)[0];
}

export function calculateShotsAndHits(player: any, weapon: any, roundNumber: number): {
  shotsFired: number; 
  totalHits: number; 
  headshotKills: number 
} {
  // Base accuracy 15-40% from mechanics (0-100)
  const baseAccuracy = 0.15 + (player.stats.mechanics / 100) * 0.25;
  
  // Weapon-specific headshot rate from Radiant data
  const weaponHsRate = weapon.baseHeadshotRate / 100;
  
  // Random shots per round within weapon range
  const shotsPerRound = weapon.shotsPerRound;
  const shotsFired = Math.floor(
    shotsPerRound.min + Math.random() * (shotsPerRound.max - shotsPerRound.min)
  );
  
  const totalHits = Math.floor(shotsFired * baseAccuracy);
  const headshotKills = Math.floor(totalHits * weaponHsRate);
  
  return { shotsFired, totalHits, headshotKills };
}