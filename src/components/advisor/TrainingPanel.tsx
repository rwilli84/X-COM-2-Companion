import { useState } from 'react'
import { useGameData } from '../../hooks/useGameData'
import type { ClassDefinition } from '../../data/types'

// ─── Training recommendations (meta picks per class/rank) ────────────────────

interface RankRec {
  rank: string
  pick: string        // ability name
  pickId: string
  reason: string
  alt?: string
  altId?: string
  altCondition?: string
}

interface ClassRec {
  classId: string
  summary: string
  role: string
  keyPrinciple: string
  rankRecs: RankRec[]
  generalTips: string[]
  trainingCenterTip?: string
  psiLabTips?: string[]   // Psi Op only
}

const CLASS_RECOMMENDATIONS: ClassRec[] = [
  {
    classId: 'ranger',
    summary: 'Mobile melee/shotgun hybrid. At its best flanking or executing low-HP targets.',
    role: 'Flanker / Executioner',
    keyPrinciple: 'Get adjacent, slash for free, then shoot — two attacks per turn is the baseline.',
    rankRecs: [
      { rank: 'Corporal', pick: 'Run and Gun', pickId: 'ranger_run_and_gun',
        reason: 'Dash and still act — essential for a class that needs to close distance aggressively.',
        alt: 'Phantom', altId: 'ranger_phantom',
        altCondition: 'If you want a concealment scout build to complement a stealth squad.' },
      { rank: 'Sergeant', pick: 'Implacable', pickId: 'ranger_implacable',
        reason: 'Free action on a kill means Slash → move away to safety after the kill. Lethal chain.',
        alt: 'Shadowstep', altId: 'ranger_shadowstep',
        altCondition: 'If the Ranger often needs to position through overwatch fire.' },
      { rank: 'Lieutenant', pick: 'Bladestorm', pickId: 'ranger_bladestorm',
        reason: 'Auto-counter any enemy that moves adjacent — punishes flankers and makes melee safe.',
        alt: 'Lightning Hands', altId: 'ranger_lightning_hands',
        altCondition: 'Gun Ranger build — pistol free action adds damage without ending the turn.' },
      { rank: 'Captain', pick: 'Untouchable', pickId: 'ranger_untouchable',
        reason: 'Free dodge after a kill — survivability on a class that gets close. Nearly mandatory.',
        alt: 'Aggression', altId: 'ranger_aggression',
        altCondition: 'High-crit shotgun build, but enemy counts per pod vary — Untouchable is more reliable.' },
      { rank: 'Major', pick: 'Rapid Fire', pickId: 'ranger_rapid_fire',
        reason: 'Two shots in one action — huge burst potential. −15 aim is offset by high Ranger aim and flanking.',
        alt: 'Reaper', altId: 'ranger_reaper',
        altCondition: 'If your Ranger is consistently getting sword kills with Implacable — Reaper chains become a wipe ability.' },
      { rank: 'Colonel', pick: 'Whirlwind', pickId: 'ranger_whirlwind',
        reason: 'Bladestorm triggers multiple times per turn — turns your Ranger into a melee buzzsaw in ADVENT groups.',
        alt: 'Face Off', altId: 'ranger_face_off',
        altCondition: 'If running a pure gun Ranger without Bladestorm.' },
    ],
    generalTips: [
      'Always Slash before shooting — it doesn\'t end the turn. Two attacks per round is baseline.',
      'Position adjacent to the target you want to kill, so Untouchable dodge applies before any surviving enemy fires.',
      'Ranger + Implacable + Reaper = chain sword kills without ever ending the turn. Budget setup turns early.',
      'Equip Spider Suit or Wraith Suit — grapple hook lets you reach flanking positions without burning both moves.',
      'Talon Rounds (+15% crit on flanks) are excellent — Rangers flank nearly every turn.',
    ],
    trainingCenterTip: 'Consider Scanning Protocol from the Specialist tree if you want a concealment scouting bonus. Combat Protocol gives armor-ignoring Gremlin damage — unusual but potent on a melee build.',
  },
  {
    classId: 'sharpshooter',
    summary: 'Long-range precision fire and overwatch ambushes. Weak at close range.',
    role: 'Overwatch Anchor / Burst Sniper',
    keyPrinciple: 'Never move if you can help it — Steady Hands and Sniper\'s Creed reward staying still.',
    rankRecs: [
      { rank: 'Corporal', pick: 'Long Watch', pickId: 'sharp_long_watch',
        reason: 'Overwatch as a single action — then the other action can shoot. Also triggers at Squadsight range, covering the entire map.',
        alt: 'Death From Above', altId: 'sharp_death_from_above',
        altCondition: 'If the Sharpshooter always has elevation, the aim/crit bonus is consistent.' },
      { rank: 'Sergeant', pick: 'Sniper\'s Creed', pickId: 'sharp_sniper_creed',
        reason: '+10 aim and crit per unspent action — enormous accuracy on a still sniper with 2 actions.',
        alt: 'Return Fire', altId: 'sharp_return_fire',
        altCondition: 'Only if enemies frequently target the sniper directly — usually unnecessary on high ground.' },
      { rank: 'Lieutenant', pick: 'Aim', pickId: 'sharp_aim',
        reason: 'Stacking +20 aim per use — combined with Sniper\'s Creed guarantees high-value shots on tough enemies.',
        alt: 'Quickdraw', altId: 'sharp_quickdraw',
        altCondition: 'Pistol build that uses Fan Fire / Face Off instead of the sniper rifle.' },
      { rank: 'Captain', pick: 'Steady Hands', pickId: 'sharp_steady_hands',
        reason: '+10 aim and crit for not moving last turn — passive bonus on a soldier who shouldn\'t be moving anyway.',
        alt: 'Fan Fire', altId: 'sharp_fan_fire',
        altCondition: 'Pistol Sharpshooter — three pistol shots that bypass armor on some enemy types.' },
      { rank: 'Major', pick: 'Kill Zone', pickId: 'sharp_kill_zone',
        reason: 'Overwatch shot on EVERY enemy that moves in the cone — devastating in ambushes and avenger defense.',
        alt: 'Lightning Hands', altId: 'sharp_lightning_hands',
        altCondition: 'Pistol build needing free-action pistol shots.' },
      { rank: 'Colonel', pick: 'Serial', pickId: 'sharp_serial',
        reason: 'Free follow-up shots on kills — one activation can kill 3–4 enemies. The Sharpshooter\'s signature ability.',
        alt: 'Face Off', altId: 'sharp_face_off',
        altCondition: 'Pistol build — fire pistol at every visible enemy in one action.' },
    ],
    generalTips: [
      'Squadsight (free at Squaddie) lets you fire at any target a squadmate can see. Stay back and safe.',
      'Never move and then fire with a sniper rifle — you lose Steady Hands and Sniper\'s Creed bonuses both.',
      'Claim elevation at the start of each map and stay there. Long Watch covers the entire map in overwatch.',
      'AP Rounds are excellent — shreds 1 armor per hit from across the map, helping the whole squad.',
      'Bluescreen Rounds on a Sharpshooter devastates Sectopods and MECs at safe sniper range.',
      'Serial requires kills — set it up by having other soldiers wound enemies before the Sharpshooter fires.',
    ],
  },
  {
    classId: 'grenadier',
    summary: 'Armor shred and AoE damage. The most impactful soldier on heavy ADVENT missions.',
    role: 'Armor Breaker / Cover Destroyer',
    keyPrinciple: 'Always shred first. 1 armor shred = ~2 extra damage per soldier per round.',
    rankRecs: [
      { rank: 'Corporal', pick: 'Shredder', pickId: 'gren_shredder',
        reason: 'Every cannon shot permanently shreds 1 armor. Stack with acid grenade and AP rounds for up to 4+ shred.',
        alt: 'Volatile Mix', altId: 'gren_volatile_mix',
        altCondition: 'Only if running a pure grenade build with Salvo — rarely optimal.' },
      { rank: 'Sergeant', pick: 'Salvo', pickId: 'gren_salvo',
        reason: 'Throw a grenade AND still fire the cannon — two actions of output in one turn.',
        alt: 'Holo Targeting', altId: 'gren_holo_targeting',
        altCondition: '+15 aim for all squadmates this turn — strong in squads with many shooters targeting the same enemy.' },
      { rank: 'Lieutenant', pick: 'Rupture', pickId: 'gren_rupture',
        reason: '+3 damage to ALL sources vs. ruptured enemy — team-wide damage boost per cannon hit.',
        alt: 'Suppression', altId: 'gren_suppression',
        altCondition: 'If the squad needs reliable pin-down ability for dangerous enemies mid-cover.' },
      { rank: 'Captain', pick: 'Chain Shot', pickId: 'gren_chain_shot',
        reason: 'If the first shot misses, fires again — massively increases reliability on high-HP targets.',
        alt: 'Demolition', altId: 'gren_demolition',
        altCondition: 'Reveals concealed enemies through cover destruction — useful on stealth-heavy maps.' },
      { rank: 'Major', pick: 'Saturation Fire', pickId: 'gren_saturation_fire',
        reason: 'Cone AoE fire — clears out clustered enemies and covers a wide area without spending grenades.',
        alt: 'Area Suppression', altId: 'gren_area_suppression',
        altCondition: 'If enemy AoE-suppression is needed more than direct fire cones.' },
      { rank: 'Colonel', pick: 'Full Auto', pickId: 'gren_full_auto',
        reason: 'Two cannon shots with no aim penalty — double Shredder/Rupture application in one action.',
        alt: 'Armageddon', altId: 'gren_armageddon',
        altCondition: 'If AoE cover destruction is the priority.' },
    ],
    generalTips: [
      'Fire the cannon FIRST to apply Shredder — then everyone else shoots the now-softened target.',
      'Grenadiers carry Heavy Ordnance (extra grenade) — bring two different grenade types for flexibility.',
      'EMP Grenade from the Proving Grounds + Bluescreen rounds (Specialist) = Sectopod dies fast.',
      'With Salvo: open turn with a grenade (free action), then fire cannon (Shredder + Rupture). Two full actions.',
      'Acid Grenade shreds armor on top of Shredder — combined is 2+ armor shred per turn.',
      'The Grenadier destroys cover that flanks ADVENT — use grenades to eliminate high-cover positions, not just damage.',
    ],
  },
  {
    classId: 'specialist',
    summary: 'Gremlin drone for healing, hacking, and utility. The squad\'s logistical backbone.',
    role: 'Combat Medic / Hacker',
    keyPrinciple: 'The Specialist works best from mid-distance — safe enough to heal but close enough to hack.',
    rankRecs: [
      { rank: 'Corporal', pick: 'Haywire Protocol', pickId: 'spec_haywire',
        reason: 'Hack robotic enemies — a successful Sectopod hack ends encounters. Massive swing ability.',
        alt: 'Field Medic', altId: 'spec_field_medic',
        altCondition: 'If the squad is struggling with casualties and needs consistent healing. Doubles medikit value.' },
      { rank: 'Sergeant', pick: 'Combat Protocol', pickId: 'spec_combat_protocol',
        reason: 'Armor-ignoring Gremlin damage on demand — extremely consistent. Scales with Gremlin tech tier.',
        alt: 'Aid Protocol', altId: 'spec_aid_protocol',
        altCondition: 'If the Specialist is primarily a healer — +20 defense on an ally is strong on Legendary.' },
      { rank: 'Lieutenant', pick: 'Revival Protocol', pickId: 'spec_revival_protocol',
        reason: 'Revive a bleeding-out soldier from range — prevents a loss without burning movement.',
        alt: 'Scanning Protocol', altId: 'spec_scanning_protocol',
        altCondition: 'If the squad already has a backup medic and visibility is the bottleneck.' },
      { rank: 'Captain', pick: 'Threat Assessment', pickId: 'spec_threat_assessment',
        reason: 'Aid Protocol now also grants the target an extra overwatch shot — free offense with every heal.',
        alt: 'Ever Vigilant', altId: 'spec_ever_vigilant',
        altCondition: 'If the Specialist often takes zero actions moving — auto-overwatch without spending actions.' },
      { rank: 'Major', pick: 'Capacitor Discharge', pickId: 'spec_capacitor_discharge',
        reason: 'Electric burst hitting ALL robotic/mech enemies in range — devastates Sectopod + MEC pods.',
        alt: 'Guardian', altId: 'spec_guardian',
        altCondition: 'If enemies frequently target allies — 20% free overwatch shot is passive defensive value.' },
      { rank: 'Colonel', pick: 'Restoration', pickId: 'spec_restoration',
        reason: 'Heals ALL nearby allies simultaneously — emergency reset for a squad that took heavy fire.',
        alt: 'Tyrant', altId: 'spec_tyrant',
        altCondition: 'If Haywire Protocol is the primary strategy — permanently disabling hacked robots.' },
    ],
    generalTips: [
      'Always bring a Medikit — Field Medic makes it heal 8 HP with extra charges.',
      'Combat Protocol ignores armor — against a Sectopod or Andromedon, it\'s reliable consistent damage.',
      'Gremlin upgrades (Mk.II, Mk.III) from Proving Grounds significantly increase hack and combat protocol value.',
      'Use Scanning Protocol (from the Proving Grounds item) to reveal pods before committing soldiers.',
      'Specialist + Haywire Protocol is the safest Sectopod counter — a successful hack turns the fight.',
      'Ever Vigilant + Threat Assessment: move no soldiers this turn, Specialist auto-overwatches for free.',
    ],
  },
  {
    classId: 'psi_operative',
    summary: 'Psychic warrior trained at the Psi Lab. Extremely powerful but slow to develop.',
    role: 'Battlefield Controller / Enabler',
    keyPrinciple: 'Train Psi Operatives as early as possible — they get abilities via the Psi Lab, not rank-up, so earlier = more abilities.',
    psiLabTips: [
      'Priority order: Stasis → Domination → Solace/Fortress → Void Rift/Null Lance → others.',
      'Stasis (1): Removes the most dangerous enemy from the fight with no risk. Essential on every mission.',
      'Domination (2): Permanently mind control non-robotic enemies. A dominated Avatar is a game-changer.',
      'Solace (passive): All nearby allies immune to psionic effects — mandatory on Psi Gate and final mission.',
      'Fortress (passive): Psi Op itself resists psionic and status effects — taken once the Op faces Priests/Warlocks.',
      'Void Rift: AoE psionic damage and disorientation — strong but requires Stasis and Domination first.',
      'Inspire: Restore an ally\'s actions — extremely powerful late-game with a colonel whose actions are scarce.',
      'Sustain (passive): Survive a lethal hit once per mission with 1 HP — a safety net on high-risk missions.',
      'Don\'t train a Psi Op late — they need multiple Psi Lab sessions to unlock enough abilities to be useful.',
    ],
    rankRecs: [],
    generalTips: [
      'Rush the Psi Lab (after Alien Biotech → Sectoid Autopsy) — every week of earlier training is another ability.',
      'A Psi Op with only Stasis is still valuable — that\'s 1 free disable per mission.',
      'Domination on an Avatar in the final mission changes the fight completely. This is worth the entire tech tree.',
      'Psi Op doesn\'t wear traditional armor well — Spider Suit gives mobility without sacrificing armor value.',
      'Once Domination is available, always deploy the Psi Op with a squad that can protect them while they set up the control.',
    ],
  },
  {
    classId: 'reaper',
    summary: '(WotC) Concealment scout. Kills without breaking stealth, Banish chains headshots.',
    role: 'Scout / Lost Slayer',
    keyPrinciple: 'Stay concealed as long as possible — reveal pod positions before your squad commits.',
    rankRecs: [
      { rank: 'Corporal', pick: 'Banish', pickId: 'reaper_banish',
        reason: 'Multiple shots per activation — each 1-HP kill gives a free action. Devastates Lost swarms.',
        alt: 'Shadow', altId: 'reaper_shadow',
        altCondition: 'If the campaign has many missions where re-entering concealment mid-fight is valuable.' },
      { rank: 'Sergeant', pick: 'Claymore', pickId: 'reaper_claymore',
        reason: 'Remote-detonated explosive — plant while concealed, detonate to soften pods before engagement.',
        alt: 'Distraction', altId: 'reaper_distraction',
        altCondition: 'If drawing enemy aggro away from the squad is more useful than a planted explosive.' },
      { rank: 'Lieutenant', pick: 'Remote Start', pickId: 'reaper_remote_start',
        reason: 'Detonate any explosive as a free action from range — Claymore detonation without spending an action.',
        alt: 'Reaper\'s Mark', altId: 'reaper_reapers_mark',
        altCondition: 'If XP funneling to this Reaper is the goal.' },
      { rank: 'Captain', pick: 'Bladestorm', pickId: 'reaper_bladestorm',
        reason: 'Auto-counter melee attackers — a Reaper in concealment can be close to enemies and needs protection.',
        alt: 'Ghost of War', altId: 'reaper_ghost_of_war',
        altCondition: 'Deeper stealth — smaller detection radius for repositioning.' },
      { rank: 'Major', pick: 'Kill Zone', pickId: 'reaper_kill_zone',
        reason: 'Overwatch shot on every enemy in the aim cone — combined with concealment repositioning, very strong.',
        alt: 'Apex Ammo', altId: 'reaper_apex_ammo',
        altCondition: 'If Banish is the primary combat tool — Rupture adds ongoing damage per Banish shot.' },
      { rank: 'Colonel', pick: 'Phantom', pickId: 'reaper_phantom',
        reason: 'Stay concealed when the squad is revealed — the Reaper keeps scouting even in active combat.',
        alt: 'Death Dealer', altId: 'reaper_death_dealer',
        altCondition: 'If Banish is being used as the primary offensive tool — fewer ammo spent per activation.' },
    ],
    generalTips: [
      'Open every map by moving the Reaper ahead in concealment — reveal all pod positions before anyone commits.',
      'Plant Claymores near likely enemy movement paths before breaking concealment.',
      'Banish chains headshots on the Lost — one Banish activation can chain through 4–6 Lost for free actions.',
      'Silent Killer (free ability): kills don\'t break concealment. Scout, kill, scout again.',
      'Equip Spider Suit — grapple hook lets the Reaper reach elevated scout positions fast.',
    ],
    trainingCenterTip: 'Volatile Mix (+2 grenade damage) from Grenadier tree pairs with Claymore. Shadowstep from Ranger tree helps position without triggering overwatch while concealed.',
  },
  {
    classId: 'skirmisher',
    summary: '(WotC) Multi-action melee/ranged hybrid. Former ADVENT with a grapple and disruption tools.',
    role: 'Action Economy Engine / Disruptor',
    keyPrinciple: 'The Skirmisher\'s value is actions — Reflex + abilities = 3+ actions per turn at higher ranks.',
    rankRecs: [
      { rank: 'Corporal', pick: 'Justice', pickId: 'skirmisher_justice',
        reason: 'Pull a distant enemy to melee range and stun — massive repositioning/CC in one action.',
        alt: 'Wrath', altId: 'skirmisher_wrath',
        altCondition: 'If you want to charge forward into enemies rather than pulling them to you.' },
      { rank: 'Sergeant', pick: 'Reflex', pickId: 'skirmisher_reflex',
        reason: 'Free action at the start of every turn — enables 3 full actions per turn consistently.',
        alt: 'Opportunist', altId: 'skirmisher_opportunist',
        altCondition: 'If the Skirmisher is in overwatch frequently — normal aim on reaction fire is strong.' },
      { rank: 'Lieutenant', pick: 'Interrupt', pickId: 'skirmisher_interrupt',
        reason: 'Pre-empt an enemy action — fire before an enemy acts. Counters dangerous enemy abilities.',
        alt: 'Combat Presence', altId: 'skirmisher_combat_presence',
        altCondition: 'If allies are being fired upon frequently — free counter-shot protects the whole squad.' },
      { rank: 'Captain', pick: 'Battlelord', pickId: 'skirmisher_battlelord',
        reason: 'Interrupt triggers once per ENEMY TURN — essentially extra attacks during ADVENT\'s phase.',
        alt: 'Threat Assessment', altId: 'skirmisher_threat_assessment',
        altCondition: 'For Specialist bond synergy.' },
      { rank: 'Major', pick: 'Marauder', pickId: 'skirmisher_marauder',
        reason: 'Free move on kills — keeps the Skirmisher repositioning and continuing the chain.',
        alt: 'Whiplash', altId: 'skirmisher_whiplash',
        altCondition: 'If Justice/Wrath are the primary tools — bonus damage on both.' },
      { rank: 'Colonel', pick: 'High-Strung', pickId: 'skirmisher_highstrung',
        reason: 'Start every mission with Interrupt already active — free pre-emptive shot from turn 1.',
        alt: 'Reaper', altId: 'skirmisher_reaper',
        altCondition: 'If Reckoning kills are frequent — sword chain without ending turn.' },
    ],
    generalTips: [
      'With Reflex: you have 3 actions. Use Justice (1), shoot (2), Reckoning melee (3) — that\'s three attacks in one turn.',
      'Interrupt counters Priest Sustain — fire before the Priest heals to prevent the proc.',
      'Battlelord + Opportunist = full-aim Interrupt shots every enemy turn. Near-constant attacks.',
      'Skirmisher excels on timed missions — more actions per turn = objective reached faster.',
      'Equip Talon Rounds — high crit on flanks, and Skirmisher flanks regularly with Wrath/Justice repositioning.',
    ],
    trainingCenterTip: 'Bladestorm from Ranger tree gives an extra melee counter on enemy approach. Steady Hands from Sharpshooter (don\'t move bonus) is wasted on a Skirmisher — avoid.',
  },
  {
    classId: 'templar',
    summary: '(WotC) Psionic melee warrior. Gains Focus from kills to power devastating attacks.',
    role: 'Psi Melee / Focus Engine',
    keyPrinciple: 'Focus is the core mechanic — build it fast early in combat, spend it decisively. Parry at max Focus is nearly invulnerable.',
    rankRecs: [
      { rank: 'Corporal', pick: 'Volt', pickId: 'templar_volt',
        reason: 'Arc lightning at range — lets the Templar contribute before closing to melee. Scales with Focus.',
        alt: 'Rend', altId: 'templar_rend',
        altCondition: 'If melee is reliable from the start — Rend at max Focus deals massive burst damage.' },
      { rank: 'Sergeant', pick: 'Parry', pickId: 'templar_parry',
        reason: 'Passively dodges the first melee attack each turn — the Templar is in melee range, this is essential survival.',
        alt: 'Reflect', altId: 'templar_reflect',
        altCondition: 'If the Templar faces many ranged attackers and Parry isn\'t triggered.' },
      { rank: 'Lieutenant', pick: 'Bladestorm', pickId: 'templar_bladestorm',
        reason: 'Auto-counter adjacent enemies AND gain Focus on triggered attacks — synergises perfectly.',
        alt: 'Null Lance', altId: 'templar_null_lance',
        altCondition: 'If ranged psionic burst damage is preferred over melee sustain.' },
      { rank: 'Captain', pick: 'Fortress', pickId: 'templar_fortress',
        reason: 'Resist psionic and status effects — essential on Psi Gate and Chosen missions where psionics dominate.',
        alt: 'Rift', altId: 'templar_rift',
        altCondition: 'If the Templar consistently reaches 3 Focus — Rift is massive AoE psi damage.' },
      { rank: 'Major', pick: 'Ghost', pickId: 'templar_ghost',
        reason: 'At max Focus, create a phantom copy — double the attacks without spending actions.',
        alt: 'Amplify', altId: 'templar_amplify',
        altCondition: '+1 max Focus increases how long sustained Focus buffs last.' },
      { rank: 'Colonel', pick: 'Arc Wave', pickId: 'templar_arc_wave',
        reason: 'Line AoE psionic wave — clears clustered enemies that the Templar closes into.',
        alt: 'Apotheosis', altId: 'templar_apotheosis',
        altCondition: 'If the Templar consistently chains kills — bonus HP and faster Focus restore per kill.' },
    ],
    generalTips: [
      'Build Focus BEFORE engaging the dangerous targets — use Volt or a light Rend on trash enemies first.',
      'At max Focus (2–3), activate Parry passively before moving adjacent to elite enemies.',
      'Templar + Bladestorm means enemies can\'t approach without taking a hit AND triggering Focus gain.',
      'Ghost at max Focus = effectively 4 attacks in one turn when ghost strikes align with your attacks.',
      'The Templar has NO ranged weapon — keep a Specialist nearby for heal backup. They take hits in melee.',
    ],
    trainingCenterTip: 'Squadsight from Sharpshooter tree is wasted on a Templar. Run and Gun from Ranger lets the Templar dash AND use Volt/Rend in the same turn — excellent.',
  },
  {
    classId: 'spark',
    summary: '(Shen\'s Last Gift) Robotic soldier. Cannot be wounded — takes repair time instead. Immune to fire, poison, and psionic effects.',
    role: 'Frontline Tank / Mech Counter',
    keyPrinciple: 'Send the SPARK into danger zones first — it can\'t be wounded, so pod activations with a SPARK scout cost nothing if it survives.',
    rankRecs: [
      { rank: 'Corporal', pick: 'Overdrive', pickId: 'spark_overdrive',
        reason: '+1 action this turn at cost of 2 HP — worth it almost every turn. Three actions is enormous.',
        alt: 'Repair', altId: 'spark_repair',
        altCondition: 'If the SPARK is frequently damaged and you need self-sustain.' },
      { rank: 'Sergeant', pick: 'Battle Comp', pickId: 'spark_battle_comp',
        reason: '+10 aim and crit without Overdrive — strong when saving Overdrive for emergencies.',
        alt: 'Bulwark', altId: 'spark_bulwark',
        altCondition: 'If the SPARK shields adjacent allies — +10 defense passively for nearby soldiers.' },
      { rank: 'Lieutenant', pick: 'Integrated Systems', pickId: 'spark_integrated',
        reason: 'All special abilities cost 1 fewer action — more efficient Overdrive and Haywire use.',
        alt: 'Volatile', altId: 'spark_volatile',
        altCondition: 'If Overdrive is used aggressively as a damage setup every turn.' },
      { rank: 'Captain', pick: 'Wrecking Ball', pickId: 'spark_wrecking_ball',
        reason: 'Move through destructible cover freely — SPARK becomes a bulldozer, creating flanks for the squad.',
        alt: 'Sacrificial Protocol', altId: 'spark_sacrificial',
        altCondition: 'If SPARK is bodyguarding a key soldier — absorb 1 hit per turn on their behalf.' },
      { rank: 'Major', pick: 'Haywire Protocol', pickId: 'spark_haywire',
        reason: 'Hack robotic enemies — SPARK can hack Sectopods like a Specialist. Extremely useful.',
        alt: 'Adaptive Aim', altId: 'spark_adaptive',
        altCondition: 'If SPARK consistently fires at the same target multiple turns.' },
      { rank: 'Colonel', pick: 'Bombard', pickId: 'spark_bombard',
        reason: 'AoE barrage on an area — SPARK\'s version of a grenade, no supplies cost.',
        alt: 'Fortress Protocol', altId: 'spark_fortress',
        altCondition: 'If the SPARK needs passive damage reduction to survive longer in frontline positions.' },
    ],
    generalTips: [
      'SPARK can\'t be wounded — it enters repair downtime after missions. Never be afraid to send it first.',
      'Overdrive every turn — 3 actions on a high-damage frontliner is nearly always worth 2 HP.',
      'SPARK is immune to fire and poison — send it into burning tiles, acid pools, or Lost clusters without risk.',
      'Wrecking Ball + Overdrive: dash into a cluster, destroy cover for flanks, shoot twice — in one turn.',
      'SPARK can\'t equip armor upgrades or items — it compensates with raw stats and special abilities.',
      'Haywire Protocol + SPARK: a second hacker on the squad. Dual Sectopod hacks wins facility assaults.',
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function TrainingPanel() {
  const { classes: classData } = useGameData()
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

  const rec = CLASS_RECOMMENDATIONS.find(r => r.classId === selectedClassId)
  const classDef = classData.find((c: ClassDefinition) => c.id === selectedClassId)

  return (
    <div className="space-y-4">
      {/* Class selector */}
      <div className="grid grid-cols-3 gap-1.5">
        {CLASS_RECOMMENDATIONS.map(r => {
          const def = classData.find((c: ClassDefinition) => c.id === r.classId)
          return (
            <button
              key={r.classId}
              onClick={() => setSelectedClassId(id => id === r.classId ? null : r.classId)}
              className={`py-2 px-1 text-[10px] font-mono font-bold uppercase tracking-wider border rounded-sm transition-colors ${
                selectedClassId === r.classId
                  ? 'bg-amber-500 text-neutral-950 border-amber-500'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600'
              }`}
            >
              {def?.name ?? r.classId}
            </button>
          )
        })}
      </div>

      {!selectedClassId && (
        <div className="text-center py-8 text-neutral-600 font-mono text-sm">
          Select a class to see training recommendations.
        </div>
      )}

      {rec && (
        <div className="space-y-4">
          {/* Header */}
          <div className="border border-neutral-800 rounded-sm p-3 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-amber-400 text-sm">{classDef?.name ?? rec.classId}</span>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider border border-neutral-700 px-1.5 py-0.5 rounded-sm">
                {rec.role}
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400">{rec.summary}</p>
            <div className="mt-2 px-2 py-1.5 bg-amber-950/20 border border-amber-800/30 rounded-sm">
              <p className="text-[11px] font-mono text-amber-400 leading-snug">
                <span className="font-bold">Key principle: </span>{rec.keyPrinciple}
              </p>
            </div>
          </div>

          {/* Psi Lab tips (Psi Op only) */}
          {rec.psiLabTips && rec.psiLabTips.length > 0 && (
            <div className="space-y-2">
              <SectionDivider>Psi Lab Training Order</SectionDivider>
              <div className="space-y-1.5">
                {rec.psiLabTips.map((tip, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="shrink-0 mt-[4px] w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <p className="text-[11px] font-mono text-neutral-300 leading-snug">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rank recommendations */}
          {rec.rankRecs.length > 0 && (
            <div className="space-y-2">
              <SectionDivider>Recommended Picks</SectionDivider>
              <div className="space-y-2">
                {rec.rankRecs.map(rr => (
                  <div key={rr.rank} className="border border-neutral-800 rounded-sm overflow-hidden">
                    <div className="bg-neutral-900 px-3 py-2 flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 w-20 shrink-0">
                        {rr.rank}
                      </span>
                      <span className="font-mono font-bold text-sm text-amber-400">{rr.pick}</span>
                    </div>
                    <div className="px-3 py-2 space-y-1.5 bg-neutral-950">
                      <p className="text-[11px] font-mono text-neutral-300 leading-snug">{rr.reason}</p>
                      {rr.alt && (
                        <div className="flex gap-1.5 items-start pt-0.5 border-t border-neutral-800/50 mt-1.5">
                          <span className="text-[10px] font-mono text-neutral-600 shrink-0 mt-0.5">Alt:</span>
                          <p className="text-[10px] font-mono text-neutral-500 leading-snug">
                            <span className="text-neutral-400">{rr.alt}</span>
                            {rr.altCondition && ` — ${rr.altCondition}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General tips */}
          <div className="space-y-2">
            <SectionDivider>General Tips</SectionDivider>
            <div className="space-y-1.5">
              {rec.generalTips.map((tip, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="shrink-0 mt-[5px] w-1 h-1 rounded-full bg-amber-600" />
                  <p className="text-[11px] font-mono text-neutral-400 leading-snug">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Training Center tip */}
          {rec.trainingCenterTip && (
            <div className="px-3 py-2.5 bg-blue-950/20 border border-blue-800/30 rounded-sm">
              <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 mb-1">
                Training Center (WotC) — Cross-Class AP
              </div>
              <p className="text-[11px] font-mono text-blue-300 leading-snug">{rec.trainingCenterTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-500">{children}</span>
      <div className="flex-1 h-px bg-neutral-800" />
    </div>
  )
}
