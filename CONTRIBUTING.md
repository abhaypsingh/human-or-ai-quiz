# Contributing to Human or AI Quiz

Thank you for your interest in contributing to the Human or AI Quiz project! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Database Changes](#database-changes)

## Code of Conduct

This project adheres to a code of conduct that promotes a welcoming and inclusive environment. By participating, you agree to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn package manager
- Git for version control
- A Supabase account for database and authentication

### Development Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/human-or-ai-quiz.git
   cd human-or-ai-quiz
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Set Up Database**
   ```bash
   # Run the schema setup
   psql YOUR_DATABASE_URL -f db/schema.sql
   psql YOUR_DATABASE_URL -f db/categories_seed.sql
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **Bug fixes** - Fixing issues in existing functionality
- **Feature additions** - Adding new features or improving existing ones
- **Documentation** - Improving or adding documentation
- **Testing** - Adding or improving tests
- **Performance** - Optimizing code performance
- **Accessibility** - Improving accessibility features
- **Content** - Adding new passages or improving existing content

### Before You Start

1. **Check Existing Issues** - Look for existing issues or feature requests
2. **Create an Issue** - For significant changes, create an issue first to discuss
3. **Assign Yourself** - Comment on the issue to avoid duplicate work
4. **Follow Conventions** - Follow the established patterns and conventions

## Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Make Your Changes

- Write clean, readable code
- Add tests for new functionality
- Update documentation as needed
- Ensure your code follows the style guide

### 3. Test Your Changes

```bash
# Run the test suite
npm run test

# Run type checking
npm run type-check

# Run linting
npm run lint

# Test the build
npm run build
```

### 4. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "feat: add keyboard shortcuts to game interface"
git commit -m "fix: resolve accuracy calculation bug"
git commit -m "docs: update API documentation"
```

### 5. Submit Pull Request

- Push your branch to GitHub
- Create a pull request with a clear title and description
- Reference any related issues
- Ensure all checks pass

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior**
- **Actual behavior**
- **Environment details** (OS, browser, device)
- **Screenshots** if applicable

### Feature Requests

For feature requests, include:

- **Clear description** of the feature
- **Use case** and why it's valuable
- **Mockups or examples** if applicable
- **Implementation suggestions** if you have ideas

## Development Workflow

### Project Structure

```
src/
  ├── components/       # React components
  │   ├── common/      # Shared components
  │   ├── Game/        # Game-specific components
  │   └── Layout/      # Layout components
  ├── pages/           # Page components
  ├── hooks/           # Custom React hooks
  ├── types/           # TypeScript type definitions
  ├── api.ts          # API functions
  ├── auth.ts         # Authentication logic
  └── theme.ts        # Theme utilities
netlify/functions/    # Serverless functions
db/                   # Database schemas and seeds
```

### Key Technologies

- **Frontend**: React, TypeScript, Vite
- **Styling**: CSS Modules, CSS Variables
- **Backend**: Netlify Functions, Supabase
- **Testing**: Vitest, Playwright
- **Deployment**: Netlify

## Testing

### Unit Tests

Write unit tests for:
- Component logic
- Utility functions
- API functions
- Custom hooks

```bash
npm run test
npm run test:watch  # Watch mode
npm run test:coverage  # With coverage
```

### Integration Tests

Test API endpoints and database interactions:

```bash
npm run test:integration
```

### End-to-End Tests

Test complete user workflows:

```bash
npm run test:e2e
```

## Code Style

### TypeScript

- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` types when possible
- Use meaningful variable and function names

### React

- Use functional components with hooks
- Follow the component file structure:
  ```typescript
  // 1. Imports
  // 2. Types/interfaces
  // 3. Component definition
  // 4. Export
  ```

### CSS

- Use CSS Modules for component styling
- Follow BEM naming convention when applicable
- Use CSS variables for theming
- Write mobile-first responsive styles

### Commit Messages

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Database Changes

### Schema Changes

1. **Update schema.sql** - Make changes to the main schema file
2. **Create migration** - Document the migration steps
3. **Test locally** - Ensure the changes work correctly
4. **Update seed data** - If necessary, update seed files

### Adding Content

When adding new passages or categories:

1. **Follow content guidelines** - Ensure quality and appropriateness
2. **Balanced representation** - Include both human and AI content
3. **Proper attribution** - Credit sources appropriately
4. **Test thoroughly** - Ensure the content works in the game

## Getting Help

If you need help with contributing:

- **GitHub Discussions** - Ask questions or discuss ideas
- **Issues** - Report bugs or request features
- **Discord** - Join our community chat (if available)
- **Email** - Contact maintainers for sensitive issues

## Recognition

Contributors are recognized in several ways:

- **Contributors list** - All contributors are listed in the README
- **Release notes** - Significant contributions are highlighted
- **GitHub profile** - Contributions show on your GitHub profile

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Human or AI Quiz! Your efforts help make this project better for everyone.