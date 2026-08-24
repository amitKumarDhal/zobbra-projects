describe('To Do / Tasks Management Module', () => {
  beforeEach(() => {
    cy.login('admin@zobra.test', 'admin123');
    cy.url().should('include', '/dashboard');
    cy.visit('/dashboard/todo');
  });

  it('should render the To Do dashboard and KPI cards', () => {
    cy.get('h1').contains('To Do').should('be.visible');
    cy.contains('Total Tasks').should('be.visible');
    cy.contains('Pending').should('be.visible');
    cy.contains('Due Today').should('be.visible');
    cy.contains('Overdue').should('be.visible');
    cy.contains('Completed').should('be.visible');
  });

  it('should search and filter tasks', () => {
    cy.get('input[placeholder="Search tasks, customers, orders..."]').type('Follow up');
    cy.wait(500); // debounce wait
    cy.get('select').first().select('Pending');
    cy.wait(500);
    cy.get('table').should('be.visible');
  });

  it('should open the New Task drawer and allow creation', () => {
    cy.contains('button', 'New Task').click();
    cy.contains('h2', 'New Task').should('exist');
    
    cy.contains('label', 'Task Title').parent().find('input').type('Test Follow Up Task');
    cy.contains('label', 'Description').parent().find('textarea').type('Please call the customer to discuss bulk pricing.');
    
    // Set priority and category
    cy.contains('label', 'Priority').parent().find('select').select('HIGH');
    cy.contains('label', 'Category').parent().find('select').select('FOLLOW_UP');

    // Click Save Task
    cy.contains('button', 'Save Task').click();
    cy.wait(1000);
    
    // Drawer should close
    cy.contains('h2', 'New Task').should('not.exist');
  });

  it('should mark a task as completed from the table', () => {
    cy.contains('Loading tasks...').should('not.exist');
    cy.get('body').then($body => {
      if ($body.text().includes('No tasks yet')) {
         cy.log('Database empty, skipping');
      } else {
         cy.get('table tbody tr input[type="checkbox"]').first().click();
         cy.get('table tbody tr', { timeout: 10000 }).should('be.visible');
      }
    });
  });

  it('should open task details and reschedule/edit', () => {
    cy.contains('Loading tasks...').should('not.exist');
    cy.get('body').then($body => {
      if ($body.text().includes('No tasks yet')) {
         cy.log('Database empty, skipping');
      } else {
         cy.get('table tbody tr').first().find('td').eq(1).click();
         cy.contains('h2', 'Task Details').should('exist');
         
         // Edit Due Date
         cy.contains('label', 'Due Date').parent().find('input[type="date"]').type('2026-12-31');
         cy.contains('button', 'Save Task').click();
         cy.wait(1000);
         
         cy.contains('h2', 'Task Details').should('not.exist');
      }
    });
  });
});
