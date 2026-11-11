# Discovery — Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação de previsão do tempo para que usuários consultem as condições meteorológicas de cidades. A experiência deve permitir localizar uma cidade, conferir o clima atual e visualizar a previsão dos próximos cinco dias. Deve oferecer alternância entre Celsius e Fahrenheit e funcionar em dispositivos móveis.

O briefing não define público-alvo específico, fonte de dados, região de lançamento ou se a aplicação também deve priorizar uso em desktop.

## Personas

Personas iniciais, baseadas nas funcionalidades previstas e ainda sujeitas a validação com usuários reais.

| Persona | Objetivo principal | Contexto de uso | Métrica de sucesso pessoal |
| --- | --- | --- | --- |
| **Marina, usuária do dia a dia** | Saber rapidamente como está o tempo para decidir o que vestir ou levar. | Mobile, antes de sair de casa ou durante o trajeto. | Consulta a condição atual da cidade certa e toma uma decisão em até 30 segundos. |
| **Rafael, planejador de viagem** | Conferir o clima do destino para organizar atividades nos próximos dias. | Desktop ao planejar; mobile durante a viagem. | Encontra a cidade correta e entende a previsão de hoje mais os quatro dias seguintes sem precisar buscar em outra fonte. |
| **Lúcia, organizadora de atividades ao ar livre** | Comparar a previsão dos próximos dias para escolher quando realizar uma atividade. | Principalmente mobile, com consultas pontuais ao longo do dia. | Identifica rapidamente o dia mais adequado e vê as temperaturas na unidade que prefere. |

## Requisitos Funcionais

- **RF1 — Buscar cidades:** permitir que o usuário pesquise uma cidade e selecione o local desejado.
- **RF2 — Consultar clima atual:** exibir as condições meteorológicas atuais da cidade selecionada.
- **RF3 — Consultar previsão:** exibir a previsão para cinco dias da cidade selecionada.
- **RF4 — Alternar unidade:** permitir alternar entre Celsius e Fahrenheit e apresentar as temperaturas na unidade escolhida.
- **RF5 — Uso em dispositivos móveis:** permitir realizar as buscas e consultar as informações em dispositivos móveis.

## Requisitos Não-Funcionais

- **RNF1 — Responsividade:** interface e conteúdo devem se adaptar a telas de dispositivos móveis.
- **RNF2 — Usabilidade:** busca, consulta do clima e alternância de unidade devem ser compreensíveis e acessíveis ao usuário.
- **RNF3 — Acessibilidade:** controles devem ser utilizáveis por teclado e possuir nomes acessíveis; textos e dados devem manter legibilidade em telas menores.
- **RNF4 — Confiabilidade:** a aplicação deve comunicar falhas ao buscar dados meteorológicos, sem apresentar informações desatualizadas como atuais.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação inicial |
| --- | --- | --- | --- |
| Cidades com nomes iguais ou semelhantes levarem à seleção do local errado | Média | Alto | Apresentar informações de contexto, como estado ou país, nos resultados da busca. |
| Fonte de dados indisponível ou com limites de uso | Média | Alto | Avaliar a disponibilidade, os limites e os termos da fonte; tratar erros e oferecer nova tentativa. |
| Interpretação diferente do período de cinco dias (incluindo ou não o dia atual) | Média | Médio | Definir explicitamente o período e a apresentação das datas antes da implementação. |
| Conversão ou apresentação incorreta entre Celsius e Fahrenheit | Baixa | Alto | Definir a unidade como parte do contrato dos dados e validar a alternância com testes. |
| Layout ou controles não funcionarem bem em telas móveis | Média | Alto | Validar os fluxos principais em diferentes larguras de tela e testar em dispositivo móvel. |

## Perguntas em Aberto

1. Quais são os limites, a cobertura e os termos de uso da fonte de dados escolhida?
2. Como os resultados da busca devem desambiguar cidades homônimas (por país, estado, região)?
3. A escolha de unidade feita pelo usuário deve ser lembrada entre sessões?
4. Quais informações compõem o clima atual e cada dia da previsão (por exemplo, condição, mínima/máxima, vento e precipitação)?
5. Quais regiões devem ser atendidas no lançamento?
6. A experiência deve incluir geolocalização, favoritos ou funcionamento com dados em cache/offline?
7. Além de dispositivos móveis, quais navegadores, tamanhos de tela e dispositivos precisam ser suportados?

## Suposições

- A aplicação será acessada pela web em dispositivos móveis com conexão à internet.
- A busca é feita pelo nome da cidade; geolocalização automática não foi solicitada.
- O usuário seleciona uma cidade antes de consultar as informações meteorológicas.
- “Celsius e Fahrenheit” refere-se à unidade de temperatura; outras unidades meteorológicas ainda precisam ser definidas.
- A primeira versão não terá autenticação nem persistência de servidor; persistência local e sincronização entre dispositivos não estão definidas.

## Decisões

- **Fonte de dados — Open-Meteo, sem API key.** Simplifica a integração e evita gerenciar uma chave de API na aplicação. Resolve a escolha do provedor; limites, cobertura e termos de uso ainda devem ser verificados.
- **Período da previsão — hoje + 4 dias.** Define um intervalo único para a previsão solicitada. Resolve a pergunta sobre incluir ou não o dia atual.
- **Unidade padrão — Celsius.** Define a unidade exibida na primeira consulta e é adequada ao contexto inicial em pt-BR. Resolve a unidade padrão; lembrar a preferência escolhida pelo usuário entre sessões continua em aberto.
- **Autenticação e persistência — sem autenticação e sem persistência de servidor.** Mantém a primeira versão sem contas nem armazenamento de dados de usuário no servidor. Resolve se haverá login e persistência/sincronização no servidor; persistência local, como lembrar a unidade ou cidades favoritas, não está definida.
- **Idioma da interface — pt-BR.** Alinha textos e experiência ao público inicial esperado. Resolve o idioma da interface; regiões atendidas e convenções regionais além do idioma continuam em aberto.