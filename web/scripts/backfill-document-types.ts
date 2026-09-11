// Belge kuralları (DocumentTypeRule) özelliği eklendiğinde `createSchoolWithDefaults` sadece
// YENİ kurslar için varsayılan 7 türü tohumluyor — bu özellikten önce açılmış kurslar (hem yerel
// hem production) hiç belge türü kuralına sahip değil. Bu script idempotent bir geriye dönük
// doldurma: `npx tsx scripts/backfill-document-types.ts` ile bir kere çalıştırılır, zaten
// kuralı olan kursları atlar. `db:deploy`'un bir parçası değildir, elle çalıştırılır.
import { prisma } from "../src/lib/prisma";
import { DEFAULT_DOCUMENT_TYPES } from "../src/lib/constants";

async function main() {
  const schools = await prisma.school.findMany({ select: { id: true, name: true } });
  let created = 0;
  for (const school of schools) {
    const existing = await prisma.documentTypeRule.count({ where: { schoolId: school.id } });
    if (existing > 0) continue;
    await prisma.documentTypeRule.createMany({
      data: DEFAULT_DOCUMENT_TYPES.map((d, i) => ({ schoolId: school.id, ...d, sortOrder: i })),
    });
    created++;
    console.log(`  + ${school.name}`);
  }
  console.log(`Toplam ${schools.length} kurs, ${created} tanesine belge türü eklendi.`);
  await prisma.$disconnect();
}

main();
