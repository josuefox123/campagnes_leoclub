const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCoordinates() {
  const templates = await prisma.template.findMany({
    select: { id: true, name: true, photoX: true, photoY: true, photoWidth: true, photoHeight: true }
  });
  console.log(JSON.stringify(templates, null, 2));
}

checkCoordinates().catch(console.error).finally(() => prisma.$disconnect());
