# Especificação do Produto — Aplicação de Previsão do Tempo

> **Entrada:** [discovery.md](./discovery.md)
> **Status:** pronta para desenvolvimento. As validações da seção 10 são gates de lançamento e não bloqueiam a implementação conforme as premissas desta especificação.
> **Idioma:** pt-BR (narrativa); termos técnicos em en-US

---

## 1. Overview

A aplicação permite que usuários web consultem as condições meteorológicas de
uma cidade. O fluxo principal é: **buscar uma cidade → selecionar o local
correto → ver o clima atual → ver a previsão para hoje + 4 dias → alternar a
unidade de temperatura entre Celsius e Fahrenheit**.

A experiência deve funcionar bem em dispositivos móveis, que são o contexto
principal de uso.

**Objetivos do produto**

- Permitir que o usuário encontre a cidade certa em poucos passos.
- Apresentar o clima atual e a previsão de cinco dias de forma clara.
- Permitir a leitura das temperaturas na unidade preferida do usuário.
- Comunicar de forma honesta falhas e estados de carregamento ou vazio.

**Fora do escopo do objetivo atual:** os itens listados na seção 9.

**Personas de referência** (definidas em [discovery.md](./discovery.md)):
Marina (consulta rápida no celular), Rafael (planejamento de viagem, desktop e
mobile) e Lúcia (comparação de dias para atividades ao ar livre).

---

## 2. Functional Requirements

Os requisitos mantêm a numeração do discovery (RF1–RF5) e detalham o
comportamento esperado.

### RF1 — Buscar cidades

- O sistema deve oferecer um campo de busca por nome de cidade.
- Espaços no início e no fim do termo devem ser ignorados; termo vazio após
  remoção desses espaços não gera requisição.
- A busca deve retornar uma lista de locais correspondentes ao texto digitado.
- Cada resultado deve exibir contexto suficiente para diferenciar homônimos
  (ao menos cidade, estado/região e país).
- O escopo geográfico é mundial, limitado aos locais retornados pelo serviço de
  geocoding com coordenadas válidas. A disponibilidade do clima atual e da
  previsão é verificada após a seleção, de forma independente, conforme RF2,
  RF3 e EC12. Estado/região deve ser exibido quando fornecido; país é exibido
  sempre que fornecido. Metadados ausentes não devem ser inventados.
- Se dois resultados ainda tiverem o mesmo rótulo visível, incluir suas
  coordenadas geográficas no resultado para permitir distingui-los.
- O usuário deve poder selecionar um dos resultados para consultar o clima.
- A busca não deve ser disparada a cada tecla sem controle; deve ocorrer ao
  enviar o termo (ex.: Enter ou botão de busca).

### RF2 — Consultar clima atual

- Após a seleção de uma cidade, o sistema deve exibir as condições atuais
  dessa cidade.
- O cabeçalho do resultado deve identificar claramente a cidade selecionada
  (nome + estado/região + país, quando disponíveis) e o horário da observação
  no fuso local do local consultado.
- As informações atuais exibidas são definidas na seção 2.1 (Dados
  exibidos).

### RF3 — Consultar previsão

- Após a seleção de uma cidade, o sistema deve exibir a previsão de hoje e dos
  quatro dias seguintes, conforme o calendário local do local selecionado.
- Cada dia deve exibir sua data e a condição resumida.
- A previsão deve ser apresentada em ordem cronológica.
- Se a fonte retornar menos de cinco dias, exibir somente os dias recebidos e
  indicar que a previsão está incompleta; não inventar dados nem datas.

### RF4 — Alternar unidade de temperatura

- A unidade padrão na primeira consulta é **Celsius**.
- O usuário deve poder alternar entre Celsius e Fahrenheit a qualquer momento
  com a cidade já selecionada.
- Ao alternar, todas as temperaturas visíveis (atual e previsão) devem ser
  atualizadas para a nova unidade, sem nova busca de dados.
- A conversão deve ser feita pela fórmula F = C × 9/5 + 32, com arredondamento
  para o inteiro mais próximo na exibição; empates exatos são arredondados
  afastando de zero. Sensação térmica também é convertida.

### RF5 — Uso em dispositivos móveis

- Todos os fluxos de RF1 a RF4 devem ser concluíveis em dispositivos móveis
  (ver RNF1).
- Nenhuma informação essencial pode depender de hover ou de recursos exclusivos
  de desktop.

### 2.1 Dados exibidos

Campos e unidades obrigatórios para esta versão:

| Contexto | Dados |
| --- | --- |
| Clima atual | Temperatura, condição (texto + ícone), sensação térmica, umidade, velocidade do vento e horário da observação |
| Cada dia da previsão | Data, condição, temperatura mínima e máxima e probabilidade de precipitação |

Temperaturas são exibidas em Celsius ou Fahrenheit, arredondadas para inteiro.
Vento é exibido em km/h; probabilidade de precipitação, em porcentagem.
Datas usam dd/mm/aaaa e o calendário local do local consultado; o horário da
observação usa o fuso horário local desse local. Campo ausente é exibido como
indisponível, nunca como zero nem como valor convertido. A falta de um campo
opcional não invalida os demais dados da seção. A falta de coordenadas válidas
impede a consulta meteorológica; a falta de fuso horário impede apresentar
horários locais e deve ser indicada como indisponibilidade, sem usar o fuso do
dispositivo como substituto.

---

## 3. User Stories

**US1 — RF1: Buscar cidades**
Como Marina, usuária do dia a dia, quero buscar uma cidade e distinguir os
locais correspondentes, para selecionar a cidade certa sem confusão com
homônimos.

**US2 — RF2: Consultar o clima atual**
Como Marina, usuária do dia a dia, quero consultar as condições atuais da cidade
selecionada, para decidir rapidamente o que vestir ou levar.

**US3 — RF3: Consultar a previsão de cinco dias**
Como Rafael, planejador de viagem, quero consultar a previsão de hoje e dos
quatro dias seguintes, para organizar as atividades da viagem sem buscar em
outra fonte.

**US4 — RF3: Comparar a previsão dia a dia**
Como Lúcia, organizadora de atividades ao ar livre, quero comparar as condições
dos próximos cinco dias em ordem cronológica, para escolher o melhor dia para
realizar uma atividade.

**US5 — RF4: Alternar a unidade de temperatura**
Como Lúcia, organizadora de atividades ao ar livre, quero alternar entre
Celsius e Fahrenheit, para avaliar as temperaturas na unidade que prefiro.

**US6 — RF5: Usar a aplicação em dispositivos móveis**
Como Marina, usuária do dia a dia, quero buscar uma cidade e consultar o clima
atual e a previsão pelo celular, para tomar decisões sobre o tempo durante o
trajeto.

---

## 4. Acceptance Criteria

Cada critério é verificável por teste manual, teste unitário ou teste E2E.

### RF1 — Buscar cidades

- **CA-RF1-1:** Dado que o usuário digitou "São Paulo" e enviou a busca, quando
  a API retorna resultados, então a lista exibe ao menos um item com nome,
  estado/região e país.
- **CA-RF1-2:** Dado que existem dois locais com o mesmo nome em países
  diferentes, quando a busca é feita, então ambos aparecem como itens
  distintos, com país diferente visível em cada um.
- **CA-RF1-3:** Dado um resultado da lista, quando o usuário o seleciona por
  clique/toque **ou** por teclado (Tab + Enter), então a consulta de clima
  para esse local é iniciada.
- **CA-RF1-4:** Dado que o campo de busca está vazio ou só com espaços, quando
  o usuário envia a busca, então nenhuma requisição é feita e uma mensagem de
  validação é exibida.
- **CA-RF1-5:** Dado que a busca não retorna resultados, quando a resposta
  chega, então a interface exibe um estado vazio com mensagem explicativa e
  sugestão de revisar o termo.
- **CA-RF1-6:** Dado que o usuário digita um termo, quando não envia a busca,
  então nenhuma requisição de busca é disparada.

### RF2 — Consultar clima atual

- **CA-RF2-1:** Dado que o usuário selecionou uma cidade, quando os dados
  atuais são recebidos, então são exibidos temperatura, condição, sensação
  térmica, umidade, vento e horário da observação.
- **CA-RF2-2:** Dado que os dados atuais estão exibidos, quando o usuário lê o
  cabeçalho, então o nome da cidade, estado/região e país correspondem ao
  local selecionado.
- **CA-RF2-3:** Dado que a consulta está em andamento, quando a interface é
  renderizada, então um estado de carregamento é exibido e nenhum dado anterior
  é apresentado como atual.
- **CA-RF2-4:** Dado que a consulta do clima atual falha, quando o erro ocorre,
  então uma mensagem de erro é exibida com opção de tentar novamente.

### RF3 — Consultar previsão

- **CA-RF3-1:** Dado que a fonte retorna cinco dias, quando a previsão é
  exibida, então são mostrados exatamente cinco dias locais consecutivos,
  começando por hoje.
- **CA-RF3-2:** Dado que a previsão está exibida, quando o usuário percorre os
  itens, então as datas disponíveis estão em ordem crescente e consecutiva,
  sem repetição; eventual previsão parcial é indicada conforme CA-RF3-5.
- **CA-RF3-3:** Dado que um dia da previsão é exibido, quando o usuário lê o
  item, então estão presentes data, condição, mínima, máxima e probabilidade
  de precipitação, ou indicação explícita de indisponibilidade para campo
  ausente.
- **CA-RF3-4:** Dado que a previsão está carregando ou falhou, quando a
  interface é renderizada, então há um estado de carregamento ou de erro com
  opção de tentar novamente, independentemente do clima atual.
- **CA-RF3-5:** Dado que a fonte retorna menos de cinco dias, quando a previsão
  é exibida, então somente os dias disponíveis aparecem e a interface informa
  que a previsão está incompleta, sem duplicar ou inventar datas.

### RF4 — Alternar unidade de temperatura

- **CA-RF4-1:** Dado que a aplicação foi aberta pela primeira vez, quando uma
  cidade é consultada, então todas as temperaturas são exibidas em Celsius.
- **CA-RF4-2:** Dado que o valor original em Celsius é 0 °C, quando o usuário
  alterna para Fahrenheit, então a temperatura exibida é 32 °F.
- **CA-RF4-3:** Dado que o valor original em Celsius é 25 °C, quando o usuário
  alterna para Fahrenheit, então a temperatura exibida é 77 °F.
- **CA-RF4-4:** Dado que o usuário está em Fahrenheit, quando alterna de volta,
  então as temperaturas voltam a ser exibidas em Celsius sem nova requisição de
  dados.
- **CA-RF4-5:** Dado que a unidade foi alternada, quando o estado da interface
  é verificado, então a temperatura atual, as máximas/mínimas da previsão e a
  sensação térmica estão todas na mesma unidade.
- **CA-RF4-6:** Dado que o controle de unidade é exibido, quando o usuário
  consulta sua indicação, então a unidade selecionada é informada de forma
  textual ou por `aria-pressed`/equivalente (não apenas por cor).
- **CA-RF4-7:** Dado que a página é recarregada após alternar para Fahrenheit,
  quando os dados são consultados novamente, então a unidade inicial é Celsius.

### RF5 — Uso em dispositivos móveis

- **CA-RF5-1:** Dado uma viewport de 360 px de largura, quando o fluxo completo
  (buscar, selecionar, ver atual, ver previsão, alternar unidade) é executado,
  então todas as ações são concluíveis sem scroll horizontal.
- **CA-RF5-2:** Dado uma viewport de 360 px, quando a previsão de cinco dias é
  exibida, então cada dia continua legível e nenhum texto é cortado.
- **CA-RF5-3:** Dado um dispositivo com toque, quando o usuário toca em
  resultados, controles de unidade e botão de nova tentativa, então cada alvo
  de toque tem ao menos 44 × 44 px.
- **CA-RF5-4:** Dado uma viewport de 1280 px de largura, quando a aplicação é
  aberta, então o conteúdo tem largura máxima de 1200 px, permanece centralizado
  e não apresenta rolagem horizontal.

---

## 5. Non-Functional Requirements

Mantêm os RNF1–RNF4 do discovery e acrescentam critérios de desempenho e
segurança.

| ID | Categoria | Requisito | Critério verificável |
| --- | --- | --- | --- |
| **RNF1** | Responsividade | Interface e conteúdo se adaptam a telas móveis e desktop. | Verificado em viewports de 360 px, 390 px, 768 px e 1280 px, sem quebra de layout (CA-RF5-1 a CA-RF5-4). |
| **RNF2** | Usabilidade | Busca, consulta e alternância de unidade são compreensíveis. | Em teste moderado com ao menos 3 participantes das personas, todos encontram e selecionam o local solicitado e concluem a consulta sem ajuda; Marina conclui o fluxo principal em até 30 s. |
| **RNF3** | Acessibilidade | Fluxos compatíveis com WCAG 2.2 nível AA. | Todos os controles operáveis por teclado e com foco visível; controles com nomes acessíveis; erros associados ao controle pertinente; contraste mínimo de 4.5:1 para texto normal e 3:1 para texto grande e componentes gráficos essenciais; auditoria automatizada sem violações críticas ou graves. |
| **RNF4** | Confiabilidade | Falhas são comunicadas; dados não são apresentados como atuais se estiverem desatualizados. | Em erro de rede ou de API, a interface mostra mensagem de erro e não reutiliza dados antigos como "atuais" sem indicação de horário. |
| **RNF5** | Desempenho | Busca e alternância devem responder dentro dos limites definidos. | Em 100 execuções com rede 4G simulada (RTT de 100 ms, download de 10 Mbps e upload de 5 Mbps), 95% dos resultados utilizáveis aparecem até 2 s após o envio; a alternância reflete na tela em até 100 ms, sem requisição de rede. Estes são os limites de aceite desta versão. |
| **RNF6** | Privacidade e segurança | Entradas são tratadas como texto; requisições a serviços externos usam HTTPS; a aplicação não persiste buscas nem localizações após a sessão. | Testar termo de busca com caracteres especiais sem execução/renderização de HTML; confirmar ausência de armazenamento local ou no servidor e informar que o termo é enviado ao serviço de geocoding, sujeito aos termos desse serviço. |
| **RNF7** | Estados de interface | Busca, clima atual e previsão tratam seus estados de carregamento, sucesso, vazio quando aplicável e erro recuperável. | Cada estado aplicável a cada operação tem critério de aceite e teste; falha de uma consulta não remove dados válidos da outra. |
| **RNF8** | Idioma | Interface em pt-BR. | Todos os textos visíveis, mensagens e erros estão em pt-BR; datas usam dd/mm/aaaa e horário usa hora:minuto no fuso local do local consultado. |
| **RNF9** | Testabilidade | Lógica de conversão e formatação é testável de forma isolada. | Conversão de unidade e formatação de datas cobertas por testes unitários. |
| **RNF10** | Compatibilidade | Suportar navegadores atuais em dispositivos móveis e desktop. | Fluxos principais validados nas duas versões estáveis mais recentes disponíveis de Chrome, Safari, Firefox e Edge. Versões anteriores não são suportadas nesta versão. |

---

## 6. Edge Cases

| # | Cenário | Comportamento esperado |
| --- | --- | --- |
| EC1 | Cidade inexistente | A busca termina sem selecionar uma cidade nem consultar o clima; a interface informa que a cidade não foi encontrada e permite editar o termo ou fazer outra busca. |
| EC2 | Campo de busca vazio ou contendo apenas espaços | A busca não é enviada à API; a interface informa que o nome da cidade é obrigatório e mantém o foco no campo para correção. |
| EC3 | Caracteres especiais no termo de busca | O termo é tratado como texto literal, sem execução ou interpretação como HTML/código; a busca pode retornar resultados ou o estado vazio normal, sem quebrar a interface. |
| EC4 | Geocoding sem resultados | A interface apresenta estado vazio com mensagem de que nenhum local corresponde ao termo e permite tentar outra busca; nenhuma consulta meteorológica é feita. |
| EC5 | Busca com acentos ou sem acentos ("Sao Paulo" / "São Paulo") | O termo é enviado como texto à busca; resultados são exibidos conforme resposta do serviço e, se não houver correspondência, aplica-se o estado vazio de EC4. |
| EC6 | Cidades homônimas em países ou estados diferentes | Todos os resultados aparecem separados, com contexto de país/estado (CA-RF1-2). |
| EC7 | Termo muito curto (1 caractere) | O termo é enviado à busca; se o serviço não retornar locais, aplica-se o estado vazio de EC4. |
| EC8 | Usuário envia nova busca enquanto outra está em andamento | A resposta da busca mais recente prevalece; respostas anteriores são descartadas e não alteram a lista atual. |
| EC9 | Usuário troca de cidade durante carregamento da previsão | Dados da cidade anterior não aparecem sob o nome da nova cidade; a previsão exibida corresponde à cidade selecionada mais recentemente. |
| EC10 | Falha de API ou perda de conexão (resposta de erro, incluindo 5xx) | A seção cuja consulta falhou exibe mensagem de erro e ação para tentar novamente; dados antigos não são apresentados como atuais. |
| EC11 | Timeout durante geocoding ou consulta meteorológica | Após 10 s sem resposta, a operação termina em estado de erro; a interface informa que não foi possível concluir a consulta e oferece nova tentativa. |
| EC12 | Resposta parcial da API (campos ausentes ou somente clima atual ou previsão disponível) | Exibir apenas os dados válidos recebidos; indicar claramente a seção ou informação indisponível, sem inventar valores. A parte que falhou ou está incompleta oferece nova tentativa sem ocultar a parte válida. |
| EC13 | API retorna previsão com menos de 5 dias | Aplicar CA-RF3-5: exibir os dias disponíveis e sinalizar previsão incompleta, sem inventar ou duplicar dias. |
| EC14 | Campo meteorológico ausente | Exibir "Indisponível" no campo, sem quebrar o layout nem converter valor ausente. |
| EC15 | Alternância de unidade com dados ainda carregando | O controle fica desabilitado ou a troca aplica-se assim que os dados chegarem; nunca exibe unidade inconsistente. |
| EC16 | Recarregar a página após alternar para Fahrenheit | Retorna a Celsius; a preferência não persiste entre sessões. |
| EC17 | Valores extremos de temperatura (ex.: −40 °C ou 50 °C) | Conversão correta (−40 °C = −40 °F) e exibição sem truncamento. |
| EC18 | Fuso horário da cidade diferente do dispositivo | Datas da previsão e horário da observação usam o calendário e o fuso horário do local consultado. |
| EC19 | Dispositivo sem JavaScript habilitado | Comportamento não coberto nesta versão; registrar como limitação conhecida. |
| EC20 | Cidade selecionada sem coordenadas válidas retornadas pela fonte | Não consultar o clima; exibir mensagem de local indisponível. |
| EC21 | Local sem cobertura meteorológica ou sem fuso horário fornecido | Não apresentar dados de outro local como substitutos. Se não houver dados meteorológicos, informar indisponibilidade e permitir nova busca; se faltar apenas o fuso, omitir o horário local e indicar indisponibilidade. |

---

## 7. Assumptions

Herdadas do [discovery.md](./discovery.md) e confirmadas como premissas de
trabalho:

- **A1.** A aplicação é acessada pela web, em dispositivos móveis, com conexão
  à internet.
- **A2.** A busca é feita pelo nome da cidade; geolocalização automática fica
  fora desta versão.
- **A3.** O usuário seleciona uma cidade antes de ver as informações
  meteorológicas.
- **A4.** Celsius/Fahrenheit aplicam-se à temperatura; vento é apresentado em
  km/h e probabilidade de precipitação em porcentagem.
- **A5.** Não há autenticação nem persistência de dados de usuário no servidor
  nesta versão.
- **A6.** A fonte de dados é a **Open-Meteo**, sem API key (decisão registrada
  no discovery). Limites de uso, cobertura e termos ainda devem ser verificados.
- **A7.** O período da previsão é **hoje + 4 dias** (decisão do discovery).
- **A8.** A unidade padrão é **Celsius** e a interface é em **pt-BR**
  (decisões do discovery).
- **A9.** A busca atende mundialmente os locais que o geocoding da Open-Meteo
  retornar com coordenadas válidas. Não há garantia de cobertura uniforme em
  todos os países; clima atual e previsão são consultados de forma independente
  e podem ter disponibilidade diferente.
- **A10.** Os campos obrigatórios e suas unidades são exatamente os definidos
  na seção 2.1; quando a fonte não fornecer um campo, aplica-se o fallback
  descrito naquela seção, sem substituir dados ausentes por estimativas.
- **A11.** Os limites de desempenho da RNF5, timeout de 10 s da EC11 e suporte
  às duas versões estáveis mais recentes dos navegadores listados na RNF10 são
  os critérios desta versão. Qualquer alteração exige revisão da especificação.

---

## 8. Risks

| # | Risco | Prob. | Impacto | Mitigação |
| --- | --- | --- | --- | --- |
| R1 | Seleção de cidade homônima errada pelo usuário | Média | Alto | Exibir país/estado em cada resultado (RF1, CA-RF1-2); mostrar local no cabeçalho (CA-RF2-2). |
| R2 | Fonte de dados indisponível ou com limite de uso excedido | Média | Alto | Tratamento de erro com nova tentativa (RNF4); validar limites e termos antes do lançamento (seção 10, item 1). |
| R3 | Interpretação diferente do período de 5 dias | Média | Médio | Período fixado como hoje + 4 dias (A7) e coberto por CA-RF3-1, CA-RF3-2 e CA-RF3-5. |
| R4 | Conversão ou arredondamento incorreto de temperatura | Baixa | Alto | Fórmula explícita (RF4) e casos de teste (CA-RF4-2, CA-RF4-3, EC17). |
| R5 | Layout quebrado em telas pequenas ou largas | Média | Alto | Validar viewports de 360 px, 390 px, 768 px e 1280 px (CA-RF5-1 a CA-RF5-4). |
| R6 | Dados antigos exibidos como atuais | Baixa | Alto | Exibir horário da observação e descartar respostas de buscas/locais anteriores (EC8, EC9, RNF4). |
| R7 | Problemas de acessibilidade em componentes customizados | Média | Médio | Testes de teclado e auditoria automatizada (RNF3). |
| R8 | Limitações de licença/atribuição da fonte de dados | Baixa | Médio | Verificar termos da Open-Meteo e incluir atribuição se exigida (seção 10, item 1). |

---

## 9. Out of Scope

Itens **fora** desta versão:

- Geolocalização automática do dispositivo.
- Lista de cidades favoritas.
- Modo offline ou cache de dados meteorológicos.
- Contas de usuário, login e autenticação.
- Persistência de preferências no servidor e sincronização entre dispositivos.
- Alertas meteorológicos e notificações push.
- Previsão para além de cinco dias e dados históricos.
- Mapas interativos ou camadas de radar/satélite.
- Aplicativo nativo (iOS/Android).
- Unidades diferentes de Celsius/Fahrenheit para temperatura (ex.: Kelvin).
- Internacionalização para outros idiomas além de pt-BR.
- Previsões por hora, dados históricos, qualidade do ar, índices UV, nascer e
  pôr do sol, mapas, gráficos ou alertas por local.
- Autocompletar sugestões enquanto o usuário digita; a busca ocorre somente
  após envio explícito do termo.
- Comparar várias cidades na mesma tela, atualizar dados automaticamente ou
  manter histórico de buscas.
- Suporte a navegadores anteriores aos definidos na RNF10 ou uso sem
  JavaScript.

---

## 10. Validações pré-lançamento

Os itens abaixo são gates para disponibilizar a aplicação publicamente, mas não
impedem o desenvolvimento conforme as decisões e critérios já definidos nesta
especificação:

1. **Open-Meteo:** verificar limites de uso, termos de licença/atribuição e
  cobertura dos locais pretendidos; incluir na interface o crédito exigido.
  Se os termos impedirem o uso previsto, interromper o lançamento e revisar a
  escolha da fonte.
2. **Cobertura e metadados:** validar a cobertura de geocoding, coordenadas,
  fuso horário e campos meteorológicos nos locais de teste. Aplicar os
  fallbacks de RF1, seção 2.1 e EC21 quando houver dados ausentes.
3. **Desempenho e compatibilidade:** executar as verificações de RNF5 e RNF10
  nos ambientes e condições ali especificados; requisitos diferentes exigem
  revisão formal desta especificação.

Qualquer mudança nas decisões fechadas nas seções 2, 5, 6 e 9 exige revisão
desta especificação.
