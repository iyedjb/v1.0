# VURO - Streetwear E-commerce Platform

## Overview

VURO is a Brazilian streetwear e-commerce platform specializing in sneakers. The application is built as a modern React single-page application with a dark urban aesthetic, featuring product browsing, category filtering, shopping cart functionality, and checkout flow. The platform supports both static product data and dynamic products managed through Firebase Realtime Database, with an admin interface for product management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Routing**: React Router DOM for client-side navigation
- **State Management**: React Query (@tanstack/react-query) for server state, React useState for local state
- **Styling**: Tailwind CSS with CSS variables for theming, supporting a dark urban design system

### Component Structure
- **UI Components**: Built on Radix UI primitives with shadcn/ui patterns located in `src/components/ui/`
- **Feature Components**: Organized by domain (header, footer, product, category, content, about)
- **Pages**: Route-level components in `src/pages/`

### Design System
- Dark theme with red accent colors (streetwear aesthetic)
- Custom fonts: DM Sans (primary), Bebas Neue and Space Grotesk (display)
- CSS variables defined in `src/index.css` for consistent theming
- Responsive design with mobile-first approach

### Data Flow
- Products can come from static data (`staticProducts` array) or Firebase Realtime Database
- `useProducts` hook merges static and dynamic product sources
- Shopping cart state managed locally in Navigation component (would benefit from global state)

### Key Routes
- `/` - Homepage with hero, product carousels, and editorial content
- `/category/:category` - Product listing with filters
- `/product/:productId` - Product detail page
- `/checkout` - Checkout flow
- `/chat` - Buyer-seller messaging system
- `/admin` - Product management interface
- `/about/*` - Informational pages (story, sustainability, size guide, etc.)

### Chat Feature
- **Purpose**: Allow buyers to communicate with sellers about products
- **Storage**: Firebase Realtime Database (conversations and messages nodes)
- **Components**: 
  - `src/hooks/use-chat.ts` - Chat hooks for conversations and messages
  - `src/pages/Chat.tsx` - Chat page with conversation list and message window
- **Features**: 
  - Start conversation from product page ("Falar com Vendedor" button)
  - Real-time message updates via Firebase listeners
  - Unread message counts
  - Mobile-responsive design

## External Dependencies

### Firebase Integration
- **Service**: Firebase Realtime Database
- **Purpose**: Dynamic product storage and management
- **Configuration**: Located in `src/lib/firebase.ts`
- **Project**: vuro-louay (Firebase project)
- **Features Used**: Real-time data sync via `onValue` listener, product CRUD operations

### Payment Processing
- **Service**: Stripe
- **Integration**: stripe-replit-sync connector
- **Currency**: BRL (Brazilian Real)
- **Locale**: pt-BR
- **Security**: Server-side price validation from trusted product catalog (server/products.ts)
- **Features**: Hosted checkout page, webhook handling, payment verification

### Third-Party Services
- **Google Fonts**: DM Sans, Bebas Neue, Space Grotesk loaded via CDN
- **Google Maps Embed**: Used in store locator page

### Key NPM Dependencies
- **@radix-ui/***: Accessible UI primitives for dialogs, dropdowns, accordions, etc.
- **embla-carousel-react**: Product carousel functionality
- **lucide-react**: Icon library
- **react-hook-form + @hookform/resolvers**: Form handling with validation
- **date-fns + react-day-picker**: Date picking functionality
- **class-variance-authority + clsx + tailwind-merge**: Utility-first styling helpers

### Development Tools
- **TypeScript**: Strict mode disabled for flexibility
- **ESLint**: Configured with React hooks and refresh plugins
- **Path Aliases**: `@/*` maps to `src/*` for clean imports

## Production Ready Features

### Checkout & Payments
- **Stripe Checkout**: Opens hosted payment page with card, Google Pay, Apple Pay
- **Price Conversion**: Prices stored in REAIS, converted to centavos for Stripe (multiply by 100)
- **Discounts**: Applied via coupon code at checkout only
- **PIX Discount**: 5% discount for PIX payments
- **Shipping Validation**: Email, address, city, CEP validated before payment

### Admin Emails
- louayjbara2025@gmail.com
- sassisawsen2024@gmail.com
- louayjbara@gmail.com
- info@loja.vuro.com.br

### Price Format Notes
- Firebase stores prices as strings (e.g., "R$ 172,00") or numbers
- parsePrice() function converts to REAIS (e.g., 172.00)
- Stripe requires prices in centavos (e.g., 17200)
- Server multiplies by 100 before sending to Stripe

### Known Behaviors
- Stripe Checkout opens in new tab in Replit environment (normal)
- Webhook cleanup errors in logs are automatic cleanup (normal)