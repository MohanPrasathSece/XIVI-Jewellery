import { createApp } from "../src/server/app.js";
import { connectToDatabase } from "../src/server/db.js";

let serverlessApp;

const getApp = async () => {
  if (!serverlessApp) {
    await connectToDatabase();
    serverlessApp = createApp();
  }
  return serverlessApp;
};

export default async function handler(req, res) {
  const app = await getApp();
  app(req, res);
}
