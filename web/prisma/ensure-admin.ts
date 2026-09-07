/**
 * Süper admin hesabının var olduğundan emin olur — `db:seed`'in aksine hiçbir tabloyu
 * silmez/yeniden yazmaz, production'da her deploy'da güvenle çalışır. `db:seed` yalnızca
 * yerel/demo ortamı için: production'a demo okulları/kursiyerleri yazmamak için hiç
 * çalıştırılmıyor — ama süper admin hesabını yaratan TEK yer de seed.ts'ydi, bu yüzden
 * production ilk açılışta hiç giriş yapılamaz durumdaydı. Bu script o boşluğu kapatır.
 *
 * SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD tanımlı değilse sessizce hiçbir şey yapmaz —
 * rastgele şifreyle kimsenin giremeyeceği bir hesap yaratmak yerine, açıkça uyarır.
 * O e-postayla zaten bir kullanıcı varsa (SUPER_ADMIN da olsa) DOKUNULMAZ — şifreyi
 * her boot'ta .env'e göre sıfırlamak, ileride eklenecek bir "şifremi değiştir" akışını
 * sessizce geçersiz kılardı.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("[ensure-admin] SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD tanımlı değil, atlanıyor.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[ensure-admin] ${email} zaten var (rol: ${existing.role}), dokunulmadı.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 11);
  await prisma.user.create({ data: { email, passwordHash, name: "Süper Admin", role: "SUPER_ADMIN" } });
  console.log(`[ensure-admin] Süper admin oluşturuldu: ${email}`);
}

main()
  .catch((e) => { console.error("[ensure-admin] hata:", e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
