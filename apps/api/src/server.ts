import "dotenv/config";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";

const env = loadEnv();
const app = await createApp({ env });

app.listen(env.PORT);
