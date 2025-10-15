// // Server entry point

const app = require("./app");
const PORT = process.env.BACKEND_PORT;
const IP_ADDRESS = process.env.BACKEND_SERVER_IP || "localhost";


process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception! Application is shutting down!');
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(
    `MU Result Backend is running on http://${IP_ADDRESS} at port: ${PORT}, in ${process.env.NODE_ENV} mode`
  );
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Error! Application is shutting down!');
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED! Application is shutting down!');
  server.close(() => {
    console.log('Process Terminated!');
  });
});