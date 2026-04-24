import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { parseObservacaoInput } from '../../utils/validators.js';
import * as service from './service.js';

const router = Router();

router.get(
  '/demandas/:id/observacoes',
  asyncHandler(async (req, res) => {
    const rows = await service.listByDemandaId(req.params.id);
    res.json(rows);
  }),
);

router.post(
  '/demandas/:id/observacoes',
  asyncHandler(async (req, res) => {
    const payload = parseObservacaoInput(req.body);
    const created = await service.createObservacao(req.params.id, payload);
    res.status(201).json(created);
  }),
);

router.put(
  '/observacoes/:id',
  asyncHandler(async (req, res) => {
    const payload = parseObservacaoInput(req.body);
    const updated = await service.updateObservacao(req.params.id, payload);
    res.json(updated);
  }),
);

router.delete(
  '/observacoes/:id',
  asyncHandler(async (req, res) => {
    await service.deleteObservacao(req.params.id);
    res.status(204).send();
  }),
);

export default router;
