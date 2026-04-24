export type Sistema = 'Hemoglobinopatias' | 'Coagulopatias' | 'Ciclo de Sangue' | 'GSM-NAT' | 'Hemovida';
export type Status = 'NÃO INICIADO' | 'EM ANDAMENTO' | 'HOMOLOGAÇÃO' | 'CONCLUÍDO';

export type Demanda = {
  id: number;
  demanda_readmine?: string | null;
  titulo: string;
  descricao?: string | null;
  sistema: Sistema;
  responsavel_ids: number[];
  responsavel_nomes?: string | null;
  status: Status;
  percentual_desenvolvimento: number;
  previsao_entrega?: string | null;
  chamados_atuais?: string | null;
  situacao_atual?: string | null;
  acoes_necessarias?: string | null;
};

export type Desenvolvedor = { id: number; nome: string; equipe: string };

export type SistemaInfo = {
  id: number;
  nome: string;
  equipe: string;
  gerente_relacionamento: string;
  gerente_tecnico: string;
  ponto_focal: string;
};

export type DevWorkload = {
  id: number;
  nome: string;
  total_demandas: number;
  nao_iniciado: number;
  em_andamento: number;
  homologacao: number;
  concluido: number;
  total_demandas_lista?: { id: number; demanda_readmine?: string | null; titulo: string }[];
  nao_iniciado_lista?: { id: number; demanda_readmine?: string | null; titulo: string }[];
  em_andamento_lista?: { id: number; demanda_readmine?: string | null; titulo: string }[];
  homologacao_lista?: { id: number; demanda_readmine?: string | null; titulo: string }[];
  concluido_lista?: { id: number; demanda_readmine?: string | null; titulo: string }[];
};

export type Observacao = {
  id: number;
  demanda_id: number;
  autor: string;
  texto: string;
  created_at: string;
};
