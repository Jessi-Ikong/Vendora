require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Vendora server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
