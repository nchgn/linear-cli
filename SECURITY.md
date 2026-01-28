# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Considerations

### API Key Storage

The CLI stores your Linear API key locally in `~/.linear-cli-agents/config.json` with:

- File permissions set to `600` (owner read/write only)
- Atomic writes to prevent corruption

Alternatively, use the `LINEAR_API_KEY` environment variable to avoid storing credentials on disk.

### Best Practices

1. **Never commit your API key** to version control
2. **Use environment variables** in CI/CD pipelines
3. **Rotate your API key** if you suspect it has been compromised
4. **Review permissions** granted to your Linear API key

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. **Email** the maintainer directly or use GitHub's private vulnerability reporting
3. **Include** a detailed description of the vulnerability
4. **Provide** steps to reproduce if possible

### What to expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Fix timeline depends on severity

### Scope

The following are in scope:

- API key exposure vulnerabilities
- Command injection
- Path traversal
- Insecure file permissions
- Dependency vulnerabilities

The following are out of scope:

- Issues in the Linear API itself (report to Linear)
- Social engineering attacks
- Physical access attacks

## Security Updates

Security updates will be released as patch versions. Subscribe to releases to stay notified.
