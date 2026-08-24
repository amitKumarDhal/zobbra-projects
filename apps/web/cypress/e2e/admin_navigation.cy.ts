describe('ZOBBRA Admin Navigation E2E', () => {
  it('verifies all admin sidebar navigation modules are accessible', () => {
    // 1. Visit /dashboard
    cy.login('admin@zobra.test', 'admin123');
    cy.visit('/dashboard');
    cy.get('aside').should('be.visible');

    // 2. Verify all admin modules exist in sidebar
    const modules = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Inquiry', url: '/dashboard/inquiries' },
      { name: 'Quote', url: '/dashboard/quotes' },
      { name: 'Order', url: '/dashboard/orders' },
      { name: 'Customers', url: '/dashboard/customers' },
      { name: 'Products', url: '/dashboard/products' },
      { name: 'To Do', url: '/dashboard/todo' },
      { name: 'Report', url: '/dashboard/reports' },
      { name: 'Settings', url: '/dashboard/settings' },
    ];

    modules.forEach((mod) => {
      cy.get('aside').contains(mod.name).should('be.visible');
    });

    // 3. Test navigating through key modules
    cy.get('aside a[href="/dashboard/products"]').click();
    cy.location('pathname', { timeout: 10000 }).should('include', '/dashboard/products');

    cy.get('aside a[href="/dashboard/todo"]').click();
    cy.location('pathname', { timeout: 10000 }).should('include', '/dashboard/todo');

    cy.get('aside a[href="/dashboard/reports"]').click();
    cy.location('pathname', { timeout: 10000 }).should('include', '/dashboard/reports');

    cy.get('aside a[href="/dashboard"]').first().click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');

    // 4. Verify no uncaught application errors occur
    cy.contains(/uncaught|application error/i).should('not.exist');
  });
});
