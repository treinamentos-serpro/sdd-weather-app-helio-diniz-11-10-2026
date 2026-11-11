# Backlog de Tarefas — Weather App

Tarefas derivadas de [weather-app-plan.md](../plans/weather-app-plan.md) e rastreadas à especificação em [weather-app-spec.md](../specs/weather-app-spec.md). A ordem segue o fluxo de implementação; tarefas sem dependência direta podem avançar em paralelo.

## Entrega 1 — Tipos

### T-01 — Definir os tipos compartilhados do domínio
- **Descrição:** Criar os modelos normalizados de cidade, clima, previsão, unidade, erro e estado assíncrono.
- **Critérios de aceite:** Os tipos representam os contratos da seção Data Model do plano; campos possivelmente ausentes aceitam `null` ou são opcionais conforme o contrato; o projeto compila em TypeScript strict.
- **Dependências:** —
- **Arquivos prováveis:** `src/types/weather.ts`
- **Tipo:** Data

## Entrega 2 — Funções puras

### T-02 — Implementar conversão e formatação de temperatura
- **Descrição:** Criar funções puras para converter e arredondar temperaturas sem alterar os valores originais em Celsius.
- **Critérios de aceite:** Converte 0 °C em 32 °F, 25 °C em 77 °F e −40 °C em −40 °F; empates arredondam para longe de zero; valores nulos permanecem indisponíveis.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Tipo:** Data

### T-03 — Implementar formatação de datas e horários locais
- **Descrição:** Criar funções puras para formatar datas em dd/mm/aaaa e horários usando o fuso IANA do local.
- **Critérios de aceite:** Formata usando o fuso recebido, sem recorrer ao fuso do dispositivo; fuso ou data inválidos/ausentes resultam em indicação de indisponibilidade, não em horário presumido.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/date.ts`
- **Tipo:** Data

### T-04 — Mapear códigos meteorológicos WMO
- **Descrição:** Mapear códigos WMO conhecidos para descrição e identificador de ícone apropriados à interface em pt-BR.
- **Critérios de aceite:** Os códigos usados pela Open-Meteo têm descrição e ícone; código desconhecido ou nulo tem fallback explícito sem inventar condição.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/weatherCode.ts`
- **Tipo:** Data

## Entrega 3 — Services

### T-05 — Implementar busca de cidades no geocoding
- **Descrição:** Criar a chamada de geocoding com termo codificado, limite e idioma definidos no plano, normalizando resultados válidos.
- **Critérios de aceite:** Envia somente após submissão explícita; usa HTTPS e codifica caracteres especiais; descarta coordenadas inválidas; preserva metadados opcionais; vazio retorna lista vazia e falhas são convertidas em `WeatherError`.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/services/openMeteo.ts`
- **Tipo:** Data

### T-06 — Implementar consulta de clima atual
- **Descrição:** Consultar e normalizar a seção atual com coordenadas da cidade, unidades de entrada esperadas e fuso automático.
- **Critérios de aceite:** Mapeia temperatura, sensação térmica, umidade, vento, código e horário; campos ausentes ficam nulos; resposta inválida, HTTP não-2xx, falha de rede e timeout geram erros tipados recuperáveis.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/services/openMeteo.ts`
- **Tipo:** Data

### T-07 — Implementar consulta de previsão
- **Descrição:** Consultar e normalizar a seção diária para até cinco dias locais, sem completar dados ausentes.
- **Critérios de aceite:** Mapeia data, código, mínima, máxima e probabilidade; valida datas e comprimentos dos arrays; preserva ordem cronológica; marca previsão com menos de cinco dias como incompleta e não duplica dias.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/services/openMeteo.ts`
- **Tipo:** Data

## Entrega 4 — Hooks

### T-08 — Implementar hook de busca e seleção de cidade
- **Descrição:** Criar `useWeatherSearch` para submissão, estados da busca, resultados, seleção e retry.
- **Critérios de aceite:** Controla `idle`, `loading`, `empty`, `success` e `error`; trim de espaços é aplicado antes da chamada; busca vazia não chama service; retry repete somente geocoding; resposta antiga não substitui busca mais recente.
- **Dependências:** T-01, T-05
- **Arquivos prováveis:** `src/hooks/useWeatherSearch.ts`
- **Tipo:** Data

### T-09 — Implementar hook de clima atual e previsão
- **Descrição:** Criar `useWeather` com estados e retry independentes para clima atual e previsão.
- **Critérios de aceite:** Seleção inicia ambas as consultas; troca de cidade não exibe dados anteriores como atuais; respostas obsoletas são ignoradas e requisições anteriores são abortadas quando possível; falha/retry de uma seção não invalida a outra.
- **Dependências:** T-01, T-06, T-07
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data

## Entrega 5 — Componentes

### T-10 — Implementar busca acessível de cidades
- **Descrição:** Criar o campo de busca e a lista de resultados com seleção por teclado, clique e toque.
- **Critérios de aceite:** Busca ocorre apenas ao enviar; termo vazio mostra validação e mantém foco sem chamar o service; itens mostram nome e metadados disponíveis; homônimos com mesmo rótulo incluem coordenadas; resultados são operáveis por teclado; a interface informa que o termo enviado é processado pelo geocoding.
- **Dependências:** T-08
- **Arquivos prováveis:** `src/components/CitySearch.tsx`
- **Tipo:** UI

### T-11 — Implementar apresentação do clima atual
- **Descrição:** Exibir identificação da cidade, observação e campos meteorológicos atuais.
- **Critérios de aceite:** Mostra temperatura, condição, sensação térmica, umidade, vento e horário local; dados ausentes são indicados como indisponíveis; unidade e conversões são recebidas por props, sem lógica de API no componente.
- **Dependências:** T-02, T-03, T-04, T-09
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Tipo:** UI

### T-12 — Implementar apresentação da previsão diária
- **Descrição:** Exibir dias em ordem cronológica com os dados e estados de previsão.
- **Critérios de aceite:** Cada dia mostra data, condição, mínima, máxima e probabilidade de precipitação ou indisponibilidade explícita; previsão incompleta é identificada sem adicionar dias.
- **Dependências:** T-02, T-03, T-04, T-09
- **Arquivos prováveis:** `src/components/Forecast.tsx`
- **Tipo:** UI

### T-13 — Implementar controle acessível de unidade
- **Descrição:** Criar controle para alternar Celsius/Fahrenheit, com seleção textual ou estado acessível equivalente.
- **Critérios de aceite:** Começa em Celsius; alterna por teclado e toque; estado selecionado não depende apenas de cor; a alteração não dispara requisições.
- **Dependências:** T-02
- **Arquivos prováveis:** `src/components/TemperatureUnitToggle.tsx`
- **Tipo:** UI

### T-14 — Implementar estado visual de carregamento
- **Descrição:** Criar o componente de apresentação para operações em andamento.
- **Critérios de aceite:** O estado é comunicável por tecnologia assistiva, usa texto em pt-BR e não apresenta dados antigos como atuais.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/components/LoadingState.tsx`
- **Tipo:** UI

### T-15 — Implementar estado visual de erro
- **Descrição:** Criar o componente de erro com mensagem e ação de retry fornecidas por props.
- **Critérios de aceite:** Mensagem e ação têm nomes acessíveis; retry é acionável por teclado e toque; o componente não decide qual operação repetir.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/components/ErrorState.tsx`
- **Tipo:** UI

### T-16 — Implementar estado visual vazio
- **Descrição:** Criar o componente para busca concluída sem resultados.
- **Critérios de aceite:** Exibe mensagem explicativa em pt-BR e orienta revisar o termo, sem exibir resultados ou dados meteorológicos inexistentes.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/components/EmptyState.tsx`
- **Tipo:** UI

## Entrega 6 — Integração

### T-17 — Integrar shell inicial, busca e seleção
- **Descrição:** Compor em `App` a primeira fatia executável: busca, resultados, seleção e estados de feedback, sem esperar pela integração meteorológica.
- **Critérios de aceite:** A aplicação apresenta o campo de busca, permite enviar um termo, exibe resultados/estados e permite selecionar um local; textos em pt-BR e ações essenciais operáveis por teclado e toque.
- **Dependências:** T-08, T-10, T-14, T-15, T-16
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI

### T-39 — Integrar clima atual, previsão e unidade
- **Descrição:** Completar a composição de `App` ligando a cidade selecionada às consultas meteorológicas, aos componentes de clima/previsão e ao controle de unidade.
- **Critérios de aceite:** Após selecionar um local, clima atual e previsão aparecem com estados e retry independentes; alternar unidade atualiza todas as temperaturas sem nova requisição; layout atende à largura máxima e nenhuma ação essencial depende de hover.
- **Dependências:** T-02, T-03, T-04, T-09, T-11, T-12, T-13, T-17
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI

## Entrega 7 — Testes

### T-18 — Testar conversão de unidade
- **Descrição:** Cobrir com testes unitários a conversão de Celsius para Fahrenheit e o arredondamento de temperaturas exibidas.
- **Critérios de aceite:** Testes verificam 0 °C = 32 °F, 25 °C = 77 °F, −40 °C = −40 °F, empates positivos e negativos arredondados para longe de zero e valores nulos sem conversão.
- **Dependências:** T-02
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`
- **Tipo:** Test

### T-19 — Testar formatação de datas e horários
- **Descrição:** Cobrir formatação de datas e horários com testes unitários sem rede.
- **Critérios de aceite:** Testes cobrem fuso diferente do dispositivo, data inválida e fuso ausente ou inválido.
- **Dependências:** T-03
- **Arquivos prováveis:** `tests/unit/date.test.ts`
- **Tipo:** Test

### T-20 — Testar mapeamento de códigos WMO
- **Descrição:** Cobrir o mapeamento de condições meteorológicas com testes unitários sem rede.
- **Critérios de aceite:** Testes cobrem códigos conhecidos, desconhecidos e nulos, incluindo o fallback explícito.
- **Dependências:** T-04
- **Arquivos prováveis:** `tests/unit/weatherCode.test.ts`
- **Tipo:** Test

### T-21 — Testar services com mock de `fetch`
- **Descrição:** Validar URLs, parâmetros, normalização e falhas de geocoding, clima atual e previsão substituindo `fetch` por mocks determinísticos.
- **Critérios de aceite:** Cobertura inclui sucesso completo e parcial, busca vazia, coordenadas inválidas, HTTP não-2xx, erro de rede, JSON inválido, timeout de 10 s e previsão curta; nenhum teste acessa a rede e mocks/timers são restaurados após cada teste.
- **Dependências:** T-05, T-06, T-07
- **Arquivos prováveis:** `tests/unit/openMeteo.test.ts`
- **Tipo:** Test

### T-22 — Testar hook de busca e seleção
- **Descrição:** Verificar transições de estado, trim, retry e concorrência de `useWeatherSearch` com services simulados.
- **Critérios de aceite:** Testes cobrem busca vazia sem chamada e respostas fora de ordem, confirmando que a operação mais recente prevalece.
- **Dependências:** T-08
- **Arquivos prováveis:** `tests/unit/useWeatherSearch.test.ts`
- **Tipo:** Test

### T-23 — Testar hook de clima e previsão
- **Descrição:** Verificar estados independentes, troca de cidade e retry de `useWeather` com services simulados.
- **Critérios de aceite:** Testes cobrem respostas obsoletas e retry isolado; o sucesso de uma seção é preservado quando a outra falha.
- **Dependências:** T-09
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`
- **Tipo:** Test

### T-24 — Testar busca e seleção na interface
- **Descrição:** Cobrir interações e acessibilidade do componente de busca com Testing Library e `user-event`.
- **Critérios de aceite:** Testes cobrem envio explícito, termo vazio, foco, seleção por teclado, metadados dos resultados e aviso sobre o envio do termo; controles têm nomes acessíveis.
- **Dependências:** T-10
- **Arquivos prováveis:** `tests/components/CitySearch.test.tsx`
- **Tipo:** Test

### T-25 — Testar apresentação de clima atual e previsão
- **Descrição:** Cobrir renderização e estados dos componentes meteorológicos.
- **Critérios de aceite:** Testes verificam dados disponíveis e ausentes, unidade recebida por props e indicação de previsão incompleta sem dias inventados.
- **Dependências:** T-11, T-12
- **Arquivos prováveis:** `tests/components/WeatherView.test.tsx`
- **Tipo:** Test

### T-26 — Testar controle de unidade
- **Descrição:** Cobrir alternância acessível e comportamento do controle de temperatura.
- **Critérios de aceite:** Testes cobrem alternância por interação, estado selecionado anunciado e temperaturas consistentes sem nova chamada de dados.
- **Dependências:** T-13
- **Arquivos prováveis:** `tests/components/TemperatureUnitToggle.test.tsx`
- **Tipo:** Test

### T-27 — Testar componentes nos estados loading, erro e vazio
- **Descrição:** Cobrir com testes de componente os componentes de feedback de carregamento, erro e busca sem resultados.
- **Critérios de aceite:** Testes verificam indicador e mensagem de loading, mensagem acessível de erro e acionamento do callback de retry, além da mensagem e orientação do estado vazio; cada estado é renderizado isoladamente.
- **Dependências:** T-14, T-15, T-16
- **Arquivos prováveis:** `tests/components/FeedbackStates.test.tsx`
- **Tipo:** Test

### T-28 — Testar composição e estados da aplicação
- **Descrição:** Verificar a integração dos estados de feedback e os retries na aplicação composta.
- **Critérios de aceite:** Testes cobrem os estados visíveis na aplicação, retry independente e preservação de uma seção bem-sucedida quando a outra falha; controles têm nomes acessíveis.
- **Dependências:** T-27, T-39
- **Arquivos prováveis:** `tests/components/App.test.tsx`
- **Tipo:** Test

### T-29 — Testar fluxo principal com E2E em viewport mobile
- **Descrição:** Cobrir em Playwright o fluxo completo de busca, seleção, consulta meteorológica e alternância de unidade, com APIs interceptadas por fixtures.
- **Critérios de aceite:** Em viewport de 360 px, o usuário conclui busca, seleção, leitura do clima atual e dos cinco dias e alternância de unidade sem rolagem horizontal; alternar unidade não faz nova requisição e, após reload, a unidade volta a Celsius.
- **Dependências:** T-39
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test

### T-30 — Testar falhas e concorrência com E2E
- **Descrição:** Cobrir estados vazios, recuperação de erros e troca rápida de cidade no navegador.
- **Critérios de aceite:** Testes cobrem busca vazia e sem resultados, retry, falha independente, previsão parcial e prevalência da cidade selecionada mais recentemente.
- **Dependências:** T-29
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test

### T-31 — Validar responsividade com E2E
- **Descrição:** Verificar fluxo e legibilidade nas larguras definidas pela spec, incluindo a execução principal em mobile.
- **Critérios de aceite:** Em 360 px não há rolagem horizontal e os cinco dias permanecem legíveis; alvos de toque têm ao menos 44 × 44 px; 390, 768 e 1280 px não apresentam quebra; em 1280 px o conteúdo centralizado não excede 1200 px.
- **Dependências:** T-29
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test

## Entrega 8 — Hardening e validação de lançamento

### T-32 — Validar acessibilidade
- **Descrição:** Executar verificações automatizadas e manuais de acessibilidade dos fluxos principais.
- **Critérios de aceite:** Fluxos principais são operáveis por teclado, têm foco visível, nomes acessíveis e erros associados; auditoria não encontra violações críticas/graves; contraste atende WCAG 2.2 AA.
- **Dependências:** T-28, T-29
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`, `docs/validation-results.md`
- **Tipo:** Test

### T-33 — Validar compatibilidade entre navegadores
- **Descrição:** Executar o fluxo principal na matriz de navegadores exigida pela spec.
- **Critérios de aceite:** O fluxo principal é validado nas versões estáveis atuais de Chrome, Safari, Firefox e Edge; falhas e versões testadas ficam registradas.
- **Dependências:** T-29
- **Arquivos prováveis:** `playwright.config.ts`, `docs/validation-results.md`
- **Tipo:** Test

### T-34 — Medir desempenho
- **Descrição:** Registrar o desempenho do fluxo de busca e consulta sob rede 4G simulada.
- **Critérios de aceite:** Em 100 execuções, p95 de resultados utilizáveis é de até 2 s; método, ambiente e resultados ficam registrados.
- **Dependências:** T-29
- **Arquivos prováveis:** `docs/validation-results.md`
- **Tipo:** Infra

### T-35 — Validar usabilidade
- **Descrição:** Conduzir e registrar o teste moderado de usabilidade previsto na spec.
- **Critérios de aceite:** O teste inclui ao menos três participantes; tarefas, observações e problemas encontrados ficam registrados.
- **Dependências:** T-29
- **Arquivos prováveis:** `docs/validation-results.md`
- **Tipo:** Infra

### T-36 — Revisar privacidade e tratamento de entrada
- **Descrição:** Registrar a validação de privacidade do fluxo de busca e alternância de unidade.
- **Critérios de aceite:** Caracteres especiais são tratados como texto; termos e locais não são persistidos; a interface informa o envio do termo ao geocoding; alternar unidade não gera request.
- **Dependências:** T-10, T-29
- **Arquivos prováveis:** `docs/validation-results.md`
- **Tipo:** Infra

### T-37 — Confirmar condições de uso do provedor
- **Descrição:** Verificar limites, termos, cobertura e exigências de atribuição da Open-Meteo como gate de lançamento.
- **Critérios de aceite:** Decisão e fonte consultada ficam registradas; atribuição exigida é apresentada na interface; limitações de cobertura/uso são documentadas antes do lançamento.
- **Dependências:** T-05, T-06, T-07
- **Arquivos prováveis:** `docs/validation-results.md`, `src/App.tsx`
- **Tipo:** Infra

### T-38 — Executar gates de qualidade do projeto
- **Descrição:** Rodar os comandos de lint, build e testes definidos pelo repositório após as entregas de código.
- **Critérios de aceite:** `pnpm lint`, `pnpm build` e `pnpm test` concluem sem falhas; `pnpm test:e2e` também passa após a configuração e execução dos testes Playwright; resultados são registrados junto às validações de entrega.
- **Dependências:** T-18, T-19, T-20, T-21, T-22, T-23, T-24, T-25, T-26, T-27, T-28, T-29, T-30, T-31, T-32, T-33, T-34, T-35, T-36, T-37, T-39
- **Arquivos prováveis:** `docs/validation-results.md`
- **Tipo:** Infra

## Rastreabilidade

| Requisito da spec | Tarefas de implementação | Tarefas de verificação | Cobertura / lacunas |
| --- | --- | --- | --- |
| RF1 — Buscar cidades (CA-RF1-1 a CA-RF1-6) | T-05, T-08, T-10, T-17 | T-21, T-22, T-24, T-29, T-30 | Coberto: envio explícito, trim, metadados, homônimos, seleção e estado vazio. |
| RF2 — Consultar clima atual (CA-RF2-1 a CA-RF2-4) | T-03, T-06, T-09, T-11, T-14, T-15, T-39 | T-19, T-21, T-23, T-25, T-27, T-28, T-29, T-30 | Coberto: dados, identificação do local, horário local, loading e retry de erro. |
| RF3 — Consultar previsão (CA-RF3-1 a CA-RF3-5) | T-03, T-04, T-07, T-09, T-12, T-14, T-15, T-39 | T-19, T-20, T-21, T-23, T-25, T-27, T-28, T-29, T-30 | Parcialmente verificável: não há critério de teste explícito que confirme cinco datas locais consecutivas começando hoje (CA-RF3-1/2). T-07 exige ordem cronológica, mas não declara esse teste. |
| RF4 — Alternar unidade de temperatura (CA-RF4-1 a CA-RF4-7) | T-02, T-11, T-12, T-13, T-39 | T-18, T-25, T-26, T-29 | Coberto: padrão Celsius, conversão/arredondamento, sensação térmica, atualização sem nova busca e retorno a Celsius após reload. |
| RF5 — Uso em dispositivos móveis (CA-RF5-1 a CA-RF5-4) | T-10, T-11, T-12, T-13, T-17, T-39 | T-24, T-25, T-26, T-29, T-31 | Coberto: fluxo mobile, legibilidade, alvos de toque, ausência de rolagem horizontal e largura máxima em desktop. |

**Lacunas:** todos os requisitos funcionais RF1–RF5 têm tarefas de implementação associadas. A lacuna é de verificação de RF3: incluir nos critérios de T-21 (testes do service) que, com uma resposta completa, os cinco dias são consecutivos no calendário local e começam na data local de hoje, sem duplicatas; T-29 pode confirmar o comportamento integrado com fixture determinística.

| Requisito não funcional | Tarefas relacionadas |
| --- | --- |
| RNF1 — Responsividade | T-29, T-31 |
| RNF2 — Usabilidade | T-35 |
| RNF3 — Acessibilidade | T-10, T-13, T-24, T-26, T-27, T-28, T-32 |
| RNF4 — Confiabilidade | T-06, T-07, T-09, T-21, T-23, T-30 |
| RNF5 — Desempenho | T-34 |

## Prioridade e tamanho

Prioridade indica ordem de investimento: **P0** é o caminho crítico para um MVP utilizável e seus gates básicos; **P1** é hardening e validação necessária antes do lançamento público; **P2** é validação tardia, após estabilizar o fluxo, mas ainda exigida antes do lançamento quando definida pela spec. Tamanho é esforço relativo (**P** pequeno, **M** médio, **G** grande), não estimativa de duração.

| Prioridade | Tamanho | Tarefas |
| --- | --- | --- |
| P0 | P | T-01, T-02, T-04, T-13, T-14, T-15, T-16, T-18, T-20, T-26 |
| P0 | M | T-03, T-05, T-06, T-07, T-08, T-09, T-10, T-11, T-12, T-17, T-19, T-22, T-23, T-24, T-25, T-28, T-31, T-39 |
| P0 | G | T-21, T-29 |
| P1 | M | T-27, T-30, T-36, T-37, T-38 |
| P1 | G | T-32 |
| P2 | M | T-33, T-34 |
| P2 | G | T-35 |

## Sequência em fatias verticais

1. **Busca visível:** T-01, T-05, T-08, T-10, T-14, T-15, T-16 e T-17; validar com T-22 e T-24. Entrega uma tela funcional onde já é possível enviar uma busca, distinguir resultados e selecionar um local, sem esperar pela integração do clima.
2. **Consulta meteorológica completa:** T-02, T-03, T-04, T-06, T-07, T-09, T-11, T-12, T-13 e T-39; validar com T-18, T-19, T-20, T-21, T-23, T-25, T-26 e T-28. Ao final, seleção leva ao clima atual, previsão e alternância de unidade.
3. **Fluxo real em mobile e robustez:** T-27, T-29, T-30 e T-31. Fecha os fluxos E2E, falhas, concorrência, legibilidade e dimensões responsivas.
4. **Pronto para lançamento:** T-32 a T-38. Executar acessibilidade, compatibilidade, desempenho, usabilidade, privacidade, condições do provedor e gates de qualidade. P2 significa executar mais tarde, não dispensar os gates explicitamente exigidos pela spec.
| RNF6 — Privacidade e segurança | T-05, T-10, T-36 |
| RNF7 — Estados de interface | T-08, T-09, T-14, T-15, T-16, T-17, T-27, T-28, T-30 |
| RNF8 — Idioma e formatos | T-03, T-10, T-11, T-12, T-17, T-19 |
| RNF9 — Testabilidade | T-02, T-03, T-04, T-18, T-19, T-20 |
| RNF10 — Compatibilidade | T-33 |