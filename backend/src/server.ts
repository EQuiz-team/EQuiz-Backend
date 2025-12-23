import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 EQuizz Backend Server is running:`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
});