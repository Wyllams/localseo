-- Migration: Limpar registros sandbox do GMB
-- Descrição: Remove IDs de sandbox que foram criados antes da aprovação da API real.
-- Isso força os usuários com prefixo "sandbox" a reconectar usando a API oficial.

-- 1. Limpar campos GMB de negócios que usavam sandbox
UPDATE negocios
SET 
  gmb_conta_id = NULL,
  gmb_local_id = NULL,
  g_access_token = NULL,
  g_refresh_token = NULL,
  g_token_expiry = NULL,
  atualizado_em = NOW()
WHERE gmb_conta_id LIKE '%sandbox%'
   OR gmb_local_id LIKE '%sandbox%';

-- 2. Remover avaliações que foram criadas com IDs sandbox (dados fictícios)
DELETE FROM avaliacoes
WHERE google_review_id LIKE '%sandbox%';

-- 3. Remover execuções de agente com resultado sandbox
DELETE FROM execucoes_agente
WHERE resultado::text LIKE '%sandbox%';
