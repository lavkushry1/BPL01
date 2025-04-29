# Eventia Design System

This document outlines the design system implemented for the Eventia Ticketing Platform. The system provides a consistent visual language across the application through tokens, components, and patterns.

## 1. Design Tokens

The design tokens are implemented in two formats:
- JSON format: `eventia-ticketing-flow1/src/styles/tokens.json`
- CSS Variables: `eventia-ticketing-flow1/src/styles/theme.css`

### Token Categories

#### Colors
- **Primary**: Blue-based palette (#E6F7FF to #003A8C)
- **Secondary**: Purple-based palette (#F9F0FF to #22075E)
- **Accent**: Orange-based palette (#FFF7E6 to #873800)
- **Neutrals**: Grayscale palette (white, #F5F5F5 to black)
- **Semantic**: Success, Warning, Error, Info colors

#### Typography
- **Font Families**: Primary (Inter), Secondary (Poppins), Mono (SFMono-Regular)
- **Font Sizes**: XS (0.75rem) to 6XL (3.75rem)
- **Font Weights**: Thin (100) to Black (900)
- **Line Heights**: None (1) to Loose (2)
- **Heading Styles**: H1-H6 with consistent sizing and weights

#### Spacing
- Based on a 0.25rem (4px) scale
- Ranging from 0 to 64 (16rem)

#### Shadows
- XS to 2XL
- Inner shadow
- None

#### Border Radius
- None to Full (9999px)

#### Breakpoints
- XS to 2XL for responsive design

#### Z-Indices
- 0 to 50 for stacking context

## 2. Components Implemented

### UI Components

#### Button (`components/ui/Button.tsx`)
- Features:
  - Multiple variants: primary, secondary, outline, text
  - Size options: sm, md, lg
  - Loading state
  - Icon support (left/right)
  - Keyboard accessibility

### Homepage Components

#### Hero (`components/home/Hero.tsx`)
- Features:
  - Full-width banner with dynamic carousel
  - Auto-rotating images with manual controls
  - Headline, sub-headline, CTA buttons
  - Mobile-responsive
  - Loading state skeleton

#### FeaturedEvents (`components/home/FeaturedEvents.tsx`)
- Features:
  - Horizontally scrollable event cards
  - Arrow navigation for scrolling
  - "See all featured" navigation
  - Event price badges
  - Loading state skeleton

### Event Discovery Components

#### FilterBar (`components/events/FilterBar.tsx`)
- Features:
  - Text search with debounce
  - Category filter buttons
  - Date range pickers
  - Location detection
  - Filter reset functionality
  - Loading state skeleton

#### EventCard (`components/events/EventCard.tsx`)
- Features:
  - Image with category and price badges
  - Title with truncation
  - Date/time and location display
  - Book now button
  - Loading state skeleton

## 3. Integration

All components are integrated with the design token system through:
- Direct reference to CSS variables
- React Context-based theming via `ThemeProvider`
- Centralized configuration in `project.config.json`

## 4. Usage Example

```tsx
// Example of using the Hero component
import { Hero } from '@/components/home/Hero';

const HomePage = () => {
  const events = [/* event data */];
  
  return (
    <div>
      <Hero events={events} />
      <FeaturedEvents events={events} />
    </div>
  );
};
```

## 5. Future Improvements

- Add Storybook integration for component documentation
- Implement dark mode theming
- Create more UI components (forms, cards, modals)
- Improve animation and transitions
- Add automated accessibility testing 