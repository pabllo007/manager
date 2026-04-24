import * as repository from './repository.js';
import { notFound } from '../../utils/httpError.js';

export async function listDemandas(filters) {
  return repository.listDemandas(filters);
}

export async function createDemanda(input) {
  return repository.createDemanda(input);
}

export async function updateDemanda(id, input) {
  const updated = await repository.updateDemanda(id, input);
  if (!updated) throw notFound('Demanda não encontrada');
  return updated;
}

export async function deleteDemanda(id) {
  const deleted = await repository.deleteDemanda(id);
  if (!deleted) throw notFound('Demanda não encontrada');
}
