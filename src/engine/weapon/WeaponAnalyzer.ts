// Weapon Analyzer - Comprehensive analysis system for weapon headshot data
// Provides insights, recommendations, and statistical analysis

import type { Weapon, HeadshotTier } from '../../types/weapons';
import { WEAPONS, RADIANT_WEAPON_DATA, BASELINE_HEADSHOT_RATES } from './WeaponDatabase';
import { HeadshotCalculator } from './HeadshotCalculator';

export class WeaponAnalyzer {
  /**
   * Analyze the provided Radiant weapon data and derive insights
   */
  static analyzeRadiantData(): {
    summary: string;
    weaponTiers: Record<HeadshotTier, string[]>;
    insights: string[];
    correlations: Array<{weapon: string; hsRate: number; difficulty: string}>;
  } {
    const summary = `Radiant weapon data shows headshot rates ranging from 27.1% (Operator) to 33.2% (Vandal/Sheriff), 
with rifles showing the highest consistency at the professional level.`;
    
    // Group weapons by tier
    const weaponTiers: Record<HeadshotTier, string[]> = {
      'S': [], 'A': [], 'B': [], 'C': [], 'D': [], 'F': []
    };
    
    RADIANT_WEAPON_DATA.forEach(data => {
      const weapon = this.findWeaponByName(data.weaponName);
      if (weapon) {
        weaponTiers[weapon.headshotTier].push(weapon.name);
      }
    });
    
    // Generate insights
    const insights = [
      'Snipers (Operator) have lowest HS% despite high damage, suggesting they require more precision',
      'Sidearms (Sheriff) match rifles in HS% at Radiant level, indicating high mechanical skill',
      'Phantom (30.5%) vs Vandal (33.2%) suggests effective range affects headshot consistency',
      'Melee weapons naturally have 0% headshot rate',
      '15-45% range for pros creates realistic variance without breaking immersion'
    ];
    
    // Create correlation analysis
    const correlations = RADIANT_WEAPON_DATA.map(data => {
      const weapon = this.findWeaponByName(data.weaponName);
      const difficulty = weapon ? this.getDifficultyDescription(weapon.headshotTier) : 'Unknown';
      
      return {
        weapon: data.weaponName,
        hsRate: data.headshotPercent,
        difficulty
      };
    });
    
    return { summary, weaponTiers, insights, correlations };
  }
  
  /**
   * Design weapon tier system based on analysis
   */
  static designTierSystem(): {
    tiers: Record<HeadshotTier, {
      description: string;
      baselineRate: number;
      proRange: { min: number; max: number };
      examples: string[];
      characteristics: string[];
    }>;
    tierLogic: string[];
  } {
    const tiers: Record<HeadshotTier, {
      description: string;
      baselineRate: number;
      proRange: { min: number; max: number };
      examples: string[];
      characteristics: string[];
    }> = {
      'S': {
        description: 'Sniper rifles - high precision, low volume',
        baselineRate: BASELINE_HEADSHOT_RATES['S'],
        proRange: { min: 22, max: 35 }, // 22-35% for pros
        examples: ['Operator', 'Marshal'],
        characteristics: [
          'Single-shot precision',
          'High damage output',
          'Low fire rate',
          'Distance dependent',
          'Scope required for accuracy'
        ]
      },
      'A': {
        description: 'Primary rifles - balanced and versatile',
        baselineRate: BASELINE_HEADSHOT_RATES['A'],
        proRange: { min: 28, max: 42 }, // 28-42% for pros  
        examples: ['Vandal', 'Phantom', 'Guardian', 'Bulldog'],
        characteristics: [
          'Balanced damage and fire rate',
          'Effective at most ranges',
          'Requires recoil control',
          'Primary engagement weapons',
          'Consistent performance'
        ]
      },
      'B': {
        description: 'Close-mid range high fire rate',
        baselineRate: BASELINE_HEADSHOT_RATES['B'],
        proRange: { min: 32, max: 48 }, // 32-48% for pros
        examples: ['Spectre', 'Stinger', 'Odin', 'Ares'],
        characteristics: [
          'High fire rate',
          'Magazine economy important',
          'Close to mid range effective',
          'Spray control crucial',
          'Bullet economy'
        ]
      },
      'C': {
        description: 'Shotguns - close range specialists',
        baselineRate: BASELINE_HEADSHOT_RATES['C'],
        proRange: { min: 35, max: 55 }, // 35-55% for pros
        examples: ['Judge', 'Bucky'],
        characteristics: [
          'Extremely close range',
          'Spread-based damage',
          'One-shot potential',
          'High risk/reward',
          'Position dependent'
        ]
      },
      'D': {
        description: 'Sidearms - utility and emergency',
        baselineRate: BASELINE_HEADSHOT_RATES['D'],
        proRange: { min: 25, max: 40 }, // 25-40% for pros
        examples: ['Sheriff', 'Ghost', 'Classic', 'Frenzy', 'Shorty'],
        characteristics: [
          'Economy weapons',
          'Varied performance',
          'Last resort or specialist',
          'Low magazine capacity',
          'High skill ceiling for some'
        ]
      },
      'F': {
        description: 'Melee - no headshots',
        baselineRate: BASELINE_HEADSHOT_RATES['F'],
        proRange: { min: 0, max: 0 },
        examples: ['Knife'],
        characteristics: [
          'Zero headshot potential',
          'Fixed damage',
          'Positioning critical',
          'Last resort engagement',
          'No ranged capability'
        ]
      }
    };
    
    const tierLogic = [
      'Lower tier = easier to headshot (higher baseline rates)',
      'Player mechanics (0-100) scale rates within realistic ranges',
      'Situational factors provide ±30% variance',
      'Weapon skill and confidence add additional modifiers',
      'Distance and movement heavily influence final rates'
    ];
    
    return { tiers, tierLogic };
  }
  
  /**
   * Create player mechanics impact analysis
   */
  static analyzePlayerMechanicsImpact(): {
    mechanicsScale: Array<{
      mechanics: number;
      tierRates: Record<HeadshotTier, number>;
      description: string;
    }>;
    insights: string[];
    recommendations: string[];
  } {
    const mechanicsScale = [
      50, 60, 70, 80, 90, 100
    ].map(mechanics => {
      const tierRates: Record<HeadshotTier, number> = {} as Record<HeadshotTier, number>;
      
      for (const tier of ['S', 'A', 'B', 'C', 'D', 'F'] as HeadshotTier[]) {
        tierRates[tier] = HeadshotCalculator.getExpectedHeadshotRate(mechanics, this.getExampleWeapon(tier));
      }
      
      const description = this.getMechanicsDescription(mechanics);
      
      return { mechanics, tierRates, description };
    });
    
    const insights = [
      '50 mechanics: 10-20% HS rates, struggle with consistency',
      '70 mechanics: 20-30% HS rates, decent with preferred weapons',
      '80 mechanics: 25-35% HS rates, solid across weapon types',
      '90 mechanics: 30-40% HS rates,接近职业水平',
      '100 mechanics: 35-45% HS rates, elite precision',
      'Weapon-specific skill can offset lower mechanics by 10-15%'
    ];
    
    const recommendations = [
      'Players below 70 mechanics should focus on shotguns and SMGs',
      '70-80 mechanics can effectively use rifles with training',
      '85+ mechanics can handle sniper rifles consistently',
      'Sidearms require high mechanics despite low tier classification',
      'Training should focus on mechanics 60+ for competitive play'
    ];
    
    return { mechanicsScale, insights, recommendations };
  }
  
  /**
   * Design realistic hit tracking formula
   */
  static designHitTrackingFormula(): {
    formula: string;
    parameters: Array<{
      name: string;
      description: string;
      range: string;
      impact: string;
    }>;
    examples: Array<{
      scenario: string;
      mechanics: number;
      weapon: string;
      expectedRate: number;
      variance: string;
    }>;
    implementation: string[];
  } {
    const formula = `
Final HS% = BaseRate × MechanicsMult × WeaponSkillMult × SituationalMult × ConfidenceMult

Where:
- BaseRate = Tier-specific baseline (S: 27.1%, A: 32.5%, B: 36.5%, C: 42.5%, D: 33.2%, F: 0%)
- MechanicsMult = 0.3 to 1.4 based on 0-100 mechanics stat
- WeaponSkillMult = 0.7 to 1.3 based on proficiency with weapon category
- SituationalMult = 0.5 to 1.3 based on distance, movement, pressure
- ConfidenceMult = 0.8 to 1.2 based on player form/mental state
    `.trim();
    
    const parameters = [
      {
        name: 'BaseRate',
        description: 'Tier-specific headshot rate from Radiant data',
        range: '0% - 42.5%',
        impact: 'Foundation rate, determines difficulty tier'
      },
      {
        name: 'MechanicsMult',
        description: 'Player aim/mechanics skill modifier',
        range: '0.3x - 1.4x',
        impact: 'Primary scaling factor for player skill'
      },
      {
        name: 'WeaponSkillMult',
        description: 'Player proficiency with specific weapon type',
        range: '0.7x - 1.3x',
        impact: 'Rewards specialization and practice'
      },
      {
        name: 'SituationalMult',
        description: 'Combat conditions (range, movement, pressure)',
        range: '0.5x - 1.3x',
        impact: 'Adds realism through context awareness'
      },
      {
        name: 'ConfidenceMult',
        description: 'Player form and mental state',
        range: '0.8x - 1.2x',
        impact: 'Simulates hot/cold streaks'
      }
    ];
    
    const examples = [
      {
        scenario: 'Radiant Operator kill at optimal range',
        mechanics: 95,
        weapon: 'Operator',
        expectedRate: 28.5,
        variance: '±5% based on pressure and enemy movement'
      },
      {
        scenario: 'Pro player with Vandal in mid-range duel',
        mechanics: 85,
        weapon: 'Vandal', 
        expectedRate: 32.0,
        variance: '±8% based on movement and duel length'
      },
      {
        scenario: 'Semi-pro with Sheriff clutch situation',
        mechanics: 75,
        weapon: 'Sheriff',
        expectedRate: 26.8,
        variance: '±12% based on pressure (high impact)'
      },
      {
        scenario: 'Amateur with Spectre close range',
        mechanics: 60,
        weapon: 'Spectre',
        expectedRate: 22.4,
        variance: '±10% based on distance advantage'
      }
    ];
    
    const implementation = [
      'Use per-round calculation with context awareness',
      'Aggregate over multiple rounds for accuracy',
      'Apply gentle smoothing to prevent wild swings',
      'Track weapon-specific rates for player development',
      'Consider map and position effects in advanced implementation'
    ];
    
    return { formula, parameters, examples, implementation };
  }
  
  /**
   * Generate comprehensive weapon system recommendations
   */
  static generateRecommendations(): {
    forGameBalance: string[];
    forPlayerDevelopment: string[];
    forSimulationAccuracy: string[];
    forDataAnalysis: string[];
  } {
    return {
      forGameBalance: [
        'Maintain 15-45% HS% range for playable mechanics spread',
        'Use weapon tiers to create meaningful strategic choices',
        'Apply distance falloff to prevent long-range spam',
        'Include movement penalties for realistic gameplay',
        'Pressure mechanics should impact clutch situations significantly'
      ],
      forPlayerDevelopment: [
        'Track weapon-specific proficiency over time',
        'Use mechanics stat as primary development metric',
        'Implement training bonuses for weapon categories',
        'Create situational awareness training modules',
        'Consider mentorship effects on skill development'
      ],
      forSimulationAccuracy: [
        'Calculate per-shot with full context awareness',
        'Aggregate round-level statistics properly',
        'Apply smoothing to prevent statistical noise',
        'Use proper rounding for display (2 decimal places)',
        'Track both raw and adjusted rates for analysis'
      ],
      forDataAnalysis: [
        'Monitor outlier cases (>45% or <10% for investigation)',
        'Track weapon meta trends over time',
        'Analyze map-specific weapon effectiveness',
        'Study mechanics progression curves',
        'Evaluate balance changes through headshot rate shifts'
      ]
    };
  }
  
  // Helper methods
  private static findWeaponByName(name: string): Weapon | undefined {
    return Object.values(WEAPONS).find(w => w.name.toLowerCase() === name.toLowerCase());
  }
  
  private static getDifficultyDescription(tier: HeadshotTier): string {
    const descriptions = {
      'S': 'Very Hard - requires extreme precision',
      'A': 'Hard - requires good mechanics',
      'B': 'Medium - forgiving with practice',
      'C': 'Easy - close range advantage',
      'D': 'Variable - weapon dependent',
      'F': 'N/A - no headshots'
    };
    return descriptions[tier];
  }
  
  private static getExampleWeapon(tier: HeadshotTier): string {
    const examples = {
      'S': 'operator',
      'A': 'vandal',
      'B': 'spectre', 
      'C': 'judge',
      'D': 'sheriff',
      'F': 'melee'
    };
    return examples[tier];
  }
  
  private static getMechanicsDescription(mechanics: number): string {
    if (mechanics <= 50) return 'Beginner - struggles with consistency';
    if (mechanics <= 60) return 'Below Average - occasional good shots';
    if (mechanics <= 70) return 'Average - decent with practice';
    if (mechanics <= 80) return 'Above Average - reliable performer';
    if (mechanics <= 90) return 'Good -接近职业水平';
    return 'Excellent - elite precision';
  }
}

// Export singleton instance
export const weaponAnalyzer = new WeaponAnalyzer();
