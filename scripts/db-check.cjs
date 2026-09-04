const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const rows = await p.$queryRawUnsafe(`
    SELECT e.domain, s.timestamp, a.wordCount, a.linkCount, a.domNodes,
           a.textCommerce, d.minimalism, d.informationDensity, d.mobileFocus
    FROM Snapshot s
    JOIN Entity e ON s.entityId = e.id
    JOIN Analysis a ON a.snapshotId = s.id
    JOIN Dna d ON d.analysisId = a.id
  `);
  console.log(JSON.stringify(rows, null, 1));
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
