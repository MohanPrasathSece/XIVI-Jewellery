import { createApp } from "../src/server/app.js";

let serverlessApp;

const getApp = async () => {
  if (!serverlessApp) {
    serverlessApp = createApp();
  }
  return serverlessApp;
};

export default async function handler(req, res) {
  const app = await getApp();
  app(req, res);
}
