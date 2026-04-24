-- mangertask - esquema atualizado

CREATE TABLE IF NOT EXISTS desenvolvedores (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(180) NOT NULL,
  email VARCHAR(180) UNIQUE,
  equipe VARCHAR(40) NOT NULL CHECK (equipe IN ('PHP', 'Java')),
  perfil_contrato VARCHAR(80),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sistemas (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(120) UNIQUE NOT NULL,
  equipe VARCHAR(40) NOT NULL,
  gerente_relacionamento VARCHAR(180),
  gerente_tecnico VARCHAR(180),
  ponto_focal VARCHAR(180)
);

CREATE TABLE IF NOT EXISTS demandas (
  id BIGSERIAL PRIMARY KEY,
  demanda_readmine VARCHAR(50) UNIQUE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  sistema VARCHAR(120) NOT NULL,
  responsavel_id BIGINT REFERENCES desenvolvedores(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('NÃO INICIADO', 'EM ANDAMENTO', 'HOMOLOGAÇÃO', 'CONCLUÍDO')),
  percentual_desenvolvimento SMALLINT NOT NULL DEFAULT 0 CHECK (percentual_desenvolvimento BETWEEN 0 AND 100),
  previsao_entrega DATE,
  chamados_atuais TEXT,
  situacao_atual TEXT,
  acoes_necessarias TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS observacoes (
  id BIGSERIAL PRIMARY KEY,
  demanda_id BIGINT NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
  autor VARCHAR(120),
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demanda_responsaveis (
  demanda_id BIGINT NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
  desenvolvedor_id BIGINT NOT NULL REFERENCES desenvolvedores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (demanda_id, desenvolvedor_id)
);

CREATE TABLE IF NOT EXISTS bloqueios (
  id BIGSERIAL PRIMARY KEY,
  demanda_id BIGINT NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
  chamado_externo VARCHAR(80),
  descricao TEXT NOT NULL,
  severidade VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (severidade IN ('baixa', 'media', 'alta', 'critica')),
  status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'resolvido')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_demandas_sistema ON demandas(sistema);
CREATE INDEX IF NOT EXISTS idx_demandas_status ON demandas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_responsavel ON demandas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_observacoes_demanda ON observacoes(demanda_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demanda_resp_dev ON demanda_responsaveis(desenvolvedor_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_demandas_updated_at ON demandas;
CREATE TRIGGER trg_demandas_updated_at
BEFORE UPDATE ON demandas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();



-- compatibilidade de schema: renomeia coluna antiga codigo -> demanda_readmine (quando necessário)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'demandas' AND column_name = 'codigo'
  ) THEN
    ALTER TABLE demandas RENAME COLUMN codigo TO demanda_readmine;
  END IF;
END $$;

-- Demanda READMINE agora é opcional
ALTER TABLE demandas
  ALTER COLUMN demanda_readmine DROP NOT NULL;

INSERT INTO sistemas (nome, equipe, gerente_relacionamento, gerente_tecnico, ponto_focal)
VALUES
  ('Ciclo de Sangue', 'PHP', 'Ricardo Aragão / Lescar', 'Ediney / Donizete', 'Jorge Olímpio'),
  ('Coagulopatias', 'PHP', 'Ricardo Aragão / Lescar', 'Ediney / Donizete', 'Wesley Brito'),
  ('Hemoglobinopatias', 'PHP', 'Ricardo Aragão / Lescar', 'Ediney / Donizete', 'Matheus Silva'),
  ('GSM-NAT', 'Java', 'Ricardo Aragão / Lescar', 'Ediney / Donizete', 'Diego Quintino Lima'),
  ('Hemovida', 'PHP', 'Ricardo Aragão / Lescar', 'Ediney / Donizete', 'Equipe Hemovida')
ON CONFLICT (nome) DO NOTHING;


-- compatibilidade: Hemovida foi incorporado ao Ciclo de Sangue
UPDATE demandas
SET sistema = 'Ciclo de Sangue'
WHERE sistema = 'Hemovida';

DELETE FROM sistemas
WHERE nome = 'Hemovida';

INSERT INTO desenvolvedores (nome, email, equipe, perfil_contrato)
VALUES
  ('Alex de Almeida Pereira', 'alex.almeida@saude.gov.br', 'PHP', 'An. Desenv. Pleno'),
  ('Milton Ferreira dos Santos Junior', 'milton.ferreira@saude.gov.br', 'PHP', 'An. Desenv. Pleno'),
  ('Otávio Rodrigues', 'otavio.rodrigues@saude.gov.br', 'PHP', 'An. Desenv. Pleno'),
  ('Juliano Pires', 'juliano.pires@saude.gov.br', 'PHP', 'An. Desenv. Junior'),
  ('Marilúcia Cardozo de Queiroz', 'marilucia.queiroz@saude.gov.br', 'PHP', 'An. Desenv. Junior'),
  ('Guilherme Peres Fonseca', 'guilherme.fonseca@saude.gov.br', 'PHP', 'An. Desenv. Junior'),
  ('Pablo Raphael Queiroz de Andrade', 'pablo.andrade@saude.gov.br', 'Java', 'An. Desenv. Senior'),
  ('Deivdy William Silva', 'deivdy.silva@saude.gov.br', 'Java', 'An. Desenv. Pleno'),
  ('João Gabriel Kreimer Torres', 'joao.kreimer@saude.gov.br', 'Java', 'An. Desenv. Junior')
ON CONFLICT (email) DO NOTHING;

-- Carga de demandas é feita pelo seed de aplicação (backend/src/seed/sheetDemandSeed.js).
