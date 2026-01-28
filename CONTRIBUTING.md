# Contributing to linear-cli-agents

Thank you for your interest in contributing to linear-cli-agents! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm (install with `corepack enable`)

### Getting Started

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/linear-cli-agents.git
   cd linear-cli-agents
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the project:

   ```bash
   pnpm build
   ```

4. Run in development mode:

   ```bash
   ./bin/dev.js auth status
   ```

## Development Workflow

### Code Style

We use ESLint and Prettier for code formatting. Run before committing:

```bash
pnpm lint        # Check for lint errors
pnpm lint:fix    # Auto-fix lint errors
pnpm format      # Format all files
```

### Testing

```bash
pnpm test           # Run tests
pnpm test:watch     # Run tests in watch mode
pnpm test:coverage  # Run tests with coverage
```

### Building

```bash
pnpm build    # Build the project
```

## Project Structure

```
linear-cli-agents/
├── src/
│   ├── commands/      # CLI commands (oclif structure)
│   │   ├── auth/      # Authentication commands
│   │   ├── issues/    # Issue management commands
│   │   ├── query.ts   # Raw GraphQL queries
│   │   └── schema.ts  # Schema introspection
│   ├── lib/           # Shared utilities
│   │   ├── client.ts  # Linear API client
│   │   ├── config.ts  # Configuration management
│   │   ├── errors.ts  # Error handling
│   │   ├── output.ts  # JSON output formatting
│   │   └── types.ts   # TypeScript types
│   └── index.ts       # Entry point
├── bin/               # CLI entry scripts
├── dist/              # Compiled output
└── tests/             # Test files
```

## Adding a New Command

1. Create a new file in `src/commands/`:

   ```typescript
   import {Command, Flags} from '@oclif/core'
   import {getClient} from '../lib/client.js'
   import {success, print} from '../lib/output.js'
   import {handleError} from '../lib/errors.js'

   export default class MyCommand extends Command {
     static override description = 'Description of what this command does'

     static override examples = ['<%= config.bin %> my-command --flag value']

     static override flags = {
       myFlag: Flags.string({description: 'Flag description'}),
     }

     public async run(): Promise<void> {
       const {flags} = await this.parse(MyCommand)

       try {
         const client = getClient()
         // ... your logic here
         print(success({result: 'data'}))
       } catch (err) {
         handleError(err)
         this.exit(1)
       }
     }
   }
   ```

2. Rebuild and test:

   ```bash
   pnpm build
   ./bin/dev.js my-command --help
   ```

## Guidelines

### Output Format

All commands must return structured JSON using the output utilities:

```typescript
// Success
print(success({key: 'value'}))

// Success with list and pagination
print(successList(items, {hasNextPage: true, endCursor: 'abc'}))

// Errors (via handleError or CliError)
throw new CliError(ErrorCodes.NOT_FOUND, 'Resource not found')
```

### Error Handling

- Use `CliError` for expected errors with specific error codes
- Use `handleError()` to wrap unknown errors
- Always exit with code 1 on errors

### TypeScript

- Strict mode is enabled
- No `any` types allowed
- All parameters must be typed

## Pull Request Process

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. Make your changes and ensure all checks pass:

   ```bash
   pnpm build
   pnpm lint
   pnpm test
   ```

3. Commit with a descriptive message:

   ```bash
   git commit -m "feat: add new feature description"
   ```

4. Push and create a Pull Request

5. Wait for CI checks to pass and request review

## Releasing

Releases are automated via GitHub Actions when tags are pushed:

```bash
# Bump version in package.json
pnpm version patch  # or minor, major

# Push the tag
git push origin --tags
```

The release workflow will:

1. Run all CI checks
2. Publish to npm with provenance
3. Create a GitHub Release

## Questions?

Open an issue for any questions or discussions.
