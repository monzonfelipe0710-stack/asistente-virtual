import * as metricaService from '../services/metrica.service.js';
import * as consultaService from '../services/consulta.service.js';
import { filtroMetricasSchema } from '../validators/metrica.validator.js';

// req.sectorIds lo fija alcanceSectores: el ADM queda en sus sectores con o sin ?alcance=propias.
export const porTramite = async (req, res) => {
  res.json(await metricaService.consultasPorTramite(req.sectorIds, filtroMetricasSchema.parse(req.query)));
};

export const sinRespuesta = async (req, res) => {
  res.json(await metricaService.consultasSinRespuesta(req.sectorIds, filtroMetricasSchema.parse(req.query)));
};

export const calificaciones = async (req, res) => {
  res.json(await consultaService.resumenCalificaciones({ ...filtroMetricasSchema.parse(req.query), sectorIds: req.sectorIds }));
};

export const resumen = async (req, res) => {
  res.json(await metricaService.resumenConsultas(req.sectorIds, filtroMetricasSchema.parse(req.query)));
};
