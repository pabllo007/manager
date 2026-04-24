import * as repository from './repository.js';
import { notFound } from '../../utils/httpError.js';

export async function listByDemandaId(demandaId) {
  return repository.listByDemandaId(demandaId);
}

export async function createObservacao(demandaId, data) {
  return repository.createObservacao(demandaId, data);
}

export async function updateObservacao(id, data) {
  const updated = await repository.updateObservacao(id, data);
  if (!updated) throw notFound('Observação não encontrada');
  return updated;
}

export async function deleteObservacao(id) {
  const deleted = await repository.deleteObservacao(id);
  if (!deleted) throw notFound('Observação não encontrada');
}
