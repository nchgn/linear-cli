# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- ESLint configuration with TypeScript support
- Prettier configuration using @oclif/prettier-config
- Vitest configuration with coverage reporting
- CI/CD workflows for GitHub Actions
- Automated npm publishing on version tags
- CONTRIBUTING.md documentation
- SECURITY.md security policy

### Changed

- Updated package.json with proper repository and bugs fields

## [0.1.1] - 2025-01-28

### Fixed

- Initial npm package configuration

## [0.1.0] - 2025-01-28

### Added

- Initial release
- Authentication commands (login, logout, status)
- Issue commands (list, get, create, update, delete)
- Schema introspection for LLM discovery
- Raw GraphQL query support
- JSON output format for all commands
- Environment variable support for API key

[Unreleased]: https://github.com/nchgn/linear-cli/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/nchgn/linear-cli/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/nchgn/linear-cli/releases/tag/v0.1.0
