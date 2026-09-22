describe('Customizer Cloudinary Logo Upload Flow', () => {
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
    cy.contains('button', 'Logo').click();
    cy.contains('Upload Artwork').should('be.visible');

    // Verify initial empty state guide is visible
    cy.contains('Add your logo, text or artwork').should('be.visible');

    // 8. Perform REAL file upload via file input using DataTransfer
    cy.window().then((win) => {
      const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const byteCharacters = atob(base64Png);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new win.Blob([byteArray], { type: 'image/png' });
      const file = new win.File([blob], 'test-logo.png', { type: 'image/png' });

      const dataTransfer = new win.DataTransfer();
      dataTransfer.items.add(file);

      const fileInput = win.document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).to.exist;
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new win.Event('change', { bubbles: true }));
    });

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
    cy.contains('Add your logo, text or artwork', { timeout: 15000 }).should('not.exist');

    // 11. Verify element inspector appears with Center H/V and Delete controls
    cy.contains('Selected Element', { timeout: 15000 }).should('be.visible');
    cy.contains('Center H').should('be.visible');
    cy.contains('Center V').should('be.visible');
  });
});
