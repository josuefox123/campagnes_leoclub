const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTemplates() {
  const templates = await prisma.template.findMany({
    select: { id: true, name: true, backgroundImage: true }
  });
  console.log(JSON.stringify(templates, null, 2));
}

checkTemplates().catch(console.error).finally(() => prisma.$disconnect());
