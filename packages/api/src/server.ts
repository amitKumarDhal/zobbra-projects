import app from './app.js';

const PORT = parseInt(process.env.PORT || '5001', 10);

app.listen(PORT, () => {
  console.log(`🚀 Zobra API listening on http://localhost:${PORT}`);
  console.log(`📑 Swagger Documentation available on http://localhost:${PORT}/docs`);
});

