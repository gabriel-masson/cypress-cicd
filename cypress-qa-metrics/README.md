# Cypress QA Metrics — Mini-projeto de CI/CD para QA

Mini-projeto de exemplo que mostra, do zero, como:

1. Instalar e configurar o Cypress;
2. Escrever testes E2E de exemplo;
3. Gerar relatórios estruturados (Mochawesome);
4. Calcular **métricas de qualidade** (taxa de sucesso, falha, instabilidade/flaky, duração etc.);
5. Rodar tudo automaticamente em uma **pipeline de CI/CD** (GitHub Actions), com um *quality gate* que reprova o build se a qualidade cair abaixo de um limite.

Os testes de exemplo apontam para `https://example.cypress.io`, o site oficial de demonstração do Cypress — então o projeto roda "out of the box", sem precisar de uma aplicação própria.

---

## Estrutura do projeto

```
cypress-qa-metrics/
├── cypress/
│   ├── e2e/
│   │   ├── navigation.cy.js      # testes de navegação
│   │   └── form-actions.cy.js    # testes de formulário/interação
│   ├── support/
│   │   └── e2e.js                # comandos customizados
│   └── reports/                  # gerado automaticamente (git-ignorado)
├── scripts/
│   └── calculate-metrics.js      # calcula as métricas de qualidade
├── .github/workflows/
│   └── ci.yml                    # pipeline de CI/CD
├── cypress.config.js
├── package.json
└── .gitignore
```

---

## Passo a passo — Instalação e execução local

### Pré-requisitos
- [Node.js](https://nodejs.org/) 18 ou superior instalado (`node -v`)
- npm (vem junto com o Node)
- Git

### 1. Criar o projeto e instalar dependências

```bash
mkdir cypress-qa-metrics && cd cypress-qa-metrics
npm init -y
```

Instale o Cypress e as bibliotecas de relatório:

```bash
npm install --save-dev cypress mochawesome mochawesome-merge mochawesome-report-generator
```

> Se você baixou este projeto pronto, basta rodar `npm install` na raiz para instalar tudo de uma vez (usa o `package.json` já incluso).

### 2. Verificar a instalação do Cypress

```bash
npx cypress verify
```

Se aparecer `Verified Cypress!`, está tudo certo.

### 3. Abrir o Cypress no modo interativo (opcional, útil para desenvolvimento)

```bash
npm run cy:open
```

Isso abre a interface gráfica do Cypress, onde você pode escolher e rodar cada teste visualmente, vendo o navegador em tempo real.

### 4. Rodar os testes em modo headless (modo usado na pipeline)

```bash
npm run cy:run
```

Isso executa todos os specs em `cypress/e2e/*.cy.js` sem abrir interface gráfica, e já gera os relatórios JSON do Mochawesome em `cypress/reports/mocha/`.

### 5. Consolidar os relatórios e gerar o HTML

```bash
npm run posttest:merge   # junta os JSONs de cada spec em um único mochawesome.json
npm run posttest:html    # gera um relatório HTML navegável
```

Abra `cypress/reports/report.html` no navegador para ver o relatório visual completo (passou/falhou, stack trace, duração por teste, etc.).

### 6. Calcular as métricas de qualidade

```bash
npm run metrics
```

Isso roda `scripts/calculate-metrics.js`, que lê o `mochawesome.json` consolidado e imprime no terminal (além de salvar em `cypress/reports/quality-metrics.json`):

- **Total de testes**
- **Aprovados / Reprovados / Pulados**
- **Taxa de sucesso (%)**
- **Taxa de falha (%)**
- **Taxa de instabilidade / flaky (%)** — testes que só passaram após retry
- **Duração total e duração média por teste**
- **Teste mais lento**

O script também funciona como **quality gate**: se a taxa de sucesso ficar abaixo de 80% (configurável na constante `MINIMUM_PASS_RATE`), ele encerra com código de erro — o que derruba a pipeline de CI/CD automaticamente.

### 7. Rodar tudo de uma vez

```bash
npm test
```

Executa em sequência: testes → merge de relatórios → relatório HTML → cálculo de métricas.

---

## Passo a passo — Configurar a pipeline de CI/CD (GitHub Actions)

1. Crie um repositório no GitHub e suba o projeto:

   ```bash
   git init
   git add .
   git commit -m "chore: setup inicial do projeto Cypress QA Metrics"
   git branch -M main
   git remote add origin <URL_DO_SEU_REPOSITORIO>
   git push -u origin main
   ```

2. O workflow já está pronto em `.github/workflows/ci.yml`. Ele roda automaticamente:
   - a cada `push` na branch `main`;
   - a cada `pull request` para `main`;
   - manualmente, via aba **Actions → QA CI/CD Pipeline → Run workflow**.

3. O que a pipeline faz, em ordem:
   1. Faz checkout do código;
   2. Configura o Node.js 20 com cache de dependências;
   3. Roda `npm ci` (instalação limpa e reprodutível);
   4. Executa os testes Cypress em modo headless;
   5. Mescla os relatórios Mochawesome;
   6. Gera o relatório HTML;
   7. Calcula as métricas de qualidade (e aplica o quality gate);
   8. Publica os relatórios (JSON + HTML) e as métricas como **artefatos do workflow**, disponíveis para download na aba Actions;
   9. Se algum teste falhar, publica também os screenshots das falhas.

4. Acompanhar os resultados: entre na aba **Actions** do repositório, abra a execução mais recente e baixe o artefato `cypress-qa-reports` para ver o relatório HTML e o `quality-metrics.json`.

---

## Adaptando para o seu projeto real

- Troque `baseUrl` em `cypress.config.js` pela URL da sua aplicação.
- Substitua os specs de exemplo (`navigation.cy.js`, `form-actions.cy.js`) pelos fluxos reais do seu sistema (login, checkout, cadastro, etc.).
- Ajuste `MINIMUM_PASS_RATE` em `scripts/calculate-metrics.js` para o nível de qualidade exigido pelo seu time.
- Se quiser histórico de métricas ao longo do tempo (tendência), publique o `quality-metrics.json` de cada execução em um storage externo (ex.: bucket S3, Google Sheets via API, ou um dashboard como Grafana) em vez de só salvar como artefato do CI.
- Para rodar em paralelo e reduzir tempo de pipeline, considere o [Cypress Cloud](https://docs.cypress.io/guides/cloud/introduction) ou dividir os specs em jobs de matriz no GitHub Actions.

---

## Métricas calculadas — referência rápida

| Métrica | Como é calculada | Por que importa |
|---|---|---|
| Taxa de sucesso | aprovados / total × 100 | Indicador principal de saúde da suíte |
| Taxa de falha | reprovados / total × 100 | Sinaliza regressões |
| Taxa de instabilidade (flaky) | testes que passaram só após retry / total × 100 | Aponta testes não confiáveis, que minam a confiança na suíte |
| Duração total / média | soma e média de `duration` de cada teste | Ajuda a identificar gargalos de performance na suíte |
| Teste mais lento | maior `duration` entre os testes | Prioriza otimização/refatoração |
