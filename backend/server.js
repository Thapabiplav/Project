const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log("Server is running on port " + PORT);
      console.log("Environment: " + (process.env.NODE_ENV || "development"));
      console.log("Database tables are ready.");
    });
  } catch (err) {
    console.error("Database connection or sync failed:", err.message);
    process.exit(1);
  }
}

start();
