import { Pool } from "pg";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { randomUUID } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL!;

interface CsvRow {
  "First name": string;
  Email: string;
  PHONE: string;
  "LAST APPOINTMENT": string;
}

function parseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: "", lastName: "" };

  // Check if name contains hyphen (compound first name)
  const parts = trimmed.split(" ");

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  // Check first part for hyphen (compound first name like "Anna-Mária")
  if (parts[0].includes("-")) {
    // x-y z = x-y is first name, z is last name
    // x-y z a = x-y is first name, z and a both last names
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");
    return { firstName, lastName };
  }

  // x y = x is first name, y is last name
  // x y z = x is first name, y and z both last names
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

function formatPhone(phone: string): string {
  if (!phone) return "";

  // Handle scientific notation (3.58403E+11)
  let phoneStr = phone;
  if (phone.includes("E+") || phone.includes("e+")) {
    const num = parseFloat(phone);
    phoneStr = Math.round(num).toString();
  }

  // Remove any non-digit characters except +
  phoneStr = phoneStr.replace(/[^\d+]/g, "");

  // Add + prefix if not present
  if (!phoneStr.startsWith("+")) {
    phoneStr = "+" + phoneStr;
  }

  return phoneStr;
}

function parseAppointmentDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "-") return null;

  // Parse mm/dd/yyyy format
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;

  return new Date(year, month - 1, day);
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: npx tsx scripts/import-customers.ts <csv-file>");
    process.exit(1);
  }

  const csvContent = readFileSync(csvPath, "utf-8");
  // Remove BOM if present
  const cleanContent = csvContent.replace(/^\uFEFF/, "");

  const records: CsvRow[] = parse(cleanContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Found ${records.length} customers to import`);

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  try {
    for (const row of records) {
      const email = row.Email?.toLowerCase().trim();
      if (!email) {
        console.log(`Skipping row without email: ${row["First name"]}`);
        skipped++;
        continue;
      }

      // Check if user already exists
      const existing = await client.query(
        'SELECT id FROM "user" WHERE LOWER(email) = $1',
        [email]
      );

      const { firstName, lastName } = parseName(row["First name"]);
      const phone = formatPhone(row.PHONE);
      const lastAppointment = parseAppointmentDate(row["LAST APPOINTMENT"]);
      const now = new Date();

      if (existing.rows.length > 0) {
        // Update existing user
        await client.query(
          `UPDATE "user" SET
            first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            phone_number = COALESCE($3, phone_number),
            last_appointment = COALESCE($4, last_appointment),
            updated_at = $5
          WHERE LOWER(email) = $6`,
          [
            firstName || null,
            lastName || null,
            phone || null,
            lastAppointment,
            now,
            email,
          ]
        );
        console.log(`Updated: ${email}`);
      } else {
        // Insert new user
        const id = randomUUID();
        const name = `${firstName} ${lastName}`.trim();

        try {
          await client.query(
            `INSERT INTO "user" (
              id, name, email, email_verified, created_at, updated_at,
              first_name, last_name, phone_number, last_appointment, role
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              id,
              name,
              email,
              false,
              now,
              now,
              firstName || null,
              lastName || null,
              phone || null,
              lastAppointment,
              "user",
            ]
          );
          console.log(`Imported: ${email}`);
        } catch (err: any) {
          if (err.code === "23505") {
            // Duplicate key
            console.log(`Duplicate email (skipping): ${email}`);
            skipped++;
            continue;
          }
          throw err;
        }
      }

      imported++;
    }

    console.log(`\nDone! Imported/Updated: ${imported}, Skipped: ${skipped}, Errors: ${errors}`);
  } catch (err) {
    console.error("Error:", err);
    errors++;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
