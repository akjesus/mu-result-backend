// // Server entry point

const app = require("./app");
const PORT = process.env.BACKEND_PORT;
const IP_ADDRESS = process.env.BACKEND_SERVER_IP || "localhost";

app.listen(PORT, IP_ADDRESS, () => {
  console.log(`Backend Server is running on http://${IP_ADDRESS}:${PORT}`);
});