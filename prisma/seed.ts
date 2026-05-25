import { PrismaClient, Role, AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin ──────────────────────────────────────────────────────────
  const adminPwd = await bcrypt.hash('Admin2024!', 12);
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@lamaquilleuse.fr' },
    update: {},
    create: {
      email:           'admin@lamaquilleuse.fr',
      password:        adminPwd,
      firstName:       'Admin',
      lastName:        'LaMaquilleuse',
      role:            Role.ADMIN,
      provider:        AuthProvider.LOCAL,
      isEmailVerified: true,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ─── Artiste test ────────────────────────────────────────────────────
  const artistPwd = await bcrypt.hash('Artist2024!', 12);
  const artist = await prisma.user.upsert({
    where:  { email: 'sophie@lamaquilleuse.fr' },
    update: {},
    create: {
      email:           'sophie@lamaquilleuse.fr',
      password:        artistPwd,
      firstName:       'Sophie',
      lastName:        'Martin',
      role:            Role.ARTIST,
      provider:        AuthProvider.LOCAL,
      isEmailVerified: true,
      city:            'Paris',
      bio:             'Maquilleuse professionnelle depuis 8 ans, spécialisée mariage et shooting.',
      specialties:     ['MARIAGE', 'SHOOTING', 'SOIREE'],
      yearsOfExp:      8,
    },
  });
  console.log(`✅ Artiste: ${artist.email}`);

  // ─── Service test ─────────────────────────────────────────────────────
  const service = await prisma.service.upsert({
    where:  { slug: 'maquillage-mariage-complet' },
    update: {},
    create: {
      slug:         'maquillage-mariage-complet',
      title:        'Maquillage Mariée Complet',
      description:  'Maquillage longue tenue pour votre jour J. Essai inclus, déplacement possible en Île-de-France.',
      category:     'MARIAGE',
      status:       'ACTIVE',
      duration:     120,
      price:        25000,
      currency:     'EUR',
      isHomeService: true,
      travelFee:    5000,
      artistId:     artist.id,
      tags:         ['mariage', 'mariée', 'paris', 'longue-tenue'],
    },
  });
  console.log(`✅ Service: ${service.title}`);

  // ─── Client test ──────────────────────────────────────────────────────
  const clientPwd = await bcrypt.hash('Client2024!', 12);
  const client = await prisma.user.upsert({
    where:  { email: 'emma@test.fr' },
    update: {},
    create: {
      email:           'emma@test.fr',
      password:        clientPwd,
      firstName:       'Emma',
      lastName:        'Dubois',
      role:            Role.CLIENT,
      provider:        AuthProvider.LOCAL,
      isEmailVerified: true,
    },
  });
  console.log(`✅ Cliente: ${client.email}`);

  console.log('\n✨ Seed terminé !');
  console.log('─────────────────────────────────');
  console.log('Admin   : admin@lamaquilleuse.fr / Admin2024!');
  console.log('Artiste : sophie@lamaquilleuse.fr / Artist2024!');
  console.log('Cliente : emma@test.fr / Client2024!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
