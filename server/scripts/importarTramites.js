import 'dotenv/config';
import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma.js';
import { indexarTramite } from '../src/services/embedding.service.js';

const ARCHIVO = process.argv[2] ?? 'tramites_normalizado.json';

async function obtenerUsuarioSistema() {
  const email = 'sistema@chatap.local';
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) return existente;

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
  return prisma.usuario.create({
    data: {
      nombre: 'Sistema',
      email,
      passwordHash,
      rol: 'ADMINISTRADOR',
      estado: 'APROBADO', // no es logueable: password aleatorio
    },
  });
}

async function upsertSectores(sectores) {
  const mapa = new Map();
  for (const s of sectores) {
    const existente = await prisma.sector.findFirst({
      where: { nombre: s.nombre, parentId: null },
    });
    const sector = existente ?? await prisma.sector.create({
      data: { nombre: s.nombre, tipo: s.tipo },
    });
    mapa.set(s.nombre, sector.id);
  }
  return mapa;
}

async function main() {
  const datos = JSON.parse(readFileSync(ARCHIVO, 'utf-8'));
  const sistema = await obtenerUsuarioSistema();
  const sectoresPorNombre = await upsertSectores(datos.sectores);

  const aIndexar = [];
  let creados = 0, actualizados = 0;

  for (const t of datos.tramites) {
    const sectorId = sectoresPorNombre.get(t.sector);
    if (!sectorId) {
      console.warn(`Sector no encontrado para "${t.nombre}": ${t.sector}`);
      continue;
    }

    const existente = t.fuenteUrl
      ? await prisma.tramite.findUnique({ where: { fuenteUrl: t.fuenteUrl } })
      : null;

    if (existente) {
      const cambio = existente.descripcion !== t.descripcion || existente.nombre !== t.nombre;
      await prisma.tramite.update({
        where: { id: existente.id },
        data: { nombre: t.nombre, descripcion: t.descripcion, sectorId },
      });
      actualizados++;
      if (cambio) aIndexar.push(existente.id);
    } else {
      const creado = await prisma.tramite.create({
        data: {
          nombre: t.nombre,
          descripcion: t.descripcion,
          sectorId,
          encargadoId: sistema.id,
          publicado: true,
          fuenteUrl: t.fuenteUrl || null,
        },
      });
      creados++;
      aIndexar.push(creado.id);
    }
  }

  console.log(`Sectores: ${sectoresPorNombre.size} | Creados: ${creados} | Actualizados: ${actualizados}`);
  console.log(`Generando embeddings de ${aIndexar.length} trámites...`);

  let i = 0;
  for (const id of aIndexar) {
    await indexarTramite(id);
    if (++i % 25 === 0) console.log(`  ${i}/${aIndexar.length}`);
  }
  console.log('Listo.');
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());