// Prisma CLI sarmalayıcı: yerel şema motorunu sabitler ve ağ doğrulamasını kapatır.
// (Bazı ağlarda `prisma` komutu motor doğrulaması sırasında askıda kalıyor.)
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const enginesDir = path.dirname(require.resolve("@prisma/engines/package.json"));
const platform = `${process.platform}-${process.arch === "arm64" ? "arm64" : "x64"}`;
const candidates = [`schema-engine-${platform}`, `schema-engine-${platform}-openssl-3.0.x`, `schema-engine-${platform}-openssl-1.1.x`];
const engine = candidates.map((c) => path.join(enginesDir, c)).find((p) => existsSync(p));

const env = { ...process.env, CHECKPOINT_DISABLE: "1", PRISMA_HIDE_UPDATE_MESSAGE: "1", PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: "1" };
// CLI açılışta bir ağ isteği yapıp bazı ağlarda sonsuza kadar bekliyor; yerelde ağı kapalı bir vekile yönlendirip hızlı düşmesini sağla.
// (Railway'de PRISMA_OFFLINE=0 ile devre dışı; orada motor indirmesi gerekebilir.)
if (process.env.PRISMA_OFFLINE !== "0" && !process.env.RAILWAY_ENVIRONMENT) { env.HTTPS_PROXY = "http://127.0.0.1:9"; env.HTTP_PROXY = "http://127.0.0.1:9"; env.NO_PROXY = ""; }
if (engine) env.PRISMA_SCHEMA_ENGINE_BINARY = engine;

const child = spawn(process.execPath, [require.resolve("prisma/build/index.js"), ...process.argv.slice(2)], { stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 1));
