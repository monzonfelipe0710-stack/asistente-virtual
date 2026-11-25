import * as modeloChatService from '../services/modelo-chat.service.js';
import { auditoriaSchema, cambiarModeloSchema } from '../validators/modelo-chat.validator.js';

export const listar = async (req, res) => {
  res.json(await modeloChatService.listarModelos());
};

export const cambiarActivo = async (req, res) => {
  const { modeloId, motivo } = cambiarModeloSchema.parse(req.body);
  await modeloChatService.cambiarModeloActivo({ modeloId, motivo, usuarioId: req.usuario.id });
  res.json(await modeloChatService.listarModelos());
};

export const auditoria = async (req, res) => {
  const { limite } = auditoriaSchema.parse(req.query);
  res.json({ cambios: await modeloChatService.listarAuditoria({ limite }) });
};
