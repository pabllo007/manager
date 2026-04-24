import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { requestContext } from './middlewares/requestContext.js';
import { errorHandler } from './middlewares/errorHandler.js';
import demandasRoutes from './modules/demandas/routes.js';
import observacoesRoutes from './modules/observacoes/routes.js';
import sistemasRoutes from './modules/sistemas/routes.js';
import desenvolvedoresRoutes from './modules/desenvolvedores/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import healthRoutes from './modules/health/routes.js';
import { createOpenApiSpec } from './docs/openapi.js';

export function createApp(port) {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.options('*', cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(requestContext);

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(createOpenApiSpec(port)));

  app.use(healthRoutes);
  app.use(desenvolvedoresRoutes);
  app.use(sistemasRoutes);
  app.use(dashboardRoutes);
  app.use('/demandas', demandasRoutes);
  app.use(observacoesRoutes);

  app.use(errorHandler);

  return app;
}
