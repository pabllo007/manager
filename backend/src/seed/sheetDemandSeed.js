import { DeleteCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDocClient, resetSequence, tableNames } from '../config/db.js';

const DEV_EMAIL_BY_ALIAS = {
  Alex: 'alex.almeida@saude.gov.br',
  Juliano: 'juliano.pires@saude.gov.br',
  Otávio: 'otavio.rodrigues@saude.gov.br',
  Mari: 'marilucia.queiroz@saude.gov.br',
  Milton: 'milton.ferreira@saude.gov.br',
  Guilherme: 'guilherme.fonseca@saude.gov.br',
  João: 'joao.kreimer@saude.gov.br',
  Deivdy: 'deivdy.silva@saude.gov.br',
  Pablo: 'pablo.andrade@saude.gov.br',
};

const SHEET_DEMANDS = [
  { demanda_readmine: '122061', sistema: 'Coagulopatias', responsaveis: ['Juliano'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'Demanda referente a inclusão do nome Social', chamados: null, situacao: 'Ajustes nas telas pelo Otávio' },
  { demanda_readmine: '127769', sistema: 'Coagulopatias', responsaveis: ['Juliano'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'Demanda referente a inclusão do nome Social', chamados: null, situacao: 'Ajustes nas telas pelo Otávio' },
  { demanda_readmine: '127771', sistema: 'Coagulopatias', responsaveis: ['Alex'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'Demanda referente a inclusão do nome Social', chamados: null, situacao: 'Ajustes nas telas pelo Otávio' },
  { demanda_readmine: '128179', sistema: 'Coagulopatias', responsaveis: ['Alex'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'Demanda referente a inclusão do nome Social', chamados: null, situacao: 'Ajustes nas telas pelo Otávio' },
  { demanda_readmine: '127770', sistema: 'Coagulopatias', responsaveis: ['Otávio'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'Demanda referente a inclusão do nome Social', chamados: null, situacao: 'Ajustes nas telas pelo Otávio' },

  { demanda_readmine: '129437', sistema: 'Hemoglobinopatias', responsaveis: ['Mari'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'aguardando homologação pela área de negócio.', chamados: null, situacao: null },
  { demanda_readmine: '129438', sistema: 'Hemoglobinopatias', responsaveis: ['Juliano'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'aguardando homologação pela área de negócio.', chamados: null, situacao: null },
  { demanda_readmine: '124225', sistema: 'Hemoglobinopatias', responsaveis: ['Otávio'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'aguardando homologação pela área de negócio.', chamados: null, situacao: null },
  { demanda_readmine: '132504', sistema: 'Hemoglobinopatias', responsaveis: ['Milton'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'aguardando homologação pela área de negócio.', chamados: null, situacao: null },
  { demanda_readmine: '132270', sistema: 'Ciclo de Sangue', responsaveis: ['Otávio'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'aguardando homologação pela área de negócio.', chamados: null, situacao: null },
  { demanda_readmine: '129439', sistema: 'Hemoglobinopatias', responsaveis: ['Mari'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'aguardando homologação pela área de negócio.', chamados: null, situacao: null },
  { demanda_readmine: '124227', sistema: 'Hemoglobinopatias', responsaveis: ['Mari'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'aguardando homologação pela área de negócio.', chamados: null, situacao: null },
  { demanda_readmine: '132256', sistema: 'Hemoglobinopatias', responsaveis: ['Milton'], percentual: 90, status: 'HOMOLOGAÇÃO', descricao: 'aguardando homologação pela área de negócio.', chamados: '1631333', situacao: null },

  { demanda_readmine: '131660', sistema: 'Coagulopatias', responsaveis: ['Alex'], percentual: 80, status: 'EM ANDAMENTO', descricao: 'Problema ocasionado pela invasão, será resolvido com os scripts criados pelo Alex.', chamados: '1630269', situacao: 'Aberto chamado 1630269 para liberação de rota dos servidores de desenvolvimento (aplicação) e produção (banco de dados)' },
  { demanda_readmine: '129848', sistema: 'Coagulopatias', responsaveis: ['Alex'], percentual: 80, status: 'EM ANDAMENTO', descricao: 'Problema ocasionado pela invasão, será resolvido com os scripts criados pelo Alex.', chamados: '1630269', situacao: 'Aberto chamado 1630269 para liberação de rota dos servidores de desenvolvimento (aplicação) e produção (banco de dados)' },
  { demanda_readmine: '133212', sistema: 'Coagulopatias', responsaveis: ['Alex'], percentual: 80, status: 'EM ANDAMENTO', descricao: 'Problema ocasionado pela invasão, será resolvido com os scripts criados pelo Alex.', chamados: '1630269', situacao: 'Aberto chamado 1630269 para liberação de rota dos servidores de desenvolvimento (aplicação) e produção (banco de dados)' },

  { demanda_readmine: '129195', sistema: 'Coagulopatias', responsaveis: ['Alex', 'Otávio'], percentual: 90, status: 'EM ANDAMENTO', descricao: 'Ajustes no sistema em homologação pela área de negócio, integração RNDS em desenvolvimento.', chamados: null, situacao: 'Alex está fazendo o mapeamento dos campos do RNDS para entregar ao Otávio.' },
  { demanda_readmine: '129197', sistema: 'Hemoglobinopatias', responsaveis: ['Milton', 'Mari'], percentual: 90, status: 'EM ANDAMENTO', descricao: 'Ajustes no sistema em homologação pela área de negócio, integração RNDS em desenvolvimento.', chamados: null, situacao: 'Mari e Alex estão atendendo as alterações refente e-mail do Wesley Entrada de Medicamentos – Estado (Gravar e Distribuir).' },

  { demanda_readmine: null, sistema: 'Ciclo de Sangue', responsaveis: ['Guilherme', 'Juliano'], percentual: 0, status: 'NÃO INICIADO', descricao: 'Refatoração SQL para impedir SQLInjection', chamados: null, situacao: 'Abrir Chamado' },
  { demanda_readmine: '137712', sistema: 'Hemoglobinopatias', responsaveis: ['Guilherme', 'Juliano'], percentual: 0, status: 'EM ANDAMENTO', descricao: 'Refatoração SQL para impedir SQLInjection', chamados: null, situacao: 'Abrir Chamado' },
  { demanda_readmine: '134781', sistema: 'Coagulopatias', responsaveis: ['Guilherme', 'Juliano'], percentual: 90, status: 'EM ANDAMENTO', descricao: 'Refatoração SQL para impedir SQLInjection', chamados: null, situacao: 'Criado chamado 1623985 para subir dois ambientes novos para homologação dessa demanda.' },

  { demanda_readmine: '136003', sistema: 'GSM-NAT', responsaveis: ['João'], percentual: 70, status: 'EM ANDAMENTO', descricao: 'Em Análise do erro. Tentando subir o arquivo no sistema que foi disponibilizado pelo Diego e gerar todo o processo para verificar qual situação que está sendo registrada no sistema', chamados: null, situacao: 'Aguardando agendamento (Diego) para ir ao Hemocentro verificar como é o fluxo do sistema' },
  { demanda_readmine: '134797', sistema: 'GSM-NAT', responsaveis: ['Deivdy'], percentual: 90, status: 'EM ANDAMENTO', descricao: 'analise 100%. Aguardando o desfecho do chamado 136003 para o gestor sinalizar se vai fechar o chamado ou se terá algum ajuste de regra de negócio.', chamados: null, situacao: null },
  { demanda_readmine: '137569', sistema: 'Hemoglobinopatias', responsaveis: ['Milton'], percentual: 100, status: 'CONCLUÍDO', descricao: 'formulário de cadastro não está enviando e-mail de confirmação.', chamados: null, situacao: 'Homologada e disponibilizada em PRD em 17/04/2026' },

  { demanda_readmine: '135204', sistema: 'Coagulopatias', responsaveis: ['Alex'], percentual: 0, status: 'NÃO INICIADO', descricao: 'Demanda do CPF', chamados: null, situacao: 'Conversar' },
  { demanda_readmine: null, sistema: 'Hemoglobinopatias', responsaveis: ['Milton'], percentual: 0, status: 'NÃO INICIADO', descricao: 'Demanda do CPF', chamados: null, situacao: 'Conversado, irá fazer um planejamento de entregas' },
  { demanda_readmine: null, sistema: 'Ciclo de Sangue', responsaveis: ['Otávio'], percentual: 0, status: 'NÃO INICIADO', descricao: 'Demanda do CPF', chamados: null, situacao: 'Conversar' },
  { demanda_readmine: null, sistema: 'Coagulopatias', responsaveis: ['Otávio'], percentual: 0, status: 'NÃO INICIADO', descricao: 'Analise da Demanda do CNPJ', chamados: null, situacao: null },
  { demanda_readmine: null, sistema: 'GSM-NAT', responsaveis: ['Pablo'], percentual: 0, status: 'NÃO INICIADO', descricao: 'Analise da Demanda do CNPJ', chamados: null, situacao: null },
];

async function clearTable(tableName, keyName) {
  const result = await ddbDocClient.send(
    new ScanCommand({
      TableName: tableName,
      ProjectionExpression: '#pk',
      ExpressionAttributeNames: {
        '#pk': keyName,
      },
    }),
  );

  const items = result.Items || [];
  if (!items.length) return;

  await Promise.all(
    items.map((item) =>
      ddbDocClient.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { [keyName]: item[keyName] },
        }),
      ),
    ),
  );
}

async function seedDevelopers() {
  const devs = [
    { id: 1, nome: 'Alex', email: DEV_EMAIL_BY_ALIAS.Alex },
    { id: 2, nome: 'Juliano', email: DEV_EMAIL_BY_ALIAS.Juliano },
    { id: 3, nome: 'Otávio', email: DEV_EMAIL_BY_ALIAS.Otávio },
    { id: 4, nome: 'Mari', email: DEV_EMAIL_BY_ALIAS.Mari },
    { id: 5, nome: 'Milton', email: DEV_EMAIL_BY_ALIAS.Milton },
    { id: 6, nome: 'Guilherme', email: DEV_EMAIL_BY_ALIAS.Guilherme },
    { id: 7, nome: 'João', email: DEV_EMAIL_BY_ALIAS.João },
    { id: 8, nome: 'Deivdy', email: DEV_EMAIL_BY_ALIAS.Deivdy },
    { id: 9, nome: 'Pablo', email: DEV_EMAIL_BY_ALIAS.Pablo },
  ].map((dev) => ({
    ...dev,
    equipe: 'Desenvolvimento',
    perfil_contrato: 'Interno',
    ativo: true,
  }));

  await Promise.all(
    devs.map((dev) => ddbDocClient.send(new PutCommand({ TableName: tableNames.desenvolvedores, Item: dev }))),
  );

  return new Map(devs.map((d) => [d.email, d.id]));
}

async function seedSystems() {
  const names = Array.from(new Set(SHEET_DEMANDS.map((d) => d.sistema))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  await Promise.all(
    names.map((nome, idx) =>
      ddbDocClient.send(
        new PutCommand({
          TableName: tableNames.sistemas,
          Item: {
            id: idx + 1,
            nome,
            equipe: 'Tecnologia',
            gerente_relacionamento: null,
            gerente_tecnico: null,
            ponto_focal: null,
          },
        }),
      ),
    ),
  );
}

async function seedDemandas(devMap) {
  let id = 1;

  const payload = SHEET_DEMANDS.map((row) => {
    const responsavel_ids = row.responsaveis
      .map((alias) => devMap.get(DEV_EMAIL_BY_ALIAS[alias]))
      .filter((value) => Number.isInteger(value));

    if (!responsavel_ids.length) return null;

    const now = new Date().toISOString();

    return {
      id: id++,
      demanda_readmine: row.demanda_readmine != null ? String(row.demanda_readmine) : "0",
      titulo: row.descricao,
      descricao: row.descricao,
      sistema: row.sistema,
      responsavel_ids,
      status: row.status,
      percentual_desenvolvimento: row.percentual,
      previsao_entrega: null,
      chamados_atuais: row.chamados,
      situacao_atual: row.situacao,
      acoes_necessarias: null,
      created_at: now,
      updated_at: now,
    };
  }).filter(Boolean);

  await Promise.all(
    payload.map((item) => ddbDocClient.send(new PutCommand({ TableName: tableNames.demandas, Item: item }))),
  );

  return payload.length;
}

export async function runSheetDemandSeed() {
  try {
    await clearTable(tableNames.observacoes, 'id');
    await clearTable(tableNames.demandas, 'id');
    await clearTable(tableNames.sistemas, 'id');
    await clearTable(tableNames.desenvolvedores, 'id');
    await clearTable(tableNames.counters, 'name');

    await Promise.all([
      resetSequence('demandas'),
      resetSequence('observacoes'),
    ]);

    const devMap = await seedDevelopers();
    await seedSystems();
    const seededCount = await seedDemandas(devMap);

    console.info(`Seed concluído: ${seededCount} demandas carregadas da planilha.`);
  } catch (error) {
    console.error('Falha ao executar seed da planilha:', error);
    throw error;
  }
}