import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDocClient, getNextSequence, tableNames } from '../../config/db.js';

function normalizeObservacao(doc) {
  return {
    id: Number(doc.id),
    demanda_id: Number(doc.demanda_id),
    autor: doc.autor,
    texto: doc.texto,
    created_at: doc.created_at,
  };
}

export async function listByDemandaId(demandaId) {
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: tableNames.observacoes,
      IndexName: 'demanda-id-created-at-index',
      KeyConditionExpression: 'demanda_id = :demanda_id',
      ExpressionAttributeValues: { ':demanda_id': Number(demandaId) },
      ScanIndexForward: false,
    }),
  );

  return (result.Items || []).map(normalizeObservacao);
}

export async function createObservacao(demandaId, data) {
  const id = await getNextSequence('observacoes');
  const payload = {
    id,
    demanda_id: Number(demandaId),
    autor: data.autor,
    texto: data.texto,
    created_at: new Date().toISOString(),
  };

  await ddbDocClient.send(new PutCommand({ TableName: tableNames.observacoes, Item: payload }));
  return normalizeObservacao(payload);
}

export async function updateObservacao(id, data) {
  const result = await ddbDocClient.send(
    new UpdateCommand({
      TableName: tableNames.observacoes,
      Key: { id: Number(id) },
      UpdateExpression: 'SET autor = :autor, texto = :texto',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeValues: {
        ':autor': data.autor,
        ':texto': data.texto,
      },
      ReturnValues: 'ALL_NEW',
    }),
  ).catch((err) => {
    if (err.name === 'ConditionalCheckFailedException') return null;
    throw err;
  });

  return result?.Attributes ? normalizeObservacao(result.Attributes) : null;
}

export async function deleteObservacao(id) {
  const existing = await ddbDocClient.send(
    new GetCommand({
      TableName: tableNames.observacoes,
      Key: { id: Number(id) },
    }),
  );

  if (!existing.Item) return false;

  await ddbDocClient.send(
    new DeleteCommand({
      TableName: tableNames.observacoes,
      Key: { id: Number(id) },
    }),
  );
  return true;
}