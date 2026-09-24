describe('Admin Orders Customer Artwork View & Download', () => {
  let adminToken = '';
  const adminUser = {
    id: '6dbdf073-058d-49ad-adb6-3b5d19ac4e3a',
    email: 'admin@zobra.test',
    name: 'Amit Kumar Dhal',
    role: 'ADMIN',
  };

  before(() => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/v1/auth/login',
      body: {
        email: 'admin@zobra.test',
        password: 'admin123',
      },
    }).then((res) => {
      adminToken = res.body.token;
    });
  });

  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.visit('/dashboard/orders', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', adminToken);
        win.localStorage.setItem('zobra_token', adminToken);
        win.localStorage.setItem('user', JSON.stringify(adminUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(adminUser));
      },
    });
    cy.get('table', { timeout: 15000 }).should('be.visible');
    cy.contains('Loading orders...').should('not.exist');
  });

  it('renders Product cell with catalog image and customer artwork chips', () => {
    cy.get('tbody tr').then(($rows) => {
      if ($rows.text().includes('ZQB-ORD-2026-5015')) {
        cy.contains('ZQB-ORD-2026-5015')
          .parents('tr')
          .within(() => {
            cy.get('[data-cy="order-design-assets"]').should('exist');
            cy.get('[data-cy="asset-btn-artwork"]').should('be.visible');
            cy.get('[data-cy="asset-btn-front"]').should('be.visible');
            cy.get('[data-cy="asset-btn-back"]').should('be.visible');
          });
      }
    });
  });

  it('opens preview modal when clicking an artwork thumbnail and displays asset details', () => {
    cy.get('tbody tr').then(($rows) => {
      if ($rows.text().includes('ZQB-ORD-2026-5015')) {
        cy.contains('ZQB-ORD-2026-5015')
          .parents('tr')
          .within(() => {
            cy.get('[data-cy="asset-btn-artwork"]').click();
          });

        cy.get('[data-cy="asset-preview-modal"]').should('be.visible');
        cy.contains('CUSTOMER ARTWORK').should('be.visible');
        cy.get('[data-cy="modal-order-number"]').should('contain', 'ZQB-ORD-2026-5015');
        cy.get('[data-cy="modal-asset-img"]').should('be.visible');
        cy.get('[data-cy="modal-download-btn"]').should('be.visible');
        cy.get('[data-cy="modal-open-tab-link"]').should('have.attr', 'href').and('include', 'res.cloudinary.com');

        cy.get('[data-cy="close-asset-modal"]').click();
        cy.get('[data-cy="asset-preview-modal"]').should('not.exist');
      }
    });
  });

  it('opens preview modal for Front Preview without breaking table state', () => {
    cy.get('tbody tr').then(($rows) => {
      if ($rows.text().includes('ZQB-ORD-2026-5015')) {
        cy.contains('ZQB-ORD-2026-5015')
          .parents('tr')
          .within(() => {
            cy.get('[data-cy="asset-btn-front"]').click();
          });

        cy.get('[data-cy="asset-preview-modal"]').should('be.visible');
        cy.contains('FRONT DESIGN PREVIEW').should('be.visible');
        cy.get('[data-cy="modal-asset-img"]').should('be.visible');

        cy.contains('button', 'Close').click();
        cy.get('[data-cy="asset-preview-modal"]').should('not.exist');
      }
    });
  });

  it('does not display artwork buttons or placeholders for orders without custom artwork', () => {
    cy.get('tbody tr').then(($rows) => {
      if ($rows.text().includes('ZQB-ORD-2026-5014')) {
        cy.contains('ZQB-ORD-2026-5014')
          .parents('tr')
          .within(() => {
            cy.get('[data-cy="order-design-assets"]').should('not.exist');
            cy.contains('Demo Artwork').should('not.exist');
            cy.contains('Sample Logo').should('not.exist');
          });
      }
    });
  });
});
