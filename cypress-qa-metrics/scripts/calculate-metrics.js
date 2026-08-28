/**
 * calculate-metrics.js
 *
 * Lê o relatório consolidado do Mochawesome (cypress/reports/mochawesome.json)
 * gerado após a execução dos testes e calcula as principais métricas de
 * qualidade de QA:
 *
 *  - Total de testes executados
 *  - Testes aprovados / reprovados / pulados
 *  - Taxa de sucesso (Pass Rate %)
 *  - Taxa de falha (Fail Rate %)
 *  - Duração total e duração média por teste
 *  - Teste mais lento
 *  - Índice de instabilidade (Flaky Rate) - testes que só passaram após retry
 *
 * O resultado é impresso no console e salvo em cypress/reports/quality-metrics.json,
 * podendo ser consumido por dashboards, badges ou pela pipeline de CI/CD.
 */

const fs = require("fs");
const path = require("path");

const REPORT_PATH = path.join(
  __dirname,
  "..",
  "cypress",
  "reports",
  "mochawesome.json"
);
const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "cypress",
  "reports",
  "quality-metrics.json"
);

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

if (!fs.existsSync(REPORT_PATH)) {
  fail(
    `Relatório não encontrado em ${REPORT_PATH}. Rode "npm run test" (ou os passos cy:run + posttest:merge) antes de calcular as métricas.`
  );
}

const raw = fs.readFileSync(REPORT_PATH, "utf-8");
const report = JSON.parse(raw);

// Percorre recursivamente todas as "suites" coletando os testes individuais
function collectTests(suite, acc = []) {
  if (suite.tests && suite.tests.length) {
    acc.push(...suite.tests);
  }
  if (suite.suites && suite.suites.length) {
    suite.suites.forEach((child) => collectTests(child, acc));
  }
  return acc;
}

let allTests = [];
(report.results || []).forEach((resultFile) => {
  allTests.push(...collectTests(resultFile));
});

const total = allTests.length;
if (total === 0) {
  fail("Nenhum teste encontrado no relatório. Verifique a execução do Cypress.");
}

const passed = allTests.filter((t) => t.state === "passed").length;
const failed = allTests.filter((t) => t.state === "failed").length;
const skipped = allTests.filter((t) => t.pending || t.skipped).length;

// Um teste é considerado "flaky" quando teve tentativas extras (retries)
// registradas mas terminou passando.
const flaky = allTests.filter(
  (t) => t.state === "passed" && Array.isArray(t.retries) && t.retries.length > 0
).length;

const durations = allTests.map((t) => t.duration || 0);
const totalDuration = durations.reduce((sum, d) => sum + d, 0);
const avgDuration = total > 0 ? totalDuration / total : 0;

const slowest = allTests.reduce(
  (max, t) => ((t.duration || 0) > (max.duration || 0) ? t : max),
  allTests[0]
);

const pct = (part, whole) => (whole === 0 ? 0 : Number(((part / whole) * 100).toFixed(2)));

const metrics = {
  geradoEm: new Date().toISOString(),
  totalTestes: total,
  aprovados: passed,
  reprovados: failed,
  pulados: skipped,
  taxaDeSucesso: `${pct(passed, total)}%`,
  taxaDeFalha: `${pct(failed, total)}%`,
  taxaDeInstabilidade: `${pct(flaky, total)}% (${flaky} teste(s) flaky)`,
  duracaoTotalMs: totalDuration,
  duracaoMediaMs: Number(avgDuration.toFixed(2)),
  testeMaisLento: {
    titulo: slowest ? slowest.fullTitle : null,
    duracaoMs: slowest ? slowest.duration : null,
  },
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(metrics, null, 2));

console.log("\n📊 Métricas de Qualidade — Cypress QA\n");
console.log(`Total de testes:        ${metrics.totalTestes}`);
console.log(`Aprovados:              ${metrics.aprovados}`);
console.log(`Reprovados:             ${metrics.reprovados}`);
console.log(`Pulados:                ${metrics.pulados}`);
console.log(`Taxa de sucesso:        ${metrics.taxaDeSucesso}`);
console.log(`Taxa de falha:          ${metrics.taxaDeFalha}`);
console.log(`Taxa de instabilidade:  ${metrics.taxaDeInstabilidade}`);
console.log(`Duração total:          ${metrics.duracaoTotalMs} ms`);
console.log(`Duração média/teste:    ${metrics.duracaoMediaMs} ms`);
console.log(
  `Teste mais lento:       ${metrics.testeMaisLento.titulo} (${metrics.testeMaisLento.duracaoMs} ms)`
);
console.log(`\n✅ Relatório salvo em: ${OUTPUT_PATH}\n`);

// Critério de qualidade (quality gate) simples: falha o processo/pipeline
// se a taxa de sucesso ficar abaixo de 80%.
const MINIMUM_PASS_RATE = 80;
if (pct(passed, total) < MINIMUM_PASS_RATE) {
  fail(
    `Taxa de sucesso (${pct(passed, total)}%) abaixo do mínimo exigido (${MINIMUM_PASS_RATE}%). Pipeline reprovada pelo quality gate.`
  );
}
