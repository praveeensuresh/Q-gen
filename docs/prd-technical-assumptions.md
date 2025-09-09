# AI Question Generator - Technical Assumptions

## Repository Structure: Monorepo
Given the need for rapid development and the single-purpose nature of this application, a monorepo structure will provide better development speed and easier deployment coordination.

## Service Architecture
**Monolith with AI Integration** - A single application that handles file upload, processing, AI integration, and template generation. This architecture supports rapid development while maintaining the ability to scale individual components later if needed.

## Testing Requirements
**Unit + Integration Testing** - Unit tests for core business logic (file processing, template generation) and integration tests for AI API calls and file export functionality. This provides confidence in the core functionality without the overhead of full E2E testing for the MVP.

## Additional Technical Assumptions and Requests

### Frontend Technology Stack
- **Frontend Framework:** React (as specified in the brief)
- **UI Library:** Material UI for consistent, professional components
- **Build Tool:** Vite or Create React App for modern development experience
- **State Management:** React Context or Redux for application state
- **Routing:** React Router for navigation between pages

### Backend Technology Stack
- **Runtime:** Node.js for server-side processing
- **Framework:** Express.js for API endpoints
- **File Processing:** pdf-parse library for PDF text extraction
- **Template Engine:** Markdown processor with placeholder substitution
- **Export Libraries:** Libraries for generating Word (DOCX) and PDF documents

### AI Integration
- **AI Service:** OpenAI/ChatGPT API for question generation
- **API Management:** Proper API key management and rate limiting
- **Prompt Engineering:** Structured prompts for consistent question generation
- **Error Handling:** Graceful handling of API failures and timeouts

### Data Storage
- **File Storage:** Temporary local storage with automatic cleanup
- **Database:** Simple file-based storage or lightweight database (SQLite) for application data
- **Session Management:** In-memory or Redis for processing state
- **Cache:** Optional caching for frequently accessed templates

### Security Considerations
- **File Validation:** Basic file validation and sanitization for uploaded PDFs
- **API Security:** Secure API key storage and transmission
- **Input Sanitization:** Proper sanitization of extracted text content
- **CORS:** Appropriate CORS settings for web application

### Deployment and Infrastructure
- **Deployment:** Single application deployment (no microservices complexity)
- **Environment:** Development, staging, and production environments
- **Monitoring:** Basic application monitoring and logging
- **Scaling:** Vertical scaling approach for initial deployment

### Development Tools and Practices
- **Version Control:** Git with feature branch workflow
- **Code Quality:** ESLint and Prettier for code formatting
- **Testing:** Jest for unit tests, React Testing Library for component tests
- **Documentation:** Inline code documentation and README files

### Performance Considerations
- **File Size Limits:** 10MB maximum file size for PDF uploads
- **Processing Time:** Target 30 seconds for complete question generation
- **Memory Management:** Efficient memory usage during file processing
- **Concurrent Users:** Support for multiple simultaneous users

### Integration Points
- **PDF Processing:** Reliable PDF parsing with error handling
- **AI API:** OpenAI integration with proper error handling and retries
- **Export Generation:** Word and PDF export with consistent formatting
- **Template System:** Flexible template engine for question formatting

### Future Scalability Considerations
- **Microservices Migration:** Architecture should allow for future service separation
- **Database Migration:** Data storage should support future database upgrades
- **API Versioning:** API design should support future versioning
- **Caching Strategy:** Architecture should support future caching implementation
