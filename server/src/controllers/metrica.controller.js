import * as metricaService from '../services/metrica.service.js';
import * as usuarioService from '../services/usuario.service.js';

export const porTramite = async (req, res) => {
  let sectorIds = null;

  if (req.query.alcance === 'propias') {
    const sectores = await usuarioService.listarSectoresDeUsuario(req.usuario.id);
    sectorIds = sectores.map((s) => s.sectorId ?? s.id);
  }

  const datos = await metricaService.consultasPorTramite(sectorIds);
  res.json(datos);
};

export const sinRespuesta = async (req, res) => {
  const datos = await metricaService.consultasSinRespuesta();
  res.json(datos);
};