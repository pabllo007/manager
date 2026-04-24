import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';
const endpoint = process.env.AWS_ENDPOINT_URL_DYNAMODB;
const isLocalDynamo = Boolean(endpoint);
const hasStaticCredentials = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

console.log('AWS_REGION=', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID=', process.env.AWS_ACCESS_KEY_ID?.slice(0, 6));
console.log('HAS_SECRET=', !!process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_ENDPOINT_URL_DYNAMODB=', process.env.AWS_ENDPOINT_URL_DYNAMODB);

const clientConfig = {
  region,
  credentials: hasStaticCredentials
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      }
    : undefined,
};

if (endpoint) {
  clientConfig.endpoint = endpoint;
}

if (isLocalDynamo && !hasStaticCredentials) {
  clientConfig.credentials = {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  };
}

const dynamoClient = new DynamoDBClient(clientConfig);

export const ddbDocClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: { removeUndefinedValues: true },
});

export const tableNames = {
  demandas: process.env.DDB_TABLE_DEMANDAS || 'demandas',
  desenvolvedores: process.env.DDB_TABLE_DESENVOLVEDORES || 'desenvolvedores',
  sistemas: process.env.DDB_TABLE_SISTEMAS || 'sistemas',
  observacoes: process.env.DDB_TABLE_OBSERVACOES || 'observacoes',
  counters: process.env.DDB_TABLE_COUNTERS || 'counters',
};

const tableDefinitions = [
  {
    TableName: tableNames.demandas,
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'N' },
      { AttributeName: 'sistema', AttributeType: 'S' },
      { AttributeName: 'updated_at', AttributeType: 'S' },
      { AttributeName: 'demanda_readmine', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'sistema-updated-at-index',
        KeySchema: [
          { AttributeName: 'sistema', KeyType: 'HASH' },
          { AttributeName: 'updated_at', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'demanda-readmine-index',
        KeySchema: [{ AttributeName: 'demanda_readmine', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },
  {
    TableName: tableNames.desenvolvedores,
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'N' }],
  },
  {
    TableName: tableNames.sistemas,
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'N' }],
  },
  {
    TableName: tableNames.observacoes,
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'N' },
      { AttributeName: 'demanda_id', AttributeType: 'N' },
      { AttributeName: 'created_at', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'demanda-id-created-at-index',
        KeySchema: [
          { AttributeName: 'demanda_id', KeyType: 'HASH' },
          { AttributeName: 'created_at', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },
  {
    TableName: tableNames.counters,
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [{ AttributeName: 'name', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'name', AttributeType: 'S' }],
  },
];

async function tableExists(TableName) {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName }));
    return true;
  } catch (error) {
    if (error instanceof ResourceNotFoundException) return false;
    throw error;
  }
}

export async function ensureTables() {
  const autoCreate = String(process.env.DDB_AUTO_CREATE_TABLES || 'true').toLowerCase() === 'true';
  if (!autoCreate) return;

  for (const definition of tableDefinitions) {
    if (await tableExists(definition.TableName)) continue;

    await dynamoClient.send(new CreateTableCommand(definition));
    await waitUntilTableExists({ client: dynamoClient, maxWaitTime: 60 }, { TableName: definition.TableName });
  }
}

export async function getNextSequence(name) {
  const result = await ddbDocClient.send(
    new UpdateCommand({
      TableName: tableNames.counters,
      Key: { name },
      UpdateExpression: 'SET seq = if_not_exists(seq, :zero) + :inc',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
      },
      ReturnValues: 'UPDATED_NEW',
    }),
  );

  return Number(result.Attributes?.seq ?? 1);
}

export async function resetSequence(name) {
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: tableNames.counters,
      Key: { name },
      UpdateExpression: 'SET seq = :zero',
      ExpressionAttributeValues: { ':zero': 0 },
    }),
  );
}

export async function pingDb() {
  await dynamoClient.send(new DescribeTableCommand({ TableName: tableNames.demandas }));
}
