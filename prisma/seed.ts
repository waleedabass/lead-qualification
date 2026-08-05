import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const sqliteUrl = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: sqliteUrl }) });

const ACCOUNT_EXECUTIVES = [
  { name: "Dana Okafor", email: "dana.okafor@vantagesecurity.example", territory: "US-West" },
  { name: "Marcus Bell", email: "marcus.bell@vantagesecurity.example", territory: "US-East" },
  { name: "Sofia Ranieri", email: "sofia.ranieri@vantagesecurity.example", territory: "EMEA" },
  { name: "Kenji Watanabe", email: "kenji.watanabe@vantagesecurity.example", territory: "APAC" },
];

async function main() {
  for (const ae of ACCOUNT_EXECUTIVES) {
    const existing = await db.accountExecutive.findFirst({ where: { email: ae.email } });
    if (existing) {
      console.log(`skipping ${ae.name} — already seeded`);
      continue;
    }
    await db.accountExecutive.create({ data: ae });
    console.log(`seeded AE ${ae.name} (${ae.territory})`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
