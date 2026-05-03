import { PrismaStore } from "../src/store/prismaStore.js";

const store = new PrismaStore();

await store.seedDefaultSourcePolicies();
console.log("Seeded default source policies");
