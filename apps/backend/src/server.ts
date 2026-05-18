import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/", async () => {
  return { message: "API running 🚀" };
});

await app.listen({
  port: Number(process.env.PORT ?? 3333),
  host: "0.0.0.0",
});
