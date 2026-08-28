describe("Navegação básica do site de exemplo", () => {
  beforeEach(() => {
    cy.goHome();
  });

  it("deve carregar a página inicial com o título correto", () => {
    cy.title().should("include", "Kitchen Sink");
  });

  it("deve exibir o menu de navegação principal", () => {
    cy.get(".navbar-nav").should("be.visible");
  });

  it("deve navegar até a página de queries", () => {
    cy.contains("Querying").click();
    cy.url().should("include", "/commands/querying");
    cy.get("h1").should("contain", "Querying");
  });

  it("deve navegar até a página de ações", () => {
    cy.contains("Actions").click();
    cy.url().should("include", "/commands/actions");
  });
});
