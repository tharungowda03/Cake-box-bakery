import dotenv from 'dotenv';
import app from './app';

dotenv.config({ path: '../.env' }); // Load from root if possible

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Cake Box API is running on port ${PORT}`);
});
