import * as metricaService from '../services/metrica.service.js';

export const porTramite = async (req, res) => {
  const datos = await metricaService.consultasPorTramite();
  res.json(datos);
};

export const sinRespuesta = async (req, res) => {
  const datos = await metricaService.consultasSinRespuesta();
  res.json(datos);
};