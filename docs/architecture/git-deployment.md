# VCT Manager Game - Git & Deployment Strategy

## Git & Deployment Strategy

### Version Control Setup
```bash
# Initialize Git
git init
git add .
git commit -m "Initial commit: Project setup"

# Create branches
git branch develop
git checkout develop
```

### Branch Strategy
- **main**: Production-ready code (auto-deploys to GitHub Pages)
- **develop**: Integration branch for features
- **feature/**: Feature branches (e.g., feature/roster-management)

### Commit Convention
Use Conventional Commits format:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructure
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance

### GitHub Pages Deployment

**Vite Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: '/vct-manager/', // Replace with your repo name
})
```

**Auto-Deploy with GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm test
    - run: npm run build
    - uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

**Deployment URL:** `https://yourusername.github.io/vct-manager/`
