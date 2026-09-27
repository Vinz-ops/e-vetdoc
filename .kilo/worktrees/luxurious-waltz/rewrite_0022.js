const fs = require('fs');
const content = fs.readFileSync('db/migrations/0022_tricky_vulcan.sql', 'utf8');

const keep = [
    "CREATE TYPE \"public\".\"invoice_status\"",
    "CREATE TYPE \"public\".\"payment_method\"",
    "CREATE TABLE \"invoice_items\"",
    "CREATE TABLE \"invoices\"",
    "CREATE TABLE \"payment_corrections\"",
    "CREATE TABLE \"payments\"",
    "ALTER TABLE \"invoice_items\"",
    "ALTER TABLE \"invoices\"",
    "ALTER TABLE \"payment_corrections\"",
    "ALTER TABLE \"payments\"",
    "CREATE UNIQUE INDEX" // wait, there might be other unique indexes? "unique_pet_owner"
];

const statements = content.split('--> statement-breakpoint');
const newStatements = statements.map(s => s.trim()).filter(s => {
    if (!s) return false;
    if (s.includes('"public"."invoice_status"')) return true;
    if (s.includes('"public"."payment_method"')) return true;
    if (s.startsWith('CREATE TABLE "invoice_items"')) return true;
    if (s.startsWith('CREATE TABLE "invoices"')) return true;
    if (s.startsWith('CREATE TABLE "payment_corrections"')) return true;
    if (s.startsWith('CREATE TABLE "payments"')) return true;
    if (s.startsWith('ALTER TABLE "invoice_items"')) return true;
    if (s.startsWith('ALTER TABLE "invoices"')) return true;
    if (s.startsWith('ALTER TABLE "payment_corrections"')) return true;
    if (s.startsWith('ALTER TABLE "payments"')) return true;
    return false;
});

fs.writeFileSync('db/migrations/0022_tricky_vulcan.sql', newStatements.join(';\n--> statement-breakpoint\n') + ';\n');
console.log('Rewrote 0022_tricky_vulcan.sql. Statements kept: ' + newStatements.length);
