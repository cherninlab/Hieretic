# Hieretic

<div align="center">
  <img src="docs/assets/logo.png" alt="Hieretic" width="200"/>

  
  [![Development Status](https://img.shields.io/badge/status-pre--alpha-red.svg)](https://github.com/cherninlab/hieretic)
</div>

## Overview

Hieretic is a psychological horror card game exploring the duality of existence through strategic gameplay. Players navigate between the Material (🜔) and Mind (🜕) layers, wielding powers that blur the boundaries between reality and madness.

### Core Mechanics
- **Dual-Layer System**: Each player maintains parallel boards in both Material (🜔) and Mind (🜕) realms
- **Resource Management**: Balance physical (🜔) and psychological (🜕) resources
- **Strategic Depth**: Every card can affect multiple layers of reality
- **Psychological Horror**: Deep thematic integration with gameplay mechanics

## Documentation

- [Game Design Document](docs/GAME_DESIGN.md) - Complete mechanical specifications
- [API Reference](docs/API.md) - Technical implementation details

## Development

### Prerequisites
```bash
Node.js >= 18.x
npm >= 9.x
```

### Installation
```bash
# Clone the repository
git clone https://github.com/cherninlab/hieretic.git

# Install dependencies
cd hieretic
npm install
```

### Development Server
```bash
# Start development server
npm run dev

# Run tests
npm test

# Build production version
npm run build
```

### Backend Services
```bash
# Start local backend
npm run wrangler-dev

# Deploy to production
npm run wrangler-publish
```

## Project Structure

```
src/
├── client/          # Frontend application
│   ├── components/  # React components
│   ├── hooks/       # Custom React hooks
│   ├── pages/       # Route pages
│   └── store/       # State management
├── shared/          # Shared types and utilities
│   ├── types/       # TypeScript definitions
│   └── testing/     # Test data and utilities
└── worker/          # Backend services
    ├── api/         # API routes
    └── core/        # Game logic
```

## Core Systems

### Layer Management
```typescript
interface LayerState {
  material: BoardState;  // 🜔 Physical realm
  mind: BoardState;      // 🜕 Psychological realm
}
```

### Resource Types
| Symbol | Name | Description |
|--------|------|-------------|
| 🜔 | Material | Physical essence |
| 🜕 | Mind | Psychological energy |
| 🜂 | Attack | Offensive power |
| 🜄 | Defense | Protective barrier |
