# raincheck

A SaaS Application (T3 Stack) project built with Session-Driven Development.

## Tech Stack

- **Frontend**: Next.js 16.0.1 + React 19.2.0
- **Language**: TypeScript 5.9.3
- **Api**: tRPC 11.7.1
- **Database**: PostgreSQL with Prisma 6.19.0
- **Styling**: Tailwind CSS 4.1.17

## Quality Gates: Standard

- ✓ Linting (ESLint/Ruff)
- ✓ Formatting (Prettier/Ruff)
- ✓ Type checking (TypeScript strict/Pyright)
- ✓ Basic unit tests (Jest/pytest)
- ✓ 80% test coverage minimum
- ✓ Pre-commit hooks (Husky + lint-staged)
- ✓ Secret scanning (git-secrets, detect-secrets)
- ✓ Dependency vulnerability scanning
- ✓ Basic SAST (ESLint security/bandit)
- ✓ License compliance checking

**Test Coverage Target**: 80%

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000

### Environment Setup

```bash
# Copy environment template
cp .env.local.example .env.local
# Edit .env.local with your database connection and other settings
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## Additional Features

- ✓ **GitHub Actions CI/CD**: Automated testing and deployment workflows
- ✓ **Environment Templates**: .env files and .editorconfig for all editors

## Documentation

See `ARCHITECTURE.md` for detailed technical documentation including:

- Architecture decisions and trade-offs
- Project structure reference
- Code patterns and examples
- Database workflow
- Troubleshooting guides

## Session-Driven Development

This project uses Session-Driven Development (Solokit) for organized, AI-augmented development.

### Commands

- `/sk:work-new` - Create a new work item
- `/sk:work-list` - List all work items
- `/sk:start` - Start working on a work item
- `/sk:status` - Check current session status
- `/sk:validate` - Validate quality gates
- `/sk:end` - Complete current session
- `/sk:learn` - Capture a learning

### Documentation

See `.session/` directory for:

- Work item specifications (`.session/specs/`)
- Session briefings (`.session/briefings/`)
- Session summaries (`.session/history/`)
- Captured learnings (`.session/tracking/learnings.json`)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
