-- Reset completo das demandas para recarga da planilha
BEGIN;

TRUNCATE TABLE observacoes, demanda_responsaveis, bloqueios, demandas RESTART IDENTITY CASCADE;

-- Compatibilidade de sistemas
UPDATE demandas
SET sistema = 'Ciclo de Sangue'
WHERE sistema = 'Hemovida';

DELETE FROM sistemas
WHERE nome = 'Hemovida';

COMMIT;

-- Após executar este script, reinicie o backend para que o seed da planilha
-- (backend/src/seed/sheetDemandSeed.js) recarregue os dados automaticamente.
