export const GameActionTypes = {
  // Turn Actions
  START_TURN: 'START_TURN',
  END_TURN: 'END_TURN',
  CHANGE_PHASE: 'CHANGE_PHASE',

  // Card Actions
  DRAW_CARD: 'DRAW_CARD',
  PLAY_CARD: 'PLAY_CARD',
  ACTIVATE_ABILITY: 'ACTIVATE_ABILITY',

  // Combat Actions
  DECLARE_ATTACK: 'DECLARE_ATTACK',
  DECLARE_BLOCK: 'DECLARE_BLOCK',
  RESOLVE_COMBAT: 'RESOLVE_COMBAT',

  // Layer Actions
  CHANGE_LAYER: 'CHANGE_LAYER',

  // Resource Actions
  SPEND_RESOURCES: 'SPEND_RESOURCES',
  GAIN_RESOURCES: 'GAIN_RESOURCES',
} as const;

export type GameActionType = (typeof GameActionTypes)[keyof typeof GameActionTypes];
