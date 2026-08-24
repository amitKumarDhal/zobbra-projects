describe('Authentication Flows', () => {
  beforeEach(() => {
    // Clear tokens before each test to ensure a clean state
    cy.clearLocalStorage();
  });

  it('verifies the login page design and validation', () => {
    cy.visit('/login');
    cy.contains('Sign in to manage your Zobra account.').should('be.visible');
    cy.contains('WEAR YOUR BRAND').should('exist');
    
    // Invalid submission
    cy.get('[data-cy="login-submit-button"]').click();
    cy.contains('Please enter your email and password').should('be.visible');
  });

  it('fails with invalid credentials', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('invalid@zobra.com');
    cy.get('[data-cy="password-input"]').type('wrongpassword');
    cy.get('[data-cy="login-submit-button"]').click();
    
    cy.contains('Invalid credentials').should('be.visible');
  });

  it('successfully logs in an admin and redirects to dashboard', () => {
    cy.visit('/login');
    cy.get('[data-cy="login-autofill-admin"]').click();
    cy.get('[data-cy="login-submit-button"]').click();
    
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.get('aside', { timeout: 8000 }).should('be.visible');
  });

  it('successfully logs in a customer and redirects to customer portal', () => {
    cy.visit('/login');
    // Using default seeded customer A
    cy.get('[data-cy="email-input"]').type('customer@zobra.test');
    cy.get('[data-cy="password-input"]').type('customer123');
    cy.get('[data-cy="login-submit-button"]').click();
    
    cy.url().should('include', '/customer');
    cy.contains('Welcome').should('exist');
  });

  it('prevents customer from accessing admin dashboard', () => {
    cy.visit('/login');
    cy.get('[data-cy="login-autofill-customer"]').click();
    cy.get('[data-cy="login-submit-button"]').click();
    
    cy.url().should('include', '/customer');
    
    // Force navigate to admin
    cy.visit('/dashboard');
    
    // The current access control (in AdminSidebar or Navbar) will either bounce them to /login or show unauthorized. 
    // Here we ensure they don't see admin stuff. We'll wait for redirect to login.
    cy.url().should('include', '/login');
  });

  it('registers a new customer successfully', () => {
    cy.visit('/register');
    
    const uniqueEmail = `test-user-${Date.now()}@test.com`;
    
    cy.get('[data-cy="register-name"]').type('Test Customer');
    cy.get('[data-cy="register-company"]').type('Test Corp');
    cy.get('[data-cy="register-email"]').type(uniqueEmail);
    cy.get('[data-cy="register-phone"]').type('+91 9999999999');
    cy.get('[data-cy="register-password"]').type('secure123');
    cy.get('[data-cy="register-confirm-password"]').type('secure123');
    cy.get('[data-cy="register-city"]').type('Pune');
    cy.get('[data-cy="register-state"]').type('Maharashtra');
    
    // Agree to terms
    cy.contains('I agree to the').click();
    
    cy.get('[data-cy="register-submit-button"]').click();
    
    // Should auto-login and redirect to customer portal
    cy.url().should('include', '/customer');
  });

  it('handles duplicate email registration gracefully', () => {
    cy.visit('/register');
    
    // Attempt to register with the seeded customer email
    cy.get('[data-cy="register-name"]').type('Duplicate Customer');
    cy.get('[data-cy="register-company"]').type('Duplicate Corp');
    cy.get('[data-cy="register-email"]').type('customer@zobra.test');
    cy.get('[data-cy="register-phone"]').type('+91 9999999999');
    cy.get('[data-cy="register-password"]').type('secure123');
    cy.get('[data-cy="register-confirm-password"]').type('secure123');
    cy.get('[data-cy="register-city"]').type('Pune');
    cy.get('[data-cy="register-state"]').type('Maharashtra');
    
    cy.contains('I agree to the').click();
    
    cy.get('[data-cy="register-submit-button"]').click();
    
    // Should show error
    cy.contains('User already exists').should('be.visible');
  });

  it('tests forgot password ui', () => {
    cy.visit('/forgot-password');
    cy.get('[data-cy="forgot-email"]').type('test@zobra.com');
    cy.get('[data-cy="forgot-submit-button"]').click();
    cy.contains('Check your email').should('be.visible');
  });
});
