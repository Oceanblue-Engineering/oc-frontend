# Frontend AI Coding Ruleset

Welcome to the OceanBlue CMS Dashboard codebase. This document outlines the key standards and guides for writing high-quality, consistent code across the application.

## Tech Stack Overview
- **Core Library**: React (Vite-based SPA)
- **Programming Language**: TypeScript (Strict Typing)
- **Styling**: Tailwind CSS & Custom CSS variables
- **State & Context**: Context API & Custom Hooks
- **Icons**: Lucide React
- **Notifications**: Sonner

## High-Level Directory Structure
```
OceanBlue-CMS-Dashboard/
├── components/          # Reusable UI components
│   ├── Common/          # Shared modal, loaders, tables
│   ├── Settings/        # Shop settings cards, uploads
│   └── Print/           # Printing helpers & size selectors
├── context/             # Global contexts (Language, App context)
├── pages/               # Main route views (POS, Settings, DailyReports)
├── services/            # API endpoints & network requests
├── translations/        # Translation mappings (en.ts, my.ts)
└── utils/               # Formatting, calculations & utilities
```

## Modular Guidelines Reference
Please refer to the following sub-rulesets in the `.agent/rules` folder:

1. [Code Style & Conventions](.agent/rules/code-style.md)
   - Component naming conventions, TypeScript guidelines, and props best practices.
2. [Design System & UI Tokens](.agent/rules/design-system.md)
   - Colors, typography, custom pill buttons, and reusable UI standards.
3. [Error Handling & API Rules](.agent/rules/error-handling.md)
   - Async/Await standards, loading overlays, and user-facing notifications.

## Workflow
Antigravity implements approved plans and writes a report for each one. See the monorepo workflow rules: [`../.agent/rules/oceanblue-workflow.md`](../.agent/rules/oceanblue-workflow.md).
