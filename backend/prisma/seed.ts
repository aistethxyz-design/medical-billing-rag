import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const practice = await prisma.practice.upsert({
    where: { taxId: 'ON-ER-001' },
    update: {},
    create: {
      name: 'Toronto General ER',
      taxId: 'ON-ER-001',
      address: '200 Elizabeth St',
      city: 'Toronto',
      state: 'ON',
      zipCode: 'M5G 2C4',
      phone: '416-340-3111',
      specialties: JSON.stringify(['Emergency Medicine']),
    },
  });

  const passwordHash = await bcrypt.hash('Demo123!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@aisteth.com' },
    update: {},
    create: {
      email: 'demo@aisteth.com',
      password: passwordHash,
      firstName: 'Mehul',
      lastName: 'Patel',
      role: 'PROVIDER',
      practiceId: practice.id,
      npi: '1234567890',
      specialty: 'Ontario',
    },
  });

  const patient = await prisma.patient.upsert({
    where: { patientId: 'PAT-DEMO-001' },
    update: {},
    create: { patientId: 'PAT-DEMO-001', ageRange: '35-44', gender: 'M' },
  });

  const encounter = await prisma.encounter.upsert({
    where: { id: 'enc-demo-001' },
    update: {},
    create: {
      id: 'enc-demo-001',
      practiceId: practice.id,
      providerId: user.id,
      patientId: patient.id,
      date: new Date(),
      type: 'EMERGENCY',
      status: 'PENDING',
      chiefComplaint: 'Chest pain, rule-out ACS',
    },
  });

  const optimizations = [
    { originalCode: 'H102', suggestedCode: 'H152', potentialGain: 26.1, status: 'PENDING' },
    { originalCode: 'A003', suggestedCode: 'A004', potentialGain: 45.0, status: 'PENDING' },
    { originalCode: 'H101', suggestedCode: 'H152', potentialGain: 48.3, status: 'APPROVED' },
  ];

  for (const [i, opt] of optimizations.entries()) {
    await prisma.codeOptimization.upsert({
      where: { id: `opt-demo-${i + 1}` },
      update: {},
      create: {
        id: `opt-demo-${i + 1}`,
        encounterId: encounter.id,
        providerId: user.id,
        type: 'UPCODE',
        originalCode: opt.originalCode,
        suggestedCode: opt.suggestedCode,
        reason: 'Higher-acuity assessment supported by documentation',
        potentialGain: opt.potentialGain,
        status: opt.status,
        approved: opt.status === 'APPROVED',
      },
    });
  }

  console.log('Seeded demo user: demo@aisteth.com / Demo123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
