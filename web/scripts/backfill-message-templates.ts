// Mesaj şablonları (MessageTemplateRule) özelliği eklendiğinde `createSchoolWithDefaults`
// sadece YENİ kurslar için varsayılan 6 şablonu tohumluyor — bu özellikten önce açılmış kurslar
// hiç şablon kuralına sahip değil. İdempotent: `npx tsx scripts/backfill-message-templates.ts`,
// zaten şablonu olan kursları atlar. `db:deploy`'un bir parçası değildir, elle çalıştırılır.
import { prisma } from "../src/lib/prisma";
import { DEFAULT_MESSAGE_TEMPLATES } from "../src/lib/constants";

async function main() {
  const schools = await prisma.school.findMany({ select: { id: true, name: true } });
  let created = 0;
  for (const school of schools) {
    const existing = await prisma.messageTemplateRule.count({ where: { schoolId: school.id } });
    if (existing > 0) continue;
    await prisma.messageTemplateRule.createMany({
      data: DEFAULT_MESSAGE_TEMPLATES.map((m, i) => ({ schoolId: school.id, ...m, sortOrder: i })),
    });
    created++;
    console.log(`  + ${school.name}`);
  }
  console.log(`Toplam ${schools.length} kurs, ${created} tanesine mesaj şablonu eklendi.`);
  await prisma.$disconnect();
}

main();
