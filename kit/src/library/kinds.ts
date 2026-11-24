/**
 * Every kind of thing the knowledge library holds. One folder per kind under library/, one folder per item inside it.
 * Adding a kind = one line here (+ an optional data schema in schema.ts). The list is the product's vocabulary of
 * taste: what a pro editor reaches for, split so each piece can be found, ranked, tailored and learned on its own.
 */
export const KINDS = {
  // ── type and words
  'caption': 'A caption look: type system, colours, highlight, placement, how words appear. Tailored per video by code.',
  'caption-animation': 'How a caption word, line or letter enters, exits or is emphasised (in.pop, emphasis.glow...).',
  'font': 'A typeface family with its files and licence.',
  'type-pairing': 'A display + companion font pair with size ratios (bold caps + script/serif).',
  'title': 'Kinetic title / hook text treatments (big statements, chapter headers).',
  // ── sound
  'sfx': 'A sound effect with the events it fits, its level and how it aligns (attack, peak or end on the moment).',
  'sound-kit': 'A set of sfx + mixing rules (min gap, priority, ceiling) a style uses together.',
  'music': 'A music bed or track with mood, tempo, measured loudness and licence.',
  'mix-profile': 'Loudness target, ducking, voice processing, sfx level relative to voice.',
  // ── picture
  'transition': 'A change between shots or looks (cut, flash, whip, line wipe, blur-through, light burn...).',
  'camera': 'A camera move on flat footage (punch-in, drift, shake, dive, Ken Burns...).',
  'effect': 'A pixel effect preset built on registry effects (glow, aberration, grain, light leak...).',
  'grade': 'A colour grade: LUT and/or contrast/saturation/warmth values, vignette, grain.',
  'subject': 'A treatment of the person: cutout + rim, background dim/swap, card, circle, void, B&W, frame-in-frame.',
  'background': 'A ground behind or instead of the footage: colour field, gradient, texture, world.',
  'overlay': 'A texture or light over the picture: film burn, dust, paper, light leak, vignette.',
  'motion-graphic': 'A graphic that acts out a sentence: stat, list stack, chapter card, lower third, UI mock, chart, badge, callout, arrow, progress bar.',
  'sticker': 'Icons, emoji, small illustrations that pop in.',
  'prop-3d': 'A 3D object or small world (desk, phone, coins, brain...) rendered in code.',
  'layout': 'Where the A-roll and graphics sit: full, split, picture-in-picture, face-left/text-right, low.',
  'broll-rule': 'When and how to search stock/B-roll for a sentence, and how to frame it.',
  // ── system
  'palette': 'Colours with meaning roles (hot, warm, cool, ink, paper, ground) and tint ramps.',
  'ease': 'A named motion curve with its feel and where it fits.',
  'pace': 'Rhythm profile: change interval, rest-beat share, transition budget, words per second.',
  'brand-frame': 'Logo bug, bottom fall-off, end card, CTA.',
  'hook': 'An opening pattern for the first 2 seconds.',
  'component': 'Sandboxed code that draws something the dictionary cannot express (props schema + draw).',
  // ── composition of taste
  'recipe': 'A beat-level combination: role → layout + caption + graphic + sfx + camera + transition, with slots.',
  'style': 'A dialect: palette, type, grade, pace, sound kit and the recipes it allows. One video speaks one style.',
  'template': 'A whole engine that edits a video end to end. Indexed here so it is findable.',
  // ── why
  'principle': 'A rule of taste. Measurable ones point at a lint rule; the rest are short cards with evidence.',
  'reference': 'An analysis of a reference video: what it is, its beats, measured numbers, the why (never its media).',
} as const;

export type Kind = keyof typeof KINDS;
export const KIND_IDS = Object.keys(KINDS) as Kind[];
