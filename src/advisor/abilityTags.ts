import type { CapabilityTag } from './types'
import type { SoldierClass } from '../data/types'

// Maps every ability id → capability tags it provides.
// Tags drive the scoring engine — more matches = higher mission fit score.

export const ABILITY_TAGS: Record<string, CapabilityTag[]> = {
  // ── Ranger ──────────────────────────────────────────────────────────
  ranger_slash:         ['melee'],
  ranger_run_and_gun:   ['mobility', 'actionEconomy'],
  ranger_phantom:       ['concealment'],
  ranger_shadowstep:    ['mobility', 'concealment'],
  ranger_implacable:    ['actionEconomy', 'mobility'],
  ranger_bladestorm:    ['melee', 'crowdControl'],
  ranger_lightning_hands: ['burst', 'actionEconomy'],
  ranger_untouchable:   ['sustain'],
  ranger_aggression:    ['burst'],
  ranger_reaper:        ['melee', 'actionEconomy', 'ammoEfficiency'],
  ranger_rapid_fire:    ['burst'],
  ranger_face_off:      ['aoe', 'burst'],
  ranger_whirlwind:     ['melee', 'aoe'],

  // ── Sharpshooter ────────────────────────────────────────────────────
  sharp_squadsight:     ['burst'],
  sharp_long_watch:     ['crowdControl'],
  sharp_death_from_above: ['burst'],
  sharp_return_fire:    ['burst'],
  sharp_sniper_creed:   ['burst'],
  sharp_aim:            ['burst'],
  sharp_quickdraw:      ['actionEconomy', 'burst'],
  sharp_steady_hands:   ['burst'],
  sharp_fan_fire:       ['burst'],
  sharp_kill_zone:      ['crowdControl', 'aoe'],
  sharp_lightning_hands: ['burst', 'actionEconomy'],
  sharp_serial:         ['burst', 'actionEconomy'],
  sharp_face_off:       ['aoe', 'burst'],

  // ── Grenadier ───────────────────────────────────────────────────────
  gren_heavy_ordnance:  ['aoe'],
  gren_shredder:        ['armorShred'],
  gren_volatile_mix:    ['aoe', 'burst'],
  gren_holo_targeting:  ['burst'],           // squad-wide aim buff
  gren_salvo:           ['actionEconomy', 'aoe'],
  gren_suppression:     ['crowdControl'],
  gren_rupture:         ['burst', 'armorShred'],
  gren_chain_shot:      ['burst'],
  gren_demolition:      ['aoe', 'armorShred'],
  gren_saturation_fire: ['aoe', 'crowdControl'],
  gren_area_suppression:['crowdControl', 'aoe'],
  gren_full_auto:       ['burst'],
  gren_armageddon:      ['aoe', 'burst'],

  // ── Specialist ──────────────────────────────────────────────────────
  spec_gremlin:         ['hacking'],
  spec_field_medic:     ['sustain'],
  spec_haywire:         ['hacking', 'crowdControl'],
  spec_combat_protocol: ['burst'],           // ignores armor — anti-mech
  spec_aid_protocol:    ['sustain'],
  spec_scanning_protocol: ['concealment'],   // reveals hidden enemies
  spec_revival_protocol:['sustain'],
  spec_threat_assessment:['crowdControl', 'sustain'],
  spec_ever_vigilant:   ['crowdControl'],
  spec_capacitor_discharge: ['aoe', 'crowdControl'],
  spec_guardian:        ['sustain', 'crowdControl'],
  spec_tyrant:          ['hacking', 'crowdControl'],
  spec_restoration:     ['sustain'],

  // ── Psi Operative ───────────────────────────────────────────────────
  psi_stasis:           ['crowdControl'],
  psi_insanity:         ['crowdControl', 'psionics'],
  psi_inspire:          ['actionEconomy', 'sustain'],
  psi_null_lance:       ['burst', 'psionics'],
  psi_void_rift:        ['aoe', 'crowdControl', 'psionics'],
  psi_solace:           ['crowdControl', 'sustain', 'psionics'],
  psi_soulfire:         ['burst', 'psionics'],
  psi_domination:       ['crowdControl', 'actionEconomy', 'psionics'],
  psi_fortress:         ['sustain', 'psionics'],
  psi_sustain:          ['sustain', 'psionics'],

  // ── SPARK (Shen's Last Gift) ────────────────────────────────────────
  spark_repair:         ['sustain'],
  spark_overdrive:      ['actionEconomy', 'burst'],
  spark_battle_comp:    ['burst'],
  spark_bulwark:        ['sustain'],
  spark_volatile:       ['burst', 'melee'],
  spark_integrated:     ['actionEconomy'],
  spark_wrecking_ball:  ['mobility', 'aoe'],
  spark_sacrificial:    ['sustain'],
  spark_haywire:        ['hacking', 'crowdControl'],
  spark_adaptive:       ['burst'],
  spark_bombard:        ['aoe', 'burst'],
  spark_fortress:       ['sustain'],

  // ── Reaper (WotC) ───────────────────────────────────────────────────
  reaper_silent_killer: ['concealment', 'ammoEfficiency'],
  reaper_banish:        ['burst', 'ammoEfficiency'],
  reaper_shadow:        ['concealment'],
  reaper_claymore:      ['aoe', 'burst'],
  reaper_distraction:   ['crowdControl'],
  reaper_reapers_mark:  ['burst'],
  reaper_remote_start:  ['aoe', 'burst', 'actionEconomy'],
  reaper_bladestorm:    ['melee'],
  reaper_ghost_of_war:  ['concealment'],
  reaper_apex_ammo:     ['burst', 'armorShred'],
  reaper_kill_zone:     ['crowdControl', 'aoe'],
  reaper_death_dealer:  ['ammoEfficiency', 'burst'],
  reaper_phantom:       ['concealment'],

  // ── Skirmisher (WotC) ───────────────────────────────────────────────
  skirmisher_reckoning: ['melee', 'crowdControl'],
  skirmisher_justice:   ['crowdControl', 'actionEconomy', 'mobility'],
  skirmisher_wrath:     ['melee', 'mobility'],
  skirmisher_reflex:    ['actionEconomy'],
  skirmisher_opportunist: ['burst', 'crowdControl'],
  skirmisher_combat_presence: ['burst', 'actionEconomy'],
  skirmisher_interrupt: ['crowdControl', 'actionEconomy'],
  skirmisher_battlelord:['actionEconomy', 'crowdControl'],
  skirmisher_whiplash:  ['burst', 'melee'],
  skirmisher_marauder:  ['actionEconomy', 'mobility'],
  skirmisher_highstrung:['actionEconomy', 'crowdControl'],
  skirmisher_reaper:    ['melee', 'actionEconomy'],
  skirmisher_threat_assessment: ['sustain', 'crowdControl'],

  // ── Templar (WotC) ──────────────────────────────────────────────────
  templar_focus:        ['burst', 'psionics'],
  templar_volt:         ['aoe', 'burst', 'psionics'],
  templar_rend:         ['melee', 'burst'],
  templar_reflect:      ['sustain', 'psionics'],
  templar_parry:        ['sustain'],
  templar_null_lance:   ['burst', 'psionics'],
  templar_bladestorm:   ['melee', 'crowdControl'],
  templar_fortress:     ['sustain', 'psionics'],
  templar_rift:         ['aoe', 'burst', 'psionics'],
  templar_amplify:      ['burst', 'psionics'],
  templar_ghost:        ['actionEconomy'],
  templar_arc_wave:     ['aoe', 'burst'],
  templar_apotheosis:   ['burst', 'sustain'],
}

// Class innate aptitudes — used when a soldier has no abilities logged yet.
// These represent what the class CAN contribute, even before abilities are chosen.
export const CLASS_INNATE: Record<SoldierClass, Partial<Record<CapabilityTag, number>>> = {
  ranger:        { burst: 1, melee: 2, mobility: 2, ammoEfficiency: 1 },
  sharpshooter:  { burst: 3, crowdControl: 1 },
  grenadier:     { aoe: 3, armorShred: 2, crowdControl: 1, burst: 1 },
  specialist:    { hacking: 3, sustain: 2, crowdControl: 1 },
  psi_operative: { crowdControl: 3, psionics: 3, burst: 1, sustain: 1 },
  spark:         { burst: 2, sustain: 2, hacking: 1, aoe: 1 },
  reaper:        { burst: 2, concealment: 3, ammoEfficiency: 2, mobility: 1 },
  skirmisher:    { melee: 2, actionEconomy: 3, mobility: 2, crowdControl: 1 },
  templar:       { melee: 2, aoe: 2, burst: 2, psionics: 1 },
}

// Abilities that constitute "freeze/stasis" options for Ruler encounters
export const RULER_STASIS_ABILITIES = new Set([
  'psi_stasis',
  'spec_gremlin', // via haywire
  'spec_haywire',
  'spec_tyrant',
])

// Abilities that provide psionic protection (useful vs Warlock, Sectoid, Priest)
export const PSI_PROTECTION_ABILITIES = new Set([
  'psi_fortress',
  'psi_solace',
  'templar_fortress',
  'spark_fortress',
])
