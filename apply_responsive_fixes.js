#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'apps/web/src/app/dashboard/coupons/page.tsx',
  'apps/web/src/app/dashboard/customers/page.tsx',
  'apps/web/src/app/dashboard/inquiries/page.tsx',
  'apps/web/src/app/dashboard/orders/page.tsx',
  'apps/web/src/app/dashboard/payments/page.tsx',
  'apps/web/src/app/dashboard/products/page.tsx',
  'apps/web/src/app/dashboard/quotes/page.tsx',
  'apps/web/src/app/dashboard/testimonials/page.tsx',
  'apps/web/src/app/dashboard/todo/page.tsx',
  'apps/web/src/app/dashboard/page.tsx',
  'apps/web/src/app/dashboard/quotes/[id]/page.tsx',
  'apps/web/src/app/customer/invoices/page.tsx',
  'apps/web/src/app/customer/orders/page.tsx',
  'apps/web/src/app/customer/quotes/page.tsx',
  'apps/web/src/app/customer/create-quote/page.tsx',
];

let fixedCount = 0;
let errorCount = 0;

files.forEach((filePath) => {
  const fullPath = path.join('C:\\Zobra', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`✗ NOT FOUND: ${filePath}`);
    errorCount++;
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf-8');
    let originalContent = content;

    // Fix 1: Replace overflow-x-auto with table-scroll (only for table containers)
    content = content.replace(
      /(<div className="overflow-x-auto[^"]*">\s*<table)/g,
      (match) => {
        // Only replace if it's a table container
        if (match.includes('table')) {
          return match.replace('overflow-x-auto', 'table-scroll');
        }
        return match;
      }
    );

    // Fix 2: Remove min-w-[200px] from search input containers
    content = content.replace(
      /className="relative flex-1 min-w-\[200px\]/g,
      'className="relative flex-1'
    );

    // Fix 3: Add responsive flex wrapping to toolbar (if not already done)
    content = content.replace(
      /flex flex-wrap gap-3 justify-between items-center bg-\[#FDFDFD\]/g,
      'flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-between items-stretch sm:items-center bg-[#FDFDFD]'
    );

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`✓ FIXED: ${filePath}`);
      fixedCount++;
    } else {
      console.log(`- NO CHANGES NEEDED: ${filePath}`);
    }
  } catch (err) {
    console.log(`✗ ERROR: ${filePath} - ${err.message}`);
    errorCount++;
  }
});

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Fixed: ${fixedCount}`);
console.log(`Errors: ${errorCount}`);
console.log(`Total: ${files.length}`);
