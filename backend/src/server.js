import 'dotenv/config';
import { createApp } from './app.js';
import { runSheetDemandSeed } from './seed/sheetDemandSeed.js';
import { ensureTables } from './config/db.js';

function isTrue(value, defaultValue = false) {
  if (value == null) return defaultValue;
  return String(value).toLowerCase() === 'true';
}

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';
const app = createApp(port);

app.listen(port, host, async () => {
  console.log(`mangertask-backend running on http://${host}:${port}`);

  try {
    console.log('Garantindo tabelas DynamoDB...');
    await ensureTables();

    const shouldRunSeed = isTrue(process.env.DDB_RUN_BOOTSTRAP_SEED, false);

    if (shouldRunSeed) {
      console.log('Executando seed inicial...');
      await runSheetDemandSeed();
    } else {
      console.log('Seed inicial desativado (DDB_RUN_BOOTSTRAP_SEED=false).');
    }

    console.log('Bootstrap do DynamoDB finalizado com sucesso.');
  } catch (error) {
    console.error('Falha no bootstrap do DynamoDB:', error);

    if (error?.name === 'UnrecognizedClientException') {
      console.error(
        'Credenciais inválidas para DynamoDB. Verifique AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e AWS_SESSION_TOKEN (quando aplicável).',
      );
      console.error(
        'Para rodar local com DynamoDB Local, use AWS_ENDPOINT_URL_DYNAMODB=http://localhost:8000 com credenciais "local".',
      );
    }
  }
});
