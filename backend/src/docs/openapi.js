export function createOpenApiSpec(port) {
  return {
    openapi: '3.0.3',
    info: { title: 'mangertask API', version: '1.3.0' },
    servers: [{ url: `http://localhost:${port}` }],
    components: {
      schemas: {
        DemandaInput: {
          type: 'object',
          required: ['titulo', 'sistema', 'status'],
          properties: {
            demanda_readmine: { type: 'string', example: '122061' },
            titulo: { type: 'string', example: 'Inclusão do nome social' },
            descricao: { type: 'string' },
            sistema: { type: 'string', example: 'Coagulopatias' },
            responsavel_ids: { type: 'array', items: { type: 'integer' } },
            status: { type: 'string', example: 'EM ANDAMENTO' },
            percentual_desenvolvimento: { type: 'integer', minimum: 0, maximum: 100, example: 70 },
            previsao_entrega: { type: 'string', format: 'date', nullable: true },
            chamados_atuais: { type: 'string', nullable: true },
            situacao_atual: { type: 'string', nullable: true },
            acoes_necessarias: { type: 'string', nullable: true },
          },
        },
        ObservacaoInput: {
          type: 'object',
          required: ['texto'],
          properties: {
            autor: { type: 'string', example: 'Pablo' },
            texto: { type: 'string', example: 'Aguardando validação da homologação.' },
          },
        },
      },
    },
    paths: {
      '/desenvolvedores': { get: { summary: 'Lista desenvolvedores' } },
      '/sistemas': { get: { summary: 'Lista sistemas e gestores' } },
      '/dashboard/dev-workload': { get: { summary: 'Carga por desenvolvedor' } },
      '/demandas': {
        get: { summary: 'Lista demandas com filtros' },
        post: {
          summary: 'Cria demanda',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DemandaInput' } } } },
        },
      },
      '/demandas/{id}': {
        put: {
          summary: 'Atualiza demanda',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DemandaInput' } } } },
        },
        delete: { summary: 'Exclui demanda' },
      },
      '/demandas/{id}/observacoes': {
        get: { summary: 'Lista histórico de observações' },
        post: {
          summary: 'Adiciona observação',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ObservacaoInput' } } } },
        },
      },
      '/observacoes/{id}': {
        put: {
          summary: 'Edita observação',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ObservacaoInput' } } } },
        },
        delete: { summary: 'Exclui observação' },
      },
    },
  };
}
