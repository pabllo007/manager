import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddbDocClient, getNextSequence, tableNames } from '../../config/db.js';

function normalizeDemand(doc, devById) {
  return {
    id: Number(doc.id),
    demanda_readmine: doc.demanda_readmine != null ? String(doc.demanda_readmine) : "0",
    titulo: doc.titulo,
    descricao: doc.descricao ?? null,
    sistema: doc.sistema,
    responsavel_ids: Array.isArray(doc.responsavel_ids) ? doc.responsavel_ids.map(Number) : [],
    responsavel_nomes: (doc.responsavel_ids || [])
      .map((devId) => devById.get(Number(devId))?.nome)
      .filter(Boolean)
      .join(', ') || null,
    status: doc.status,
    percentual_desenvolvimento: Number(doc.percentual_desenvolvimento ?? 0),
    previsao_entrega: doc.previsao_entrega ?? null,
    chamados_atuais: doc.chamados_atuais ?? null,
    situacao_atual: doc.situacao_atual ?? null,
    acoes_necessarias: doc.acoes_necessarias ?? null,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

async function getDevMap() {
  const result = await ddbDocClient.send(
    new ScanCommand({
      TableName: tableNames.desenvolvedores,
      FilterExpression: 'ativo = :ativo',
      ExpressionAttributeValues: { ':ativo': true },
    }),
  );
  const rows = result.Items || [];
  return new Map(rows.map((d) => [Number(d.id), d]));
}

function sortDemandasDesc(items) {
  return [...items].sort((a, b) => {
    const dateDiff = String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
    if (dateDiff !== 0) return dateDiff;
    return Number(b.id) - Number(a.id);
  });
}

export async function listDemandas(filters) {
  let items = [];

  if (filters.demanda_readmine) {
    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: tableNames.demandas,
        IndexName: 'demanda-readmine-index',
        KeyConditionExpression: 'demanda_readmine = :demanda_readmine',
        ExpressionAttributeValues: {
          ':demanda_readmine': String(filters.demanda_readmine),
        },
      }),
    );
    items = result.Items || [];
  } else if (filters.sistema) {
    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: tableNames.demandas,
        IndexName: 'sistema-updated-at-index',
        KeyConditionExpression: 'sistema = :sistema',
        ExpressionAttributeValues: {
          ':sistema': filters.sistema,
        },
        ScanIndexForward: false,
      }),
    );
    items = result.Items || [];
  } else {
    const result = await ddbDocClient.send(new ScanCommand({ TableName: tableNames.demandas }));
    items = result.Items || [];
  }

  if (filters.status) {
    items = items.filter((item) => item.status === filters.status);
  }

  if (filters.responsavel_id) {
    const rid = Number(filters.responsavel_id);
    items = items.filter((item) => (item.responsavel_ids || []).includes(rid));
  }

  const devById = await getDevMap();
  return sortDemandasDesc(items).map((doc) => normalizeDemand(doc, devById));
}

export async function createDemanda(data) {
  const id = await getNextSequence('demandas');
  const now = new Date().toISOString();

  const payload = {
    id,
    demanda_readmine: data.demanda_readmine != null ? String(data.demanda_readmine) : "0",
    titulo: data.titulo,
    descricao: data.descricao,
    sistema: data.sistema,
    responsavel_ids: data.responsavel_ids,
    status: data.status,
    percentual_desenvolvimento: data.percentual_desenvolvimento,
    previsao_entrega: data.previsao_entrega,
    chamados_atuais: data.chamados_atuais,
    situacao_atual: data.situacao_atual,
    acoes_necessarias: data.acoes_necessarias,
    created_at: now,
    updated_at: now,
  };

  await ddbDocClient.send(new PutCommand({ TableName: tableNames.demandas, Item: payload }));
  const devById = await getDevMap();
  return normalizeDemand(payload, devById);
}

export async function updateDemanda(id, data) {
  const demandId = Number(id);
  const now = new Date().toISOString();

  const result = await ddbDocClient.send(
    new UpdateCommand({
      TableName: tableNames.demandas,
      Key: { id: demandId },
      UpdateExpression: 'SET demanda_readmine = :demanda_readmine, titulo = :titulo, descricao = :descricao, sistema = :sistema, responsavel_ids = :responsavel_ids, #status = :status, percentual_desenvolvimento = :percentual_desenvolvimento, previsao_entrega = :previsao_entrega, chamados_atuais = :chamados_atuais, situacao_atual = :situacao_atual, acoes_necessarias = :acoes_necessarias, updated_at = :updated_at',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':demanda_readmine': data.demanda_readmine,
        ':titulo': data.titulo,
        ':descricao': data.descricao,
        ':sistema': data.sistema,
        ':responsavel_ids': data.responsavel_ids,
        ':status': data.status,
        ':percentual_desenvolvimento': data.percentual_desenvolvimento,
        ':previsao_entrega': data.previsao_entrega,
        ':chamados_atuais': data.chamados_atuais,
        ':situacao_atual': data.situacao_atual,
        ':acoes_necessarias': data.acoes_necessarias,
        ':updated_at': now,
      },
      ReturnValues: 'ALL_NEW',
    }),
  ).catch((err) => {
    if (err.name === 'ConditionalCheckFailedException') return null;
    throw err;
  });

  const updatedDoc = result?.Attributes;
  if (!updatedDoc) return null;

  const devById = await getDevMap();
  return normalizeDemand(updatedDoc, devById);
}

export async function deleteDemanda(id) {
  const demandId = Number(id);

  const existing = await ddbDocClient.send(
    new GetCommand({
      TableName: tableNames.demandas,
      Key: { id: demandId },
    }),
  );

  if (!existing.Item) return false;

  await ddbDocClient.send(
    new DeleteCommand({
      TableName: tableNames.demandas,
      Key: { id: demandId },
    }),
  );

  const observacoes = await ddbDocClient.send(
    new QueryCommand({
      TableName: tableNames.observacoes,
      IndexName: 'demanda-id-created-at-index',
      KeyConditionExpression: 'demanda_id = :demanda_id',
      ExpressionAttributeValues: { ':demanda_id': demandId },
    }),
  );

  const deletions = (observacoes.Items || []).map((item) =>
    ddbDocClient.send(
      new DeleteCommand({
        TableName: tableNames.observacoes,
        Key: { id: Number(item.id) },
      }),
    ),
  );

  if (deletions.length) await Promise.all(deletions);
  return true;
}