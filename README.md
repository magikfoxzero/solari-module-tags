# solari-module-tags

Tags module for SolariWebOS — tagging system for organizing and categorizing records across modules.

## Structure

- `backend/` — Laravel package (`newsolari/tags`)
- `frontend/` — React module (pages, API client, routes)
- `service/` — Standalone Laravel service (port 8124)

## Standalone Service

```bash
cd service
composer install
cp .env.example .env
php artisan key:generate
php -S 0.0.0.0:8124 -t public
```

## Monorepo Integration

Added as a git submodule at `modules/tags`. The monorepo's `webos/composer.json` points its path repository to `../modules/tags/backend`, and the frontend is symlinked from `frontend/src/modules/tags` to `modules/tags/frontend`.
