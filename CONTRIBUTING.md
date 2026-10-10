# Contributing to Homepage

## Getting Started

1. **Clone the repository**
   ```bash
   git clone git@github.com:StepanKomis/Homepage.git
   cd Homepage
   ```

2. **Check out `dev` branch**
   ```bash
   git checkout dev
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

## Branching Strategy

- `main` — Production-ready releases (tagged)
- `dev` — Integration branch for working features
- `feature/*` — Individual feature development
- `feature/*/sub-*` — Sub-features or subtasks
- `bugfix/*` — Bug fixes
- `docs/*` — Documentation updates
- `chore/*` — Maintenance, dependencies, tooling

Example:
```bash
git checkout -b feature/jellyfin-integration
git checkout -b feature/jellyfin-integration/sub-library-sync
```

## Commit Guidelines

Use conventional commit format:

```
type(scope): message

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**Examples**:
```
feat(backend): add uptime kuma integration
fix(frontend): resolve darkmode toggle crash
docs(readme): update setup instructions
chore(deps): bump react to 18.3.1
```

## Code Style

- **Frontend**: ESLint + Prettier (enforced on commit)
- **Backend**: `gofmt` + `golangci-lint`
- No em-dashes (`—`) in code or PRs
- Commits signed by committer (GPG or trusted identity)

## Testing

- Frontend: `npm run test:frontend`
- Backend: `npm run test:backend`
- All tests must pass before merge

## PR Process

1. Push your branch: `git push origin feature/my-feature`
2. Open PR against `dev`
3. Fill out PR template completely
4. Wait for CI to pass
5. Request review
6. Squash & merge to `dev` after approval

## Release Process

When ready to release (from `dev`):

```bash
git checkout main
git merge --ff-only dev
git tag -a vX.Y.Z -m "Release X.Y.Z"
git push origin main --tags
```

## Questions?

Reach out to the maintainers or open a discussion.
