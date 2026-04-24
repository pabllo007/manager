# Revisão técnica de arquitetura (Frontend + Backend)

## Contexto analisado

- Frontend React Native/Expo com tipagem TypeScript.
- Backend Node.js + Express + PostgreSQL.
- Banco inicializado via `database/init.sql`.

---

## Diagnóstico executivo

O projeto está em um bom ponto de MVP: já separa telas/componentes no frontend e já suporta CRUD completo de demandas e observações no backend. Porém, ainda há forte acoplamento nas camadas, ausência de validação robusta, pouca padronização de erros/contratos e riscos de manutenção conforme o sistema crescer.

### Principais riscos atuais

1. **Back-end monolítico em um único arquivo (`server.js`)**: difícil escalar manutenção e testes.
2. **Modelo de domínio duplicado/inconsistente**: `responsavel_id` e tabela `demanda_responsaveis` coexistem; pode gerar divergência.
3. **Ausência de validação de entrada** no backend (payloads sem schema runtime).
4. **Camada de API do frontend inconsistente** (`fetchJson` vs chamadas diretas de `fetch` sem validar HTTP status).
5. **Falta de testes automatizados e observabilidade** (sem logs estruturados, métricas, correlação de erros).
6. **Enums de domínio hardcoded no frontend** sem ser derivados da API.

---

## Bugs e problemas técnicos identificados

## 1) Exclusão no frontend não valida resposta HTTP

Na API do frontend, `deleteDemanda` e `deleteObservacao` usam `fetch` direto e não verificam `response.ok`. Em falha 4xx/5xx, a UI pode assumir sucesso indevidamente.

**Impacto:** inconsistência visual e falsa confirmação de exclusão.

**Correção sugerida:** padronizar tudo em `fetchJson` (ou `fetchVoid`) com tratamento uniforme de erro.

---

## 2) Healthcheck pode derrubar o endpoint em erro de banco

`GET /health` executa query sem `try/catch`. Se o banco cair, cai no middleware global com 500 genérico (ok), porém sem semântica adequada para readiness/liveness.

**Impacto:** monitoramento menos preciso e troubleshooting mais lento.

**Correção sugerida:** retornar payload estruturado (`status`, `db`, `timestamp`) e separar readiness/liveness.

---

## 3) Risco de inconsistência de modelo de responsável

A tabela `demandas` mantém `responsavel_id` enquanto a relação N:N fica em `demanda_responsaveis`. Hoje o backend escreve ambos.

**Impacto:** dupla fonte de verdade.

**Correção sugerida:**
- opção A: manter só N:N e remover `responsavel_id`;
- opção B: manter `responsavel_principal_id` explicitamente (semântica clara).

---

## 4) Falta de validação de payload na borda

Rotas de criação/edição aceitam dados sem validação formal de formato (ex.: datas, status inválido, percentual fora da faixa antes do DB).

**Impacto:** erros tardios no banco, mensagens ruins para cliente e maior custo de suporte.

**Correção sugerida:** usar schema validation (Zod/Joi/Yup) no backend e responder 400 com campo/causa.

---

## 5) Acoplamento de regras na camada de transporte

SQL, regras de negócio e HTTP estão misturados em handlers Express.

**Impacto:** baixa testabilidade unitária e aumento da complexidade por endpoint.

**Correção sugerida:** separar em camadas:
- `routes` (HTTP);
- `controllers` (orquestração);
- `services` (regras);
- `repositories` (persistência SQL).

---

## 6) Dados mestres hardcoded no frontend

Listas como sistemas/status estão definidas em arrays estáticos no app.

**Impacto:** divergência entre frontend e backend ao longo do tempo.

**Correção sugerida:** expor catálogos no backend (`/catalogs/status`, `/catalogs/sistemas`) e consumir no app.

---

## Melhorias de arquitetura para manutenção

## A) Arquitetura alvo (incremental)

### Backend

- Estrutura por módulos de domínio:
  - `src/modules/demandas/*`
  - `src/modules/observacoes/*`
  - `src/modules/sistemas/*`
  - `src/modules/desenvolvedores/*`
- Camadas:
  - **route**: valida request/response
  - **controller**: conversão DTO ↔ caso de uso
  - **service/use-case**: regra de negócio
  - **repository**: queries parametrizadas
- Contratos:
  - DTOs versionados e validação runtime
  - erros padronizados (`code`, `message`, `details`, `traceId`)
- Infra:
  - logger estruturado (pino/winston)
  - middleware de correlação (`x-request-id`)
  - timeout e retry em integrações externas (quando houver)

### Frontend

- Separar por feature:
  - `src/features/dashboard/*`
  - `src/features/demandas/*`
  - `src/features/sistemas/*`
- Criar camada de dados:
  - `src/lib/httpClient.ts`
  - `src/features/*/api.ts`
  - hooks de consulta/mutação (React Query, por exemplo)
- Formulários:
  - schema validation (Zod + react-hook-form)
- Estado:
  - estado de servidor (cache) separado do estado de UI local

---

## B) Priorização prática (plano de 90 dias)

## Fase 1 (1-2 semanas) — **estabilização**

1. Padronizar cliente HTTP frontend (corrigir deletes).
2. Adicionar validação de payload no backend.
3. Melhorar tratamento de erro e mensagens de API.
4. Criar testes mínimos de contrato para CRUD de demandas/observações.

## Fase 2 (3-6 semanas) — **modularização**

1. Quebrar `server.js` por módulos/camadas.
2. Extrair repositórios SQL e serviços.
3. Consolidar modelo de responsável (decidir estratégia única).

## Fase 3 (7-12 semanas) — **escalabilidade**

1. Observabilidade (logs estruturados + métricas).
2. Versionamento de API (`/v1`).
3. Catálogo dinâmico de enums + cache frontend.
4. CI com lint + testes + typecheck.

---

## Recomendações de qualidade e governança

1. **Definition of Done**:
   - endpoint novo só entra com teste de integração.
   - alteração de schema exige migration versionada.
2. **Padrão de commits e changelog** (conventional commits).
3. **ADR (Architecture Decision Records)** para decisões críticas (ex.: modelo de responsáveis).
4. **Code owners** por módulos para revisão mais rápida.

---

## Roadmap de evoluções funcionais sugeridas

1. Histórico de mudanças de demanda (auditoria de campos).
2. SLA por status e alertas de atraso de previsão.
3. Notificações (e-mail/Teams) ao mudar estado.
4. Filtro avançado com paginação server-side.
5. RBAC (perfis: gestor, desenvolvedor, leitura).

---

## Métricas de sucesso (para validar melhoria)

- Lead time de mudança (deploy de feature) reduzido.
- Taxa de erro 5xx por endpoint reduzida.
- Cobertura de testes backend/frontend crescente.
- Tempo médio para corrigir incidente (MTTR) reduzido.

---

## Conclusão

O produto já cumpre o papel de MVP funcional, mas a arquitetura atual tende a gerar custo de manutenção crescente. O melhor retorno imediato virá de **padronização de validação/erros**, **desacoplamento do backend por camadas** e **uniformização da camada de dados no frontend**. Com isso, o projeto ganha previsibilidade para evoluir novas funcionalidades sem regressões frequentes.
