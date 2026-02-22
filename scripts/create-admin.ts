// Usage: npx tsx scripts/create-admin.ts
// Requires: DATABASE_URL, BETTER_AUTH_SECRET, ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD in .env.local
// Run once to create the first admin account.
//
// Example:
//   ADMIN_EMAIL=admin@moroczmedical.hu ADMIN_INITIAL_PASSWORD=changeme123 npx tsx scripts/create-admin.ts
//
// Or set the vars in .env.local and run:
//   npx tsx --env-file=.env.local scripts/create-admin.ts

import { auth } from "../src/lib/auth";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email) {
    console.error("Error: ADMIN_EMAIL environment variable is required.");
    console.error("  Set it in .env.local or pass it directly:");
    console.error("  ADMIN_EMAIL=admin@example.com npx tsx scripts/create-admin.ts");
    process.exit(1);
  }

  if (!password) {
    console.error("Error: ADMIN_INITIAL_PASSWORD environment variable is required.");
    console.error("  Set it in .env.local or pass it directly.");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("Error: ADMIN_INITIAL_PASSWORD must be at least 6 characters.");
    process.exit(1);
  }

  console.log(`Creating admin user: ${email}`);

  try {
    const result = await auth.api.createUser({
      body: {
        email,
        password,
        name: "Admin",
        role: "admin",
      },
    });

    console.log("Admin user created successfully!");
    console.log(`  Email: ${email}`);
    console.log(`  Name:  ${(result as { name?: string }).name ?? "Admin"}`);
    console.log(`  Role:  admin`);
    console.log("");
    console.log("Next steps:");
    console.log("  1. Log in at /admin with the above credentials");
    console.log(
      "  2. Change the password after first login (manual step — no self-service reset for admins)",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.toLowerCase().includes("already") || message.toLowerCase().includes("exists")) {
      console.error(`Error: A user with email "${email}" already exists.`);
      console.error("  If you need to reset the admin password, do it directly in the database.");
    } else {
      console.error("Error creating admin user:");
      console.error(" ", message);
    }

    process.exit(1);
  }
}

main();
