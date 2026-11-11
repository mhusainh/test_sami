/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("@test_sami123", 10);

  await prisma.admin_users.upsert({
    where: { username: "hrd" },
    update: {},
    create: {
      username: "hrd",
      password_hash: passwordHash,
      name: "HRD Admin",
    },
  });

  const stageCount = await prisma.application_stages.count();
  if (stageCount === 0) {
    const defaults = [
      { name: "DIKIRIM", order: 1, is_terminal: false },
      { name: "PSIKOTEST", order: 2, is_terminal: false },
      { name: "WAWANCARA", order: 3, is_terminal: false },
      { name: "DITERIMA", order: 4, is_terminal: true },
    ];
    for (const s of defaults) {
      await prisma.application_stages.create({ data: s });
    }
  }

  const jobCount = await prisma.lowongan.count();
  if (jobCount === 0) {
    await prisma.lowongan.createMany({
      data: [
        {
          code: "opt",
          title: "Operator (OPT)",
          placement: "SAMI Jepara",
          qualification:
            "- Wanita SMA/SMK\n- Usia minimal 18 tahun\n- Usia maksimal 30 tahun\n- Tinggi badan minimal 146 cm",
          period: "202505",
          is_active: true,
          sort_order: 1,
        },
        {
          code: "difable",
          title: "Penyandang Disabilitas (Difable)",
          placement: "SAMI Jepara",
          qualification:
            "- Pria/Wanita minimal SMA/SMK\n- Usia minimal 18 tahun\n- Usia maksimal 30 tahun\n- Memiliki kebutuhan khusus (Disabilitas)",
          period: "202505",
          is_active: true,
          sort_order: 2,
        },
      ],
    });
  }

  console.log("Seed selesai: admin hrd, 4 tahap default, 2 lowongan contoh.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
