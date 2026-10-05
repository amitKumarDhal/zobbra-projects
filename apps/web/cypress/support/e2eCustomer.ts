/**
 * The shared E2E customer. Kept in its own module so specs can import the data without
 * re-running the command registration in commands.ts.
 */
export const E2E_CUSTOMER = {
  name: 'E2E Customer',
  email: 'e2e-customer@zobra.test',
  phone: '+919000000001',
  companyName: 'E2E Customer Co',
};
