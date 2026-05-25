# 💄 LaMaquilleuse — API Backend

> Plateforme SaaS dédiée aux maquilleuses professionnelles.

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

## Stack technique

- **Runtime** : Node.js + NestJS
- **Langage** : TypeScript
- **BDD** : PostgreSQL via Prisma ORM
- **Auth** : JWT (access + refresh) + OAuth Google
- **Mail** : Nodemailer
- **Paiement** : Stripe *(à venir)*
- **Temps réel** : Socket.io *(à venir)*
- **Déploiement** : Vercel / Railway / AWS

## Modules API (`/api/v1/`)

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

## Installation

```bash
# 1. Cloner le projet
git clone https://github.com/PontienElquatro/lamaquilleuse-web.git
cd lamaquilleuse-web

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Générer le client Prisma
npm run db:generate

# 5. Lancer les migrations
npm run db:migrate

# 6. Démarrer en développement
npm run start:dev
```

## Variables d'environnement

Copier `.env.example` en `.env` et remplir toutes les valeurs.

Les variables critiques :
- `DATABASE_URL` — connexion PostgreSQL
- `JWT_SECRET` + `JWT_REFRESH_SECRET` — clés secrètes JWT
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — OAuth Google
- `MAIL_*` — configuration SMTP

## Documentation API

Swagger disponible en développement :
```
http://localhost:3000/api/docs
```

## Endpoints Auth

```
POST   /api/v1/auth/register          Inscription
POST   /api/v1/auth/login             Connexion
POST   /api/v1/auth/refresh           Renouveler le token
POST   /api/v1/auth/logout            Déconnexion
GET    /api/v1/auth/verify-email      Vérifier email
POST   /api/v1/auth/forgot-password   Mot de passe oublié
POST   /api/v1/auth/reset-password    Réinitialiser mot de passe
GET    /api/v1/auth/google            OAuth Google
GET    /api/v1/auth/me                Profil courant
DELETE /api/v1/auth/account           Supprimer le compte
```

## Endpoints Users

```
GET    /api/v1/users/artists                    Rechercher des maquilleuses
GET    /api/v1/users/artists/:id                Profil public
GET    /api/v1/users/artists/:id/portfolio      Portfolio
GET    /api/v1/users/artists/:id/availability   Disponibilités
GET    /api/v1/users/me                         Mon profil
PUT    /api/v1/users/me                         Modifier mon profil
POST   /api/v1/users/me/avatar                  Changer l'avatar
GET    /api/v1/users/me/notifications           Mes notifications
PATCH  /api/v1/users/me/notifications/read      Marquer lues
POST   /api/v1/users/me/change-password         Changer mot de passe
```

## Structure du projet

```
src/
├── auth/           # Authentification (JWT, OAuth, guards)
├── users/          # Profils et marketplace
├── prisma/         # PrismaService global
├── mail/           # Service email
├── common/         # Interceptors, filters, decorators
└── main.ts         # Bootstrap
prisma/
└── schema.prisma   # Schéma de base de données
```

## Licence

Propriétaire — © 2025 LaMaquilleuse
