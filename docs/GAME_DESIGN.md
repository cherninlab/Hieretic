# HIERETIC - Game Design Document

## Core Mechanics

### Layer System

The game operates across three distinct layers of reality, each with its own mechanics and strategic focus.

#### Material Layer

The realm of physical manifestation and transformation.

**Key Mechanics:**

- Direct damage and healing effects
- Physical transformations
- Unit enhancement

**Example Cards:**

- **Blood Weaver**: Transform health into temporary power
- **Bone Sculptor**: Transform unit's defense into attack
- **Stone Heart**: Grant immunity to direct damage
- **Matter Shifter**: Change unit's base stats
- **Physical Anchor**: Lock a unit's stats

#### Mind Layer

The domain of psychological manipulation and control.

**Key Mechanics:**

- Unit control and corruption
- Memory and knowledge effects
- Psychological manipulation
- Information gathering

**Example Cards:**

- **Memory Thief**: Copy opponent's unit abilities
- **Mind Fracture**: Split unit into two weaker versions
- **Thought Parasite**: Take control of opponent's unit
- **Dream Weaver**: Create illusion copies
- **Mental Fortress**: Protect from mind control

### Resource System

Each layer maintains its own global resource pool:

- **Material**: Physical essence (●)
- **Mind**: Mental energy (○)

Resources are shared within each layer and refresh each turn. Some cards can temporarily modify resource generation or availability.

### Combat Mechanics

1. **Unit Placement**

   - Four slots per player
   - Units can interact across different layers
   - Position affects targeting and effect ranges

2. **Layer Interaction**

   - Effects can cascade across layers
   - Some units exist in multiple layers simultaneously
   - Layer priority affects resolution order

3. **Turn Structure**

   - Draw Phase: Draw card(s)
   - Main Phase: Play cards and activate effects
   - Combat Phase: Units attack
   - End Phase: Resolve end-of-turn effects

## Card Design

### Card Types

1. **Units**

   - Base Stats (Attack/Defense)
   - Layer Alignment
   - Special Abilities

2. **Effects**

   - Immediate Impact
   - Duration
   - Layer Requirements

3. **Rituals**

   - Multi-turn Effects
   - Layer-spanning Impacts

### Card Categories

1. **Layer-Specific**

   - Cards that only work within their aligned layer
   - Strong effects but limited flexibility

2. **Multi-Layer**

   - Cards that interact across layers
   - More flexible but more complex to use

3. **Universal**

   - Basic effects that work in any layer
   - Generally weaker but more reliable

## Strategic Elements

### Deck Building

- Minimum 30 cards
- Maximum 3 copies of any card
- Layer balance requirements
- Synergy planning

### Win Conditions

1. **Primary**

   - Reduce opponent's health to 0
   - Deplete opponent's deck

2. **Special**

   - Layer-specific victory conditions
   - Alternative win conditions through specific cards

## Future Development

### Planned Features

1. **Content Expansions**

   - New card sets
   - Additional layers
   - Special game modes

2. **Competitive Features**
   - Ranked ladder system
   - Tournament support
   - Seasonal content

### Balance Considerations

- Layer power balance
- Card synergy limits
- First player advantage mitigation
- Cross-layer interaction balance

## Technical Architecture

### Frontend

- **Framework**: React
- **State Management**: Zustand
- **Routing**: React Router
- **Animations**: Framer Motion
- **Styling**: CSS Modules

### Backend

- **Environment**: Cloudflare Workers
- **Storage**: KV Namespaces for game state, user profiles, and decks
- **Assets**: R2 Buckets for storing card artwork
