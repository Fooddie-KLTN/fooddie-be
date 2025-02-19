# Edutech Frontend

---

## Table of Contents

- [Overview](#overview)
- [Folder Structure](#project-structure)
  - [Project Structure Rundown](#project-structure-rundown)
- [TODO List](#TODO-List)

---

## Overview

The Edutech Frontend project is a frontend for website built using
Next.js. The project is structured to ensure maintainability and
scalability, with a clear separation of concerns across different
components and modules.  
This website is built with Responsive Design in mind. Each component
are carefully adjust to fit with the responsive requirements for
common screen sizes iPhone 13 Mini screen-size (375x812), Desktop
screen-size (1920x1080).

## Project structure

```
FE/src
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── page.tsx
│   └── layout.tsx
├── components/
│   ├── home/
│   │   ├── benefit.tsx
│   │   ├── blog.tsx
│   │   ├── coaching.tsx
│   │   ├── collection.tsx
│   │   ├── combo.tsx
│   │   ├── cta.tsx
│   │   ├── experience.tsx
│   │   ├── incoming.tsx
│   │   ├── promotion.tsx
│   │   ├── sticky-banner.tsx
│   │   ├── testimonial.tsx
│   │   └── ...
│   ├── ui/
│   │   ├── brand.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   └── ...
│   ├── footer.tsx
│   ├── icon.tsx
│   ├── navigation.tsx
│   └──section-wrapper.tsx
├── lib/
│   ├── utils.tsx
│   └── ...
└── types.ts
```

### Project structure rundown

- `/src/` - Non-documentation files like pages or custom React
  components.
- `/src/app/` - Contains the global styles, layout, and page
  components. All pages are rendered in the **page.tsx** file.
- `/src/components/` - Contains the components used in the project.
- `/src/lib/` - Contains the utility functions.
- `/src/types.ts` - Contains the TypeScript types.
- `/src/app/pages.tsx` - Index page of the frontend.
- `/src/components/ui/` - Contains the UI components that are used
  across the project. Each component is a separate file.
- `/src/components/footer.tsx` - Contains the footer component.
- `/src/components/icon.tsx` - Contains the icon component.
- `/src/components/navigation.tsx` - Contains the navigation
  component.
- `/src/components/section-wrapper.tsx` - Contains the section wrapper
  component for reuse of the section tag with pre-styled.
- `/src/components/home/` - Contains the components for the homepage.
  Each component is a separate file.
- `/src/components/home/benefit` - Contains the components for the
  benefits section of the homepage.
- `/src/components/home/blog` - Contains the components for the blog
  section of the homepage.
- `/src/components/home/coaching` - Contains the components for the
  coaching section of the homepage.
- `/src/components/home/collection` - Contains the components for the
  collection section of the homepage.
- `/src/components/home/combo` - Contains the components for the combo
  section of the homepage.
- `/src/components/home/cta` - Contains the components for the CTA
  section of the homepage.
- `/src/components/home/experience` - Contains the components for the
  experience section of the homepage.
- `/src/components/home/incoming` - Contains the components for the
  incoming section of the homepage.
- `/src/components/home/promotion` - Contains the components for the
  promotion section of the homepage.
- `/src/components/home/sticky-banner` - Contains the components for
  the sticky-banner section of the homepage.
- `/src/components/home/testimonial` - Contains the components for the
  testimonial section of the homepage.

## TODO List

### Homepage

- [ ] Implement the homepage with the following sections:
  - [x] Hero section
  - [x] Collection section
  - [x] Combo section
  - [x] Coaching section
  - [x] Promotion section
  - [x] Testimonial section
  - [x] Blog section
  - [x] Benefit section
  - [ ] Experience section
  - [x] CTA section
  - [x] Sticky banner
  - [x] Incoming program section
  - [x] Footer section
