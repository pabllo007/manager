import { Router } from 'express';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { ddbDocClient, tableNames } from '../../config/db.js';

const router = Router();

router.get(
  '/desenvolvedores',
  asyncHandler(async (_req, res) => {
    const result = await ddbDocClient.send(
      new ScanCommand({
        TableName: tableNames.desenvolvedores,
        FilterExpression: 'ativo = :ativo',
        ExpressionAttributeValues: { ':ativo': true },
      }),
    );

    const rows = (result.Items || [])
      .map((d) => ({
        id: Number(d.id),
        nome: d.nome,
        email: d.email,
        equipe: d.equipe ?? null,
        perfil_contrato: d.perfil_contrato ?? null,
        ativo: Boolean(d.ativo),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    res.json(rows);
  }),
);

export default router;