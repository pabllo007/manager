import { Router } from 'express';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { ddbDocClient, tableNames } from '../../config/db.js';

const router = Router();

router.get(
  '/sistemas',
  asyncHandler(async (_req, res) => {
    const result = await ddbDocClient.send(new ScanCommand({ TableName: tableNames.sistemas }));

    const rows = (result.Items || [])
      .map((s) => ({
        id: Number(s.id),
        nome: s.nome,
        equipe: s.equipe ?? null,
        gerente_relacionamento: s.gerente_relacionamento ?? null,
        gerente_tecnico: s.gerente_tecnico ?? null,
        ponto_focal: s.ponto_focal ?? null,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    res.json(rows);
  }),
);

export default router;