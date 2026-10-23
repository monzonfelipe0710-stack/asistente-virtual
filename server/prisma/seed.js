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
      estado: 'APROBADO',
    },
  });

  console.log('Superusuario listo:', superusuario.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });