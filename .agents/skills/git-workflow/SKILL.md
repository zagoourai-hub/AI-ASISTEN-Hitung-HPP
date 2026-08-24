---
name: git-workflow
description: Git workflow, conventional commit, branching strategy, PR template, dan changelog. Gunakan saat diminta commit, buat branch, review PR, generate changelog, setup git hooks, atau apapun yang berhubungan dengan git workflow.
allowed-tools: Read Write Bash(git *) Bash(npx *) Bash(cat *) Bash(find *)
disable-model-invocation: true
argument-hint: "commit | branch | pr | changelog | setup | status"
---

# Git Workflow Skill

## Mode

| Argumen | Keterangan |
|---------|-----------|
| `commit` | Stage + buat conventional commit message |
| `branch` | Buat branch dengan naming convention yang benar |
| `pr` | Generate PR description |
| `changelog` | Generate CHANGELOG dari commit history |
| `setup` | Setup git hooks, commitlint, husky |
| `status` | Review perubahan sebelum commit |

---

## Mode: `status` — Review Sebelum Commit

```bash
# Lihat perubahan
git status
git diff --stat
git diff HEAD
```

Analisis perubahan dan beri ringkasan:
- File apa yang berubah
- Apakah ada file yang tidak seharusnya di-commit (`.env`, `node_modules`, `dist`)
- Apakah ada `console.log` / `print()` yang tertinggal
- Apakah ada credential / API key yang ter-expose

---

## Mode: `commit` — Conventional Commit

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Kapan dipakai |
|------|--------------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `refactor` | Refactor kode (bukan feat/fix) |
| `style` | Format, whitespace, missing semicolon |
| `docs` | Perubahan dokumentasi |
| `test` | Tambah atau fix test |
| `chore` | Build process, dependency update |
| `perf` | Peningkatan performa |
| `ci` | CI/CD config |
| `revert` | Revert commit sebelumnya |
| `build` | Build system atau external dependency |

### Scopes (sesuaikan dengan project)

```
frontend    → perubahan di folder frontend/
backend     → perubahan di folder backend/
ai-service  → perubahan di folder ai-service/
docker      → perubahan Docker config
prisma      → perubahan schema/migration
auth        → fitur auth
ui          → komponen UI
api         → endpoint API
```

### Contoh Commit Messages

```bash
# Fitur baru
feat(frontend): add CV upload form with PDF validation
feat(backend): implement JWT authentication with httpOnly cookies
feat(ai-service): add Gemini provider with retry logic
feat(prisma): add Order and OrderItem models

# Bug fix
fix(frontend): resolve hydration error in date display component
fix(backend): handle null user in JWT strategy
fix(ai-service): fix provider fallback when Gemini rate limited

# Refactor
refactor(backend): extract password hashing to utility function
refactor(frontend): split UserCard into smaller components

# Chore
chore(deps): update Next.js to 16.2.7
chore(docker): optimize multi-stage build for backend
chore: add .env.example with all required variables

# Breaking change
feat(api)!: change auth endpoint from /auth to /api/v1/auth

BREAKING CHANGE: All auth endpoints now require /api/v1 prefix
```

### Script Commit

```bash
# Stage semua perubahan yang relevan
git add .

# Atau selective staging
git add frontend/src/components/CVUpload.tsx
git add backend/src/modules/cv/

# Commit
git commit -m "feat(frontend): add CV upload form with PDF validation"

# Commit dengan body
git commit -m "fix(backend): handle concurrent order creation

Add database transaction to prevent duplicate orders when
user submits form multiple times quickly.

Closes #42"
```

---

## Mode: `branch` — Branch Naming

### Naming Convention

```
<type>/<ticket-or-description>

feat/cv-upload
feat/user-authentication
fix/hydration-error-date
fix/jwt-null-user
refactor/split-user-card
chore/update-dependencies
hotfix/payment-calculation-bug
release/v1.0.0
```

### Branch Strategy (Git Flow Lite)

```
main          → production, selalu stable, tag versioned
develop       → staging / pre-production integration
feat/*        → fitur baru, branch dari develop
fix/*         → bug fix, branch dari develop
hotfix/*      → critical fix, branch dari main
release/*     → release candidate, branch dari develop
```

### Commands

```bash
# Buat branch baru dari develop
git checkout develop
git pull origin develop
git checkout -b feat/cv-upload

# Push branch ke remote
git push -u origin feat/cv-upload

# Hapus branch setelah merge
git branch -d feat/cv-upload
git push origin --delete feat/cv-upload

# Sync dengan develop (rebase lebih bersih dari merge)
git fetch origin
git rebase origin/develop
```

---

## Mode: `pr` — Pull Request Description

Generate PR description dalam format ini:

```markdown
## 📋 Deskripsi
[Apa yang dilakukan di PR ini]

## 🎯 Tipe Perubahan
- [ ] ✨ Fitur baru (feat)
- [ ] 🐛 Bug fix (fix)
- [ ] ♻️ Refactor
- [ ] 📚 Dokumentasi
- [ ] 🔧 Chore / Config

## 🔗 Terkait Issue
Closes #[nomor issue]

## 📸 Screenshot / Preview
[Tambahkan screenshot jika ada perubahan UI]

## ✅ Checklist
- [ ] Kode sudah di-review sendiri
- [ ] Tidak ada `console.log` yang tertinggal
- [ ] Tidak ada `any` TypeScript tanpa alasan
- [ ] Test sudah ditambahkan / diupdate
- [ ] `.env.example` sudah diupdate jika ada env baru
- [ ] Tidak ada breaking change (atau sudah didokumentasikan)

## 🧪 Cara Test
1. [Langkah 1]
2. [Langkah 2]
3. Expected: [hasil yang diharapkan]

## 📝 Notes untuk Reviewer
[Hal khusus yang perlu diperhatikan reviewer]
```

---

## Mode: `changelog` — Generate CHANGELOG

```bash
# Lihat semua commit sejak tag terakhir
git log $(git describe --tags --abbrev=0)..HEAD --oneline --pretty=format:"%h %s"

# Atau sejak tanggal tertentu
git log --since="2026-01-01" --oneline --pretty=format:"%h %s"

# Semua tag
git tag -l --sort=-v:refname | head -10
```

Format CHANGELOG yang dihasilkan:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### ✨ Features
- feat(frontend): add CV upload form with PDF validation (#45)
- feat(backend): implement JWT authentication with httpOnly cookies (#43)
- feat(ai-service): add Gemini provider with retry logic (#41)

### 🐛 Bug Fixes
- fix(frontend): resolve hydration error in date display (#47)
- fix(backend): handle null user in JWT strategy (#46)

### ♻️ Refactors
- refactor(backend): extract password hashing to utility (#44)

---

## [1.0.0] - 2026-06-15

### ✨ Features
- feat: initial project setup with auth, product, order modules

### 🔧 Chores
- chore: setup Docker Compose with PostgreSQL and Redis
- chore: add GitHub Actions CI/CD pipeline
```

---

## Mode: `setup` — Git Hooks & Commitlint

### Install Husky + Commitlint

```bash
# Install
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional

# Init husky
npx husky init

# Tambah commit-msg hook
echo 'npx --no -- commitlint --edit $1' > .husky/commit-msg

# Tambah pre-commit hook (lint + typecheck)
cat > .husky/pre-commit << 'EOF'
cd frontend && npx tsc --noEmit && cd ..
cd backend && npx tsc --noEmit && cd ..
EOF

chmod +x .husky/pre-commit .husky/commit-msg
```

### commitlint.config.cjs

> Pakai ekstensi `.cjs` (bukan `.js`) agar tetap jalan di project ESM (`"type": "module"`), seperti backend Prisma 7. Kalau pakai `.js` dengan `module.exports` di project ESM → error.

```javascript
// commitlint.config.cjs (root)
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "style", "docs", "test", "chore", "perf", "ci", "revert", "build"],
    ],
    "scope-enum": [
      1,
      "always",
      ["frontend", "backend", "ai-service", "docker", "prisma", "auth", "ui", "api"],
    ],
    "subject-max-length": [2, "always", 72],
    "subject-case": [2, "always", "lower-case"],
  },
};
```

### .gitignore Standard

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local
!.env.example

# Prisma generated
generated/

# Python
__pycache__/
*.py[cod]
.venv/
venv/
*.egg-info/
.pytest_cache/

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Docker
docker/data/

# Coverage
coverage/
.nyc_output/
```

---

## Quick Reference

```bash
# Status lengkap
git status && git log --oneline -10

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo specific file
git checkout HEAD -- path/to/file

# Stash sementara
git stash push -m "WIP: feature description"
git stash pop

# Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Lihat diff staged
git diff --cached
```

## Task

$ARGUMENTS
