import { app } from './app.js';

const PORT = 8003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`fit api listening on 0.0.0.0:${PORT}`);
});
