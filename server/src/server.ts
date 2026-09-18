import { config } from './config/env';
import app from './app';

app.listen(config.port, () => {
  console.log(`Cake Box API is running on port ${config.port}`);
});
