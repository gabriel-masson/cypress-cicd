describe("Interações de formulário (página Actions)", () => {
  beforeEach(() => {
    cy.visit("/commands/actions");
  });

  it("deve digitar em um campo de texto", () => {
    cy.get(".action-email")
      .type("qa.metrics@example.com")
      .should("have.value", "qa.metrics@example.com");
  });

  it("deve marcar um checkbox por proximidade", () => {
    cy.get(".action-checkboxes [type='checkbox']")
      .first()
      .check()
      .should("be.checked");
  });

  it("deve limpar um campo de texto", () => {
    cy.get(".action-clearable").type("texto temporário").clear();
    cy.get(".action-clearable").should("have.value", "");
  });

  // Teste propositalmente instável (usa retries do cypress.config.js)
  // para demonstrar como a métrica de "flakiness" é capturada no relatório.
  it("deve interagir com slider (sensível a timing)", () => {
    cy.get(".action-slider .ui-slider-handle")
      .trigger("mousedown", { which: 1 })
      .trigger("mousemove", { pageX: 600 })
      .trigger("mouseup");
  });
});
