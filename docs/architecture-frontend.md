# AI Question Generator - Frontend Architecture

## Frontend Architecture Overview

The frontend is built as a React 18 application with TypeScript, Material-UI components, and Zustand for state management. The architecture follows a component-based approach with clear separation of concerns and optimal performance through code splitting and lazy loading.

## Component Organization

```
apps/web/src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Dialog/
│   │   └── Loading/
│   ├── features/              # Feature-specific components
│   │   ├── upload/
│   │   │   ├── FileUpload.tsx
│   │   │   ├── UploadProgress.tsx
│   │   │   └── UploadValidation.tsx
│   │   ├── processing/
│   │   │   ├── ProcessingStatus.tsx
│   │   │   ├── TextPreview.tsx
│   │   │   └── ProcessingError.tsx
│   │   ├── questions/
│   │   │   ├── QuestionList.tsx
│   │   │   ├── QuestionEditor.tsx
│   │   │   ├── QuestionPreview.tsx
│   │   │   └── QuestionFilters.tsx
│   │   └── export/
│   │       ├── ExportOptions.tsx
│   │       ├── ExportProgress.tsx
│   │       └── DownloadButton.tsx
│   └── layout/                # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── Footer.tsx
│       └── MainLayout.tsx
├── pages/                     # React pages
│   ├── index.tsx             # Upload page
│   ├── processing/[id].tsx   # Processing status
│   ├── questions/[id].tsx    # Question preview
│   ├── export/[id].tsx       # Export page
│   └── auth/
│       ├── login.tsx
│       └── register.tsx
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts
│   ├── useFileUpload.ts
│   ├── useQuestionGeneration.ts
│   └── useExport.ts
├── services/                  # API client services
│   ├── api.ts
│   ├── authService.ts
│   ├── documentService.ts
│   ├── questionService.ts
│   └── exportService.ts
├── stores/                    # Zustand state management
│   ├── authStore.ts
│   ├── uploadStore.ts
│   ├── questionStore.ts
│   └── exportStore.ts
├── types/                     # TypeScript type definitions
│   ├── api.ts
│   ├── auth.ts
│   ├── document.ts
│   ├── question.ts
│   └── export.ts
└── utils/                     # Utility functions
    ├── validation.ts
    ├── formatting.ts
    ├── constants.ts
    └── helpers.ts
```

## State Management

### Zustand Stores

**AuthStore:**
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

**UploadStore:**
```typescript
interface UploadState {
  currentFile: File | null;
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  error: string | null;
  uploadFile: (file: File) => Promise<void>;
  resetUpload: () => void;
}
```

**QuestionStore:**
```typescript
interface QuestionState {
  currentQuestionSet: QuestionSet | null;
  questions: Question[];
  generationStatus: 'idle' | 'generating' | 'completed' | 'error';
  selectedQuestions: string[];
  generateQuestions: (documentId: string, config: GenerationConfig) => Promise<void>;
  updateQuestion: (questionId: string, updates: Partial<Question>) => void;
  deleteQuestion: (questionId: string) => void;
  reorderQuestions: (questionIds: string[]) => void;
}
```

**ExportStore:**
```typescript
interface ExportState {
  exportFormat: 'pdf' | 'docx';
  exportStatus: 'idle' | 'generating' | 'completed' | 'error';
  downloadUrl: string | null;
  exportQuestions: (questionSetId: string, format: string) => Promise<void>;
  resetExport: () => void;
}
```

## Routing Architecture

### React Router Structure

```
/                           # Landing/Upload page
├── processing/[id]         # Document processing status
├── questions/[id]          # Question preview and editing
├── export/[id]             # Export options and download
└── auth/
    ├── login               # Teacher login
    └── register            # Teacher registration
```

### Route Protection

```typescript
// ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

## Component Architecture

### Core Components

**FileUpload Component:**
```typescript
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUploadStart: () => void;
  onUploadComplete: (document: Document) => void;
  onUploadError: (error: string) => void;
  maxFileSize: number;
  acceptedTypes: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  maxFileSize,
  acceptedTypes,
}) => {
  // Drag and drop implementation
  // File validation
  // Upload progress tracking
  // Error handling
};
```

**QuestionEditor Component:**
```typescript
interface QuestionEditorProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: (questionId: string) => void;
  onMoveUp: (questionId: string) => void;
  onMoveDown: (questionId: string) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  // Inline editing functionality
  // Question type switching
  // Answer option management
  // Validation and error handling
};
```

### Custom Hooks

**useFileUpload Hook:**
```typescript
const useFileUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    currentFile: null,
    uploadProgress: 0,
    uploadStatus: 'idle',
    error: null,
  });

  const uploadFile = async (file: File) => {
    // File validation
    // Upload progress tracking
    // Error handling
    // State updates
  };

  return {
    ...uploadState,
    uploadFile,
    resetUpload: () => setUploadState(initialState),
  };
};
```

**useQuestionGeneration Hook:**
```typescript
const useQuestionGeneration = () => {
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    error: null,
  });

  const generateQuestions = async (documentId: string, config: GenerationConfig) => {
    // AI API integration
    // Progress tracking
    // Error handling
    // State updates
  };

  return {
    ...generationState,
    generateQuestions,
  };
};
```

## Performance Optimization

### Code Splitting and Lazy Loading

```typescript
// Lazy load heavy components
const QuestionEditor = lazy(() => import('../features/questions/QuestionEditor'));
const ExportOptions = lazy(() => import('../features/export/ExportOptions'));

// Route-based code splitting
const ProcessingPage = lazy(() => import('../pages/processing/[id]'));
const QuestionsPage = lazy(() => import('../pages/questions/[id]'));
```

### Bundle Size Optimization

- **Target:** < 500KB initial bundle, < 1MB total with lazy loading
- **Strategy:** Code splitting by route, lazy loading for heavy components
- **Tools:** Vite built-in optimization, Bundle Analyzer

### Caching Strategy

```typescript
// React Query for API data caching
const { data: documents, isLoading } = useQuery({
  queryKey: ['documents'],
  queryFn: documentService.getDocuments,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Service Worker for static assets
// Vercel Edge Cache for CDN content
```

## Material-UI Integration

### Theme Configuration

```typescript
// theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});
```

### Component Library

**Custom Button Component:**
```typescript
interface CustomButtonProps extends ButtonProps {
  loading?: boolean;
  icon?: React.ReactNode;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  loading = false,
  icon,
  children,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      startIcon={loading ? <CircularProgress size={20} /> : icon}
    >
      {children}
    </Button>
  );
};
```

## Error Handling and User Experience

### Error Boundaries

```typescript
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### Loading States

```typescript
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);
```

### Toast Notifications

```typescript
const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  return { toasts, showToast };
};
```
