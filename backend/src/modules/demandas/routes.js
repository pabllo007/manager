import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { parseDemandInput } from '../../utils/validators.js';
import * as service from './service.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await service.listDemandas({
      sistema: req.query.sistema,
      status: req.query.status,
      responsavel_id: req.query.responsavel_id,
      demanda_readmine: req.query.demanda_readmine,
    });
    res.json(rows);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = parseDemandInput(req.body);
    const created = await service.createDemanda(payload);
    res.status(201).json(created);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const payload = parseDemandInput(req.body);
    const updated = await service.updateDemanda(req.params.id, payload);
    res.json(updated);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await service.deleteDemanda(req.params.id);
    res.status(204).send();
  }),
);

export default router;