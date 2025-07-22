# Contributing to Nova Editor

Thank you for your interest in contributing to Nova Editor! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0
- Git
- Basic knowledge of TypeScript, React, and ECS architecture

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/nova-editor.git
   cd nova-editor
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 📋 Development Guidelines

### Code Style

We use ESLint and Prettier to maintain consistent code style:

```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format
```

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Export types when they might be used externally
- Follow the existing naming conventions

### React Guidelines

- Use functional components with hooks
- Prefer composition over inheritance
- Use TypeScript for prop types
- Follow the existing component structure
- Use React.memo for performance optimization when needed

### ECS Integration Guidelines

- Extend EditorWorld for editor-specific functionality
- Use the event system for communication between UI and ECS
- Follow NovaECS patterns and conventions
- Maintain separation between editor logic and game logic

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   └── panels/         # Editor panel components
├── ecs/                # NovaECS integration
├── hooks/              # Custom React hooks
├── stores/             # State management
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── test/               # Test utilities
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Writing Tests

- Write tests for new features and bug fixes
- Use React Testing Library for component tests
- Mock external dependencies appropriately
- Aim for good test coverage (80%+)

### Test Structure

```typescript
// Example test structure
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    // Test implementation
  });
});
```

## 📝 Commit Guidelines

We follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(hierarchy): add entity search functionality
fix(inspector): resolve property update issue
docs(readme): update installation instructions
```

## 🔄 Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding guidelines
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Requirements**
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - Tests passing
   - Code review approval

## 🐛 Bug Reports

When reporting bugs, please include:

- **Environment**: OS, Node.js version, browser
- **Steps to Reproduce**: Clear step-by-step instructions
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Console Errors**: Any error messages

## 💡 Feature Requests

For feature requests, please provide:

- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other solutions considered
- **Additional Context**: Any other relevant information

## 📚 Documentation

### Code Documentation

- Use TSDoc comments for public APIs
- Include examples in documentation
- Document complex algorithms or business logic
- Keep comments up to date with code changes

### Example TSDoc

```typescript
/**
 * Selects an entity in the editor
 * 在编辑器中选择实体
 * 
 * @param entityId - The ID of the entity to select
 * @param addToSelection - Whether to add to existing selection
 * @returns Promise that resolves when selection is complete
 * 
 * @example
 * ```typescript
 * await editorWorld.selectEntity('player-1', false);
 * ```
 */
async selectEntity(entityId: string, addToSelection = false): Promise<void> {
  // Implementation
}
```

## 🎯 Areas for Contribution

### High Priority

- **Gizmo System**: 3D transform manipulation handles
- **Asset Browser**: File management and import system
- **Undo/Redo System**: Command pattern implementation
- **Performance Optimization**: Rendering and state management

### Medium Priority

- **Plugin System**: Extensible architecture
- **Animation Editor**: Timeline-based animation
- **Material Editor**: Visual shader editing
- **Documentation**: User guides and tutorials

### Good First Issues

Look for issues labeled `good first issue` or `help wanted` in the GitHub repository.

## 🤝 Community

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat (link in main README)

### Code of Conduct

Please be respectful and inclusive in all interactions. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

## 📄 License

By contributing to Nova Editor, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- Special thanks in documentation

Thank you for contributing to Nova Editor! 🚀
