import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: { name: "Wanderlust Travel" },
  });

  const [downtown, airport] = await Promise.all([
    prisma.branch.create({
      data: { organizationId: org.id, name: "Downtown Branch", location: "123 Main St" },
    }),
    prisma.branch.create({
      data: { organizationId: org.id, name: "Airport Branch", location: "Terminal 2, Airport Rd" },
    }),
  ]);

  const [ownerPass, employeePass] = await Promise.all([
    hashPassword("owner123"),
    hashPassword("employee123"),
  ]);

  await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: null,
      name: "Kaiser (Owner)",
      email: "owner@wanderlust.test",
      passwordHash: ownerPass,
      role: "OWNER",
    },
  });

  const alice = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: downtown.id,
      name: "Alice Agent",
      email: "alice@wanderlust.test",
      passwordHash: employeePass,
      role: "EMPLOYEE",
    },
  });

  const bob = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: airport.id,
      name: "Bob Agent",
      email: "bob@wanderlust.test",
      passwordHash: employeePass,
      role: "EMPLOYEE",
    },
  });

  await prisma.sale.createMany({
    data: [
      {
        organizationId: org.id,
        branchId: downtown.id,
        employeeId: alice.id,
        createdById: alice.id,
        passengerName: "John Smith",
        pnr: "ABC123",
        airline: "Emirates",
        origin: "DAC",
        destination: "DXB",
        travelDate: new Date("2026-09-15"),
        salePrice: 850.0,
        costPrice: 700.0,
        paymentStatus: "PAID",
        customerPhone: "+8801700000001",
        saleDate: new Date(),
        status: "ISSUED",
        source: "MANUAL",
      },
      {
        organizationId: org.id,
        branchId: airport.id,
        employeeId: bob.id,
        createdById: bob.id,
        passengerName: "Jane Doe",
        pnr: "XYZ789",
        airline: "Qatar Airways",
        origin: "DAC",
        destination: "DOH",
        travelDate: new Date("2026-10-01"),
        salePrice: 620.0,
        costPrice: 540.0,
        paymentStatus: "DUE",
        customerEmail: "jane@example.com",
        saleDate: new Date(),
        status: "ISSUED",
        source: "MANUAL",
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Owner login:    owner@wanderlust.test / owner123");
  console.log("Employee login: alice@wanderlust.test / employee123 (Downtown)");
  console.log("Employee login: bob@wanderlust.test / employee123 (Airport)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
