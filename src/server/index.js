import dotenv from "dotenv";

import { createApp } from "./app.js";
import { initMaintenanceScheduler } from "./utils/maintenance.js";

dotenv.config();

const port = process.env.PORT || 4000;

const start = async () => {
  try {
    const app = createApp();
    initMaintenanceScheduler();

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

// Only start the server when running this file directly.
if (process.env.VERCEL !== "1") {
  start();
}

export default start;
