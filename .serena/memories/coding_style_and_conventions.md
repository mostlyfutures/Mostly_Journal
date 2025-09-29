# Coding Style and Conventions for MostlyJournal

## TypeScript Standards
- **Strict TypeScript**: Use strict mode with proper type annotations
- **Interface Definitions**: Define clear interfaces for all data structures (Note, Folder, etc.)
- **Type Safety**: Prefer explicit types over `any`, use union types where appropriate
- **Import Aliases**: Use `@/*` alias for clean imports from src directory

## Naming Conventions
- **Files**: kebab-case for component files (e.g., `note-editor.tsx`), camelCase for utilities
- **Components**: PascalCase (e.g., `NoteEditor`, `AuthButton`)
- **Functions/Variables**: camelCase (e.g., `handleSaveNote`, `selectedFolder`)
- **Constants**: UPPER_SNAKE_CASE for environment variables and constants
- **Interfaces**: PascalCase with descriptive names (e.g., `UserStore`, `NoteData`)

## Component Structure
- **Functional Components**: Use React functional components with hooks
- **Props Interface**: Define props interface for each component
- **Client Components**: Use 'use client' directive for interactive components
- **Default Exports**: Use default exports for components, named exports for utilities

## Code Organization
- **MVC Pattern**: 
  - Models in `/lib` (types, store, data access)
  - Views in `/components` (React components)
  - Controllers in `/hooks` and `/services`
- **Separation of Concerns**: Keep authentication, data access, and UI logic separate
- **Single Responsibility**: Each component/function should have one clear purpose

## Error Handling
- **Async/Await**: Use async/await with proper try/catch blocks
- **Type-Safe Errors**: Handle errors with proper TypeScript typing
- **User Feedback**: Provide meaningful error messages to users
- **Graceful Degradation**: Handle network/blockchain failures gracefully

## State Management
- **Zustand**: Use Zustand for global state (user address, app state)
- **React Query**: Use for server state and caching
- **Local State**: Use useState for component-specific state
- **Immutable Updates**: Follow immutable update patterns

## Best Practices
- **Environment Variables**: Use NEXT_PUBLIC_ prefix for client-side env vars
- **Security**: Never expose private keys or sensitive data
- **Performance**: Use React.memo and useMemo where appropriate
- **Accessibility**: Include proper ARIA labels and semantic HTML