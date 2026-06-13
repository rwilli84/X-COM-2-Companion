// Single source of truth for all advisor thresholds — tune here, nowhere else.

export const ADVISOR_CONFIG = {

  DOOM_PRESSURE: {
    LOW_MAX: 3,    // 0–3  → Stable. Breathe.
    MEDIUM_MAX: 6, // 4–6  → Watch it. Plan a reduction soon.
    HIGH_MAX: 9,   // 7–9  → Urgent. Assault a facility this month.
    // 10+ → CRITICAL: assault immediately or game ends.
  },

  SCORING: {
    // Per profile-matched ability tag, per unit of need weight
    abilityTagBase: 2,
    // Class innate aptitude adds this when class matches a needed tag (no abilities logged)
    classAptitudeBase: 1,
    // Rank bonuses (rookie=0 … colonel=7)
    rankBonus: [0, 0, 1, 2, 3, 4, 5, 7] as const,
    // Gear tier bonuses
    magneticBonus: 2,
    beamBonus: 4,
    armorBonus: 1, // any non-bare armor
    // Status modifiers
    tiredPenalty: -3,
    shakenPenalty: -6,
    woundedScore: -999, // effectively excluded
    // WotC bonds: bonus when BOTH bonded soldiers are recommended together
    bondBonus: 3,
    // Required-role satisfaction bonus (e.g., Specialist on hack missions)
    requiredRoleBonus: 8,
  },

  MISSION_ADVISOR: {
    // Doom-pressure multipliers on avatar-reducing rewards
    avatarReductionBonusHigh: 6,
    avatarReductionBonusCritical: 12,
    // Dark event penalty avoidance bonus
    deCounterBonus: 8,
    // Income-harming dark event escalation penalty (compound DE)
    compoundDeBonus: 4,
    // Engineer vs scientist timing
    engineerBonusEarlyGame: 4,
    scientistBonusLateGame: 3,
    engineerMissionThreshold: 8, // missions logged ≤ this → prefer engineers
  },

  RESEARCH_ADVISOR: {
    earlyGameThreshold: 5,   // missions logged
    midGameThreshold: 12,
    lateGameThreshold: 20,
    // Doom pressure at which Shadow Chamber becomes urgent
    shadowChamberUrgentPips: 7,
  },

  BASE_ADVISOR: {
    // Warn when power margin drops below this
    minPowerMarginWarning: 2,
    // Warn when remaining contacts ≤ this before cap
    contactCapWarningSlack: 2,
    // "Early game" proxy: facilities built ≤ this
    earlyGameFacilities: 3,
  },

  ECONOMY_ADVISOR: {
    // Minimum stock to KEEP before selling (per material)
    alloysKeepBuffer: 80,         // ~predator + warden armor sets
    crystalsKeepBuffer: 60,       // ~weapon upgrades + one armor tier
    coresKeepBuffer: 2,           // cores are extremely scarce — almost never sell
    intelKeepBuffer: 40,          // reserve for covert actions / resistance orders
    // Weekly supply income per active contact
    suppliesPerContact: 15,
    suppliesBase: 70,             // baseline weekly income from HQ
    // Proving Grounds: rank items below this usefulness score as "low priority"
    provingGroundsLowPriorityThreshold: 5,
  },

  // Rolling success tracking
  SUCCESS_RATE: {
    // Missions below this rate warrant a warning about squad composition
    poorRateThreshold: 0.4,
    minSampleSize: 3,
  },
} as const

// Human-readable explanations for each scoring rule — shown in the Why? glossary
export const ADVISOR_GLOSSARY: Record<string, string> = {
  abilityTagBase:
    'Each ability your soldier has that matches a mission need contributes points. The heavier the need, the more points per matching ability.',
  rankBonus:
    'Higher-ranked soldiers score better — they have more abilities, more HP, and better aim. A Colonel brings far more to a mission than a Squaddie.',
  magneticBonus:
    'Magnetic weapons deal roughly 50% more damage than conventional. In high-pressure missions that extra damage ends fights faster.',
  beamBonus:
    'Plasma/beam weapons are the endgame tier. A beam-armed soldier wins duels that mag soldiers lose.',
  tiredPenalty:
    '(WotC) A Tired soldier risks gaining negative traits if deployed and not rested. Use sparingly on dangerous missions.',
  shakenPenalty:
    '(WotC) A Shaken soldier has low Will and is vulnerable to panic, mind control, and Chosen abilities. Avoid deploying them without a Psi Operative nearby.',
  bondBonus:
    '(WotC) Bonded soldiers fight better together — they share Bond abilities (covering fire, inspire, etc). The bonus is applied when both partners are in the same squad.',
  requiredRoleBonus:
    'Some mission types demand specific roles. A hack-objective mission without a Specialist means you likely cannot hack the terminal and lose the bonus reward.',
  avatarReductionBonus:
    'Reducing Avatar Project pips directly extends how long you survive. Under high doom pressure, even 1 pip reduction is worth more than most resource rewards.',
  deCounterBonus:
    'Countering an active Dark Event removes a persistent negative effect. "Income reduction" or "UFO Hunt" Dark Events compound into severe problems if left active.',
  engineerFirst:
    'Engineers unlock facility building and Workshops (which multiply engineer value). More engineers → faster Avenger upgrades → better soldiers sooner.',
  armorShred:
    'Enemy armor absorbs a flat amount of damage from every hit. One good Grenadier with Shredder removes armor so all squadmates deal full damage — a force multiplier.',
  crowdControl:
    'Locking an enemy down (Stasis, Suppress, Panic, Mind Control) means it cannot act this turn. Converting 2-action enemy turns to 0-action turns swings the math enormously.',
  actionEconomy:
    'XCOM is a resource game where "actions" are the currency. Abilities that give free actions (Implacable, Reflex, free pistol shots) effectively let you take more turns than the enemy.',
  burst:
    'Some missions demand a target die before it acts — bosses, Priests, Codices. High single-target burst damage from multiple soldiers is the answer.',
  aoe:
    'Retaliations and Lost missions spawn enemies in clusters. Grenades, Saturation Fire, Void Rift kill many enemies simultaneously and destroy their cover.',
  ammoEfficiency:
    'The Lost grant a free action on any one-hit kill (headshot). Abilities that let you kill efficiently without wasting ammo (Reaper\'s Banish, precise shots) chain these free actions.',
  hacking:
    'Haywire Protocol and high Gremlin tier can hack MECs, turrets, or Sectopods, turning the enemy\'s strongest unit into yours. Hack missions require a Specialist to access terminals.',
  concealment:
    'Starting concealed lets you reposition, set ambushes, and choose when to engage. Shadowstep, Phantom, and Reaper Shadow preserve concealment for a decisive first strike.',
}
