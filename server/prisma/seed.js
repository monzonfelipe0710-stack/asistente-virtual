import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@chatap.gob.ar';
  const passwordPlano = 'cambiar123';

  const passwordHash = await bcrypt.hash(passwordPlano, 10);

  const superusuario = await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: {
      nombre: 'Superusuario',
      email,
      passwordHash,
      rol: 'SUPERUSUARIO',
    },
  });

  console.log('Superusuario listo:', superusuario.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });