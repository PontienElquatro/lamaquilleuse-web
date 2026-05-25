# 💄 LaMaquilleuse — API Backend

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

## Stack

| Couche | Technologie |
|--------|------------|
| Runtime | Node.js 20 + NestJS 10 |
| Langage | TypeScript 5 |
| BDD | PostgreSQL (Supabase) |
| ORM | Prisma 5 |
| Auth | JWT + OAuth Google |
| Storage | Supabase Storage |
| Déploiement | Railway |
| CI/CD | GitHub Actions |

## Modules API `/api/v1/`

| Module | Endpoint | Statut |
|--------|----------|--------|
| Auth | `/auth` | ✅ Complet |
| Users | `/users` | ✅ Complet |
| Services | `/services` | ✅ Complet |
| Bookings | `/bookings` | 🔄 En cours |
| Agenda | `/agenda` | 🔄 En cours |
| Payments | `/payments` | 🔄 En cours |
| Messages | `/messages` | 🔄 En cours |
| Social | `/social` | 🔄 En cours |
| Reviews | `/reviews` | 🔄 En cours |

## Installation locale

```bash
# 1. Cloner
git clone https://github.com/PontienElquatro/lamaquilleuse-web.git
cd lamaquilleuse-web

# 2. Dépendances
npm install

# 3. Variables d'environnement
cp .env.example .env
# → Remplir les valeurs (voir section Variables)

# 4. Prisma
npm run db:generate
npm run db:migrate

# 5. Seed (données de test)
npm run db:seed

# 6. Démarrer
npm run start:dev
```

## Variables d'environnement

| Variable | Description | Où récupérer |
|----------|-------------|--------------|
| `DATABASE_URL` | URL PostgreSQL | Supabase → Settings → Database |
| `SUPABASE_URL` | URL projet Supabase | Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | Clé service_role | Supabase → Settings → API |
| `SUPABASE_BUCKET` | Nom du bucket | `lamaquilleuse` |
| `JWT_SECRET` | Clé JWT access | Générer aléatoirement |
| `JWT_REFRESH_SECRET` | Clé JWT refresh | Générer aléatoirement |
| `GOOGLE_CLIENT_ID` | OAuth Google | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Google | Google Cloud Console |
| `MAIL_*` | Config SMTP | Gmail App Password |
| `RAILWAY_TOKEN` | Deploy token | Railway → Settings |

## Déploiement Railway

```bash
# 1. Installer Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Lier au projet
railway link

# 4. Déployer
railway up
```

## Documentation API

Swagger (dev) : `http://localhost:3000/api/docs`

Health check : `GET /api/v1/health`

## Comptes de test (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@lamaquilleuse.fr | Admin2024! |
| Artiste | sophie@lamaquilleuse.fr | Artist2024! |
| Cliente | emma@test.fr | Client2024! |
