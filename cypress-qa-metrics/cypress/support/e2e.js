// cypress/support/e2e.js
// Arquivo de suporte carregado antes de cada spec.
// Aqui podem entrar comandos customizados (cy.login, cy.seedDb, etc).

// Exemplo de comando customizado simples, usado nos specs de exemplo
Cypress.Commands.add("goHome", () => {
  cy.visit("/");
});
