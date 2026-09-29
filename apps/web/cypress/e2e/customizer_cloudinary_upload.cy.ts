describe('Customizer Cloudinary Logo Upload Flow', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  it('allows a guest to upload a logo to Cloudinary and renders it on canvas', () => {
    // Intercept Cloudinary upload to verify network request
    cy.intercept('POST', 'https://api.cloudinary.com/**').as('cloudinaryUpload');

    // 1. Visit products catalog
    cy.visit('/products');

    // 2. Wait for loading catalog to finish
    cy.contains('Loading catalog...').should('not.exist');

    // 3. Click the first CUSTOMIZE button
    cy.contains('CUSTOMIZE').first().click();

    // 4. Confirm we are on the customizer page
    cy.url({ timeout: 15000 }).should('include', '/customize');

    // Wait for the dynamic CustomizerCanvas to finish mounting and Fabric to initialize
    cy.contains('Loading Customizer Studio...').should('not.exist');
    cy.get('canvas', { timeout: 15000 }).should('be.visible');

    // 5. Confirm guest header has NO "Signed in as" banner
    cy.contains('Signed in as').should('not.exist');
    cy.contains('Sign In').should('be.visible');

    // 6. Contract test: Verify guest signature response contract from local runtime
    cy.window().then(async (win) => {
      const sigRes = await win.fetch('http://localhost:5000/api/v1/media/guest-signature');
      expect(sigRes.status).to.eq(200);
      const sigData = await sigRes.json();
      expect(sigData.success).to.be.true;
      const { signature, timestamp, apiKey, cloudName, folder } = sigData.data;

      expect(signature).to.be.a('string').and.not.empty;
      expect(apiKey).to.be.a('string').and.not.empty;
      expect(cloudName).to.be.a('string').and.not.empty;
      expect(folder).to.eq('zobbra/designs');
      expect(sigData.data).to.not.have.property('apiSecret');
    });

    // 7. Click the "Logo" tab in the left tool panel
    cy.get('#tab-tool-logo').click();
    cy.contains('Upload artwork').should('be.visible');

    // Verify initial empty state guide is visible
    cy.contains(/Add your logo/).should('be.visible');

    // 8. Perform REAL file upload via the file input using a real image asset
    cy.get('input[type="file"]').selectFile('public/brand/zobbra-logo-white.png', { force: true });

    // 9. Verify POST request reaches Cloudinary and returns 200 with secure_url
    cy.wait('@cloudinaryUpload', { timeout: 30000 }).then((interception) => {
      const status = interception.response?.statusCode;
      const resBody = interception.response?.body;
      expect(status).to.eq(200);
      expect(resBody).to.have.property('secure_url');
      expect(resBody.secure_url).to.include('res.cloudinary.com');
      expect(resBody.secure_url).to.include('zobbra/designs');
    });

    // 10. Verify empty state overlay disappears
    cy.contains(/Add your logo/, { timeout: 15000 }).should('not.exist');

    // 11. Verify the Layers tool shows center and delete controls for the selected element
    cy.get('#tab-tool-layers').click();
    cy.contains('Image selected', { timeout: 15000 }).should('be.visible');
    cy.contains('button', 'Center').should('be.visible');
    cy.contains('button', 'Middle').should('be.visible');
    cy.contains('button', 'Delete').should('be.visible');
  });
});
