import { badRequest } from './httpError.js';

export const STATUS_OPTIONS = ['NÃO INICIADO', 'EM ANDAMENTO', 'HOMOLOGAÇÃO', 'CONCLUÍDO'];

export function parseDemandInput(body) {
  const errors = [];

  const demanda_readmine = String(body?.demanda_readmine || body?.codigo || '').trim();
  const titulo = String(body?.titulo || '').trim();
  const sistema = String(body?.sistema || '').trim();
  const status = String(body?.status || '').trim();

  if (!titulo) errors.push('titulo é obrigatório');
  if (!sistema) errors.push('sistema é obrigatório');
  if (!STATUS_OPTIONS.includes(status)) errors.push('status inválido');

  const percentual_desenvolvimento = Number(body?.percentual_desenvolvimento ?? 0);
  if (!Number.isInteger(percentual_desenvolvimento) || percentual_desenvolvimento < 0 || percentual_desenvolvimento > 100) {
    errors.push('percentual_desenvolvimento deve ser inteiro entre 0 e 100');
  }

  const parsedResponsaveis = Array.from(new Set(
    (Array.isArray(body?.responsavel_ids) ? body.responsavel_ids : [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0),
  ));

  const previsao_entrega = body?.previsao_entrega || null;
  if (previsao_entrega && !/^\d{4}-\d{2}-\d{2}$/.test(String(previsao_entrega))) {
    errors.push('previsao_entrega deve estar no formato YYYY-MM-DD');
  }

  if (errors.length) {
    throw badRequest('Payload inválido', errors);
  }

  return {
    demanda_readmine: demanda_readmine || null,
    titulo,
    descricao: body?.descricao ?? null,
    sistema,
    responsavel_ids: parsedResponsaveis,
    status,
    percentual_desenvolvimento,
    previsao_entrega,
    chamados_atuais: body?.chamados_atuais || null,
    situacao_atual: body?.situacao_atual || null,
    acoes_necessarias: body?.acoes_necessarias || null,
  };
}

export function parseObservacaoInput(body) {
  const texto = String(body?.texto || '').trim();
  const autor = String(body?.autor || 'Usuário').trim();

  if (!texto) {
    throw badRequest('Payload inválido', ['texto é obrigatório']);
  }

  return { texto, autor: autor || 'Usuário' };
}
