import { Router } from 'express';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { ddbDocClient, tableNames } from '../../config/db.js';

const router = Router();

const STATUSES = ['NÃO INICIADO', 'EM ANDAMENTO', 'HOMOLOGAÇÃO', 'CONCLUÍDO'];

router.get(
  '/dashboard/dev-workload',
  asyncHandler(async (_req, res) => {
    const [devResult, demandasResult] = await Promise.all([
      ddbDocClient.send(
        new ScanCommand({
          TableName: tableNames.desenvolvedores,
          FilterExpression: 'ativo = :ativo',
          ExpressionAttributeValues: { ':ativo': true },
        }),
      ),
      ddbDocClient.send(new ScanCommand({ TableName: tableNames.demandas })),
    ]);

    const devs = (devResult.Items || []).sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
    const allDemandas = demandasResult.Items || [];

    const workload = devs.map((dev) => {
      const devId = Number(dev.id);
      const related = allDemandas.filter((d) => (d.responsavel_ids || []).includes(devId));

      const byStatus = Object.fromEntries(
        STATUSES.map((status) => [status, related.filter((d) => d.status === status)]),
      );

      const toSimple = (arr) => arr.map((d) => ({ id: Number(d.id), demanda_readmine: d.demanda_readmine ?? null, titulo: d.titulo }));

      return {
        id: devId,
        nome: dev.nome,
        total_demandas: related.length,
        nao_iniciado: byStatus['NÃO INICIADO'].length,
        em_andamento: byStatus['EM ANDAMENTO'].length,
        homologacao: byStatus['HOMOLOGAÇÃO'].length,
        concluido: byStatus['CONCLUÍDO'].length,
        total_demandas_lista: toSimple(related),
        nao_iniciado_lista: toSimple(byStatus['NÃO INICIADO']),
        em_andamento_lista: toSimple(byStatus['EM ANDAMENTO']),
        homologacao_lista: toSimple(byStatus['HOMOLOGAÇÃO']),
        concluido_lista: toSimple(byStatus['CONCLUÍDO']),
      };
    });

    workload.sort((a, b) => b.total_demandas - a.total_demandas || a.nome.localeCompare(b.nome, 'pt-BR'));
    res.json(workload);
  }),
);

export default router;