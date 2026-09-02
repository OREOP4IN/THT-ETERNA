import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🚀 StockFlow Server running at http://localhost:${env.PORT}`);
  console.log(`📖 Swagger API Documentation available at http://localhost:${env.PORT}/api/docs`);
  console.log(`🩺 Health check at http://localhost:${env.PORT}/api/health`);
});
