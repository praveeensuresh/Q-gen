# AI Question Generator - Architecture Overview

## Introduction

This document outlines the complete fullstack architecture for **AI Question Generator**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

**N/A - Greenfield project** - The PRD specifies React frontend and mentions no existing codebase or starter templates. This is a clean slate implementation.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| [Current Date] | 1.0 | Initial architecture creation | Winston (Architect) |

## High Level Architecture

### Technical Summary

The AI Question Generator employs a **modern React application with serverless backend functions** deployed on Vercel, featuring a React frontend for optimal performance and user experience. The system integrates OpenAI's API for intelligent question generation and uses a lightweight SQLite database for session management. The architecture prioritizes rapid development through a monorepo structure while maintaining scalability through edge computing and CDN distribution.

### Platform and Infrastructure Choice

**Platform:** Vercel + Supabase  
**Key Services:** Vercel Edge Functions, Supabase Database, Vercel Blob Storage, OpenAI API  
**Deployment Host and Regions:** Vercel Global Edge Network (US, EU, Asia)

### Repository Structure

**Structure:** Monorepo with Turborepo  
**Monorepo Tool:** Turborepo  
**Package Organization:** Apps (web, api) + Packages (shared, ui, config)

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "User Layer"
        U[Teacher User]
    end
    
    subgraph "Frontend - Vercel Edge"
        WEB[React App]
        CDN[Vercel CDN]
    end
    
    subgraph "API Layer - Vercel Functions"
        API[API Routes/Edge Functions]
        AUTH[Authentication]
        UPLOAD[File Upload Handler]
    end
    
    subgraph "Processing Layer"
        PDF[PDF Parser]
        AI[OpenAI API]
        TEMPLATE[Template Engine]
    end
    
    subgraph "Storage Layer"
        DB[(Supabase PostgreSQL)]
        BLOB[Vercel Blob Storage]
        CACHE[Vercel Edge Cache]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI GPT-4]
    end
    
    U --> WEB
    WEB --> CDN
    CDN --> API
    API --> AUTH
    API --> UPLOAD
    UPLOAD --> PDF
    PDF --> AI
    AI --> OPENAI
    AI --> TEMPLATE
    TEMPLATE --> BLOB
    API --> DB
    API --> CACHE
    BLOB --> WEB
```

### Architectural Patterns

- **Jamstack Architecture:** Static site generation with serverless APIs - _Rationale:_ Optimal performance and scalability for content-heavy applications with fast global delivery
- **Component-Based UI:** Reusable React components with TypeScript - _Rationale:_ Maintainability and type safety across large codebases, essential for rapid development
- **Repository Pattern:** Abstract data access logic - _Rationale:_ Enables testing and future database migration flexibility while keeping business logic clean
- **API Gateway Pattern:** Single entry point for all API calls - _Rationale:_ Centralized auth, rate limiting, and monitoring through Vercel's built-in capabilities
- **Event-Driven Processing:** Async file processing with status updates - _Rationale:_ Handles AI processing delays gracefully while providing user feedback
- **Template Engine Pattern:** Pluggable template system with Markdown support - _Rationale:_ Enables Super Admin customization and maintains separation of concerns

## Core Workflows

### Primary User Workflow: PDF Upload to Question Export

```mermaid
sequenceDiagram
    participant T as Teacher
    participant FE as Frontend
    participant API as API Layer
    participant PDF as PDF Service
    participant AI as AI Service
    participant DB as Database
    participant TEMP as Template Engine
    participant EXP as Export Service
    participant BLOB as Blob Storage

    T->>FE: Upload PDF file
    FE->>API: POST /documents (multipart)
    API->>BLOB: Store PDF file
    API->>DB: Create document record
    API->>PDF: Start text extraction
    PDF->>PDF: Extract text from PDF
    PDF->>DB: Update document with extracted text
    PDF->>FE: WebSocket: Processing complete
    
    T->>FE: Configure question generation
    FE->>API: POST /question-sets
    API->>AI: Generate questions with OpenAI
    AI->>AI: Process text with prompts
    AI->>DB: Store generated questions
    AI->>FE: WebSocket: Generation complete
    
    T->>FE: Preview and edit questions
    FE->>API: GET /question-sets/{id}
    API->>DB: Fetch questions
    API->>FE: Return question data
    
    T->>FE: Export questions (PDF/DOCX)
    FE->>API: POST /question-sets/{id}/export
    API->>TEMP: Process template with questions
    TEMP->>EXP: Generate formatted document
    EXP->>BLOB: Store export file
    EXP->>FE: Return download URL
    FE->>T: Download file
```

## Unified Project Structure

### Monorepo Structure

```
ai-question-generator/
├── .github/                    # CI/CD workflows
├── apps/                       # Application packages
│   └── web/                    # Frontend application (React)
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types/utilities
│   ├── ui/                     # Shared UI components
│   └── config/                 # Shared configuration
├── infrastructure/             # IaC definitions
├── scripts/                    # Build/deploy scripts
├── docs/                       # Documentation
├── .env.example                # Environment template
├── package.json                # Root package.json
├── turbo.json                  # Turborepo configuration
└── README.md
```

### Environment Configuration

```bash
# Required Environment Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=application/pdf
DEFAULT_QUESTION_COUNT=10
MAX_QUESTION_COUNT=50
```

## Conclusion

This architecture provides a solid foundation for the AI Question Generator POC, focusing on rapid development while maintaining quality and scalability. The unified approach ensures consistency across the entire technology stack and provides clear guidance for AI-driven development.

The architecture is ready for implementation and can be extended as the application grows beyond the POC phase.
