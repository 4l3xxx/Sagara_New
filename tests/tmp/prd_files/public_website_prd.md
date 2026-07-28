# Product Specification: Sagara Public Website

## 1. Project Overview
**Sagara** is a premium IT Solutions and Consulting platform designed to bridge the gap between complex technology and corporate business goals. The public website serves as the primary landing page for potential clients (Enterprises, SMEs, and Government bodies) to explore services, view past work, and initiate consultations.

## 2. Target Audience
- **Enterprise Leaders**: Looking for digital transformation and cloud roadmaps.
- **SMEs**: Seeking cost-effective IT outsourcing and rapid onboarding.
- **Talent Seekers**: Developers and professionals looking for careers at Sagara.
- **Industry Partners**: Government bodies and tech corporations looking for collaboration.

## 3. Core Features & Functionality

### 3.1 Multi-Language Support (Localization)
- **Languages**: English (EN) and Indonesian (ID).
- **Mechanism**: Client-side switching via `localStorage` and `data-lang` attributes.
- **Consistency**: Persistent language choice across page navigations.

### 3.2 Sagara AI Chatbot
- **UI**: Floating Action Button (FAB) with a persistent chat panel.
- **Features**: Real-time interaction (powered by LLM), quick action buttons, and status indicators.
- **Styling**: Premium "Outfit" font branding with glassmorphism effects.

### 3.3 Consultation System
- **Pages**: `contact.html`
- **Fields**: Full Name, Email (validated for `@gmail.com`), Service Type, Project Details.
- **Integration**:
    - **Backend**: Saves lead data to `/api/consultation` (Supabase/PostgreSQL).
    - **User Action**: Automated redirection to Gmail compose with pre-filled subject and body for immediate follow-up.

### 3.4 Content Hubs
- **Services**: Detailed breakdown of Web, Mobile, UI/UX, and Outsourcing solutions.
- **Portfolio & Case Studies**: Interactive display of successful project outcomes.
- **Blog**: Industry insights and company updates.
- **Careers**: Job listings and recruitment information.

### 3.5 Marketing & Trust
- **Trust Marquee**: Continuous scroll of certifications (ISO 27001) and partner logos.
- **Newsletter**: Subscription form at footer with duplicate prevention and backend storage.
- **Hero Section**: High-impact visuals with productivity metrics (+45% Productivity).

## 4. Technical Architecture

### 4.1 Frontend Stack
- **Structure**: Semantic HTML5.
- **Styling**: Tailwind CSS (via CDN with custom configuration).
- **Icons**: Material Symbols Outlined.
- **Fonts**: Inter (Display), Open Sans (Body), Syne/Outfit (Branding).

### 4.2 Backend & Data
- **Environment**: Node.js with Express.js.
- **Endpoints**:
    - `POST /api/consultation`: Handles lead generation data.
    - `POST /api/newsletter/subscribe`: Handles subscription requests.
- **Database**: PostgreSQL (managed via Supabase).

## 5. Design & Aesthetics (Premium UX)
- **Theme**: Light/Dark mode support (via `class="light"` on `<html>`).
- **Aesthetics**: 
    - Glassmorphism (Backdrop blur, semi-transparent borders).
    - Smooth transitions and hover scales.
    - Gradient accents (Primary Blue: `#137fec`, CTA Orange: `#f97316`).
    - Skeleton loaders for better perceived performance.

## 6. Success Metrics
- **Lead Generation**: Number of consultation requests submitted.
- **Engagement**: Chatbot interaction rate.
- **Retention**: Newsletter subscription growth.
- **UX**: Fast initial load times (Loading screen implementation).
