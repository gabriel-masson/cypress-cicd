const { defineConfig } = require("cypress");

module.exports = defineConfig({
  reporter: "mochawesome",
  reporterOptions: {
    reportDir: "cypress/reports/mocha",
    overwrite: false,
    html: false,
    json: true,
  },

  // Retries ajudam a medir "flakiness" (testes instáveis) nas métricas
  retries: {
    runMode: 2,
    openMode: 0,
  },

  e2e: {
    baseUrl: "https://example.cypress.io",
    setupNodeEvents(on, config) {
      // espaço para plugins futuros
      return config;
    },
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    video: false,
  },
});
// kk