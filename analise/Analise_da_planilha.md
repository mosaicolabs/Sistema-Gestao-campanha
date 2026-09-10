# Análise da planilha Campanha EA 2026

Fonte: `Campanha_EA_2026_REV-006.xlsx`. Análise em 10/09/2026. O arquivo original foi examinado sem alteração.

## Como ler os resultados

Uma **linha de cadastro** é uma linha a partir da linha 3 com algum conteúdo em A:H, desconsiderando células vazias e espaços isolados. Cabeçalhos, botões “VOLTAR”, índices e linhas apenas formatadas não entram nessa contagem. Uma linha com o campo “Liderança” preenchido continua sendo uma ocorrência, não uma pessoa necessariamente única.

As contagens territoriais e de dobradas são visões sobre registros que se repetem. **Não se deve somar 681 + 739 para obter o tamanho da base de pessoas.** A identificação de pessoas únicas depende da conciliação dos registros e dos vínculos.

## Estrutura integral do arquivo

| Componente | Quantidade | Função observada |
|---|---:|---|
| Índice geral | 1 aba | Apresenta totais por região e por dobrada |
| Índices regionais | 8 abas | Listam localidades e quantidades |
| Abas territoriais | 54 abas | Organizam cadastros por localidade |
| Abas de dobradas | 17 abas | Reapresentam cadastros por vínculo indicado no arquivo |
| Total | 80 abas | 7.279 células com valores, incluindo títulos e espaços |

Foram encontrados 156 hiperlinks. Não há fórmulas, tabelas estruturadas do Excel, gráficos, imagens, comentários, nomes definidos ou vínculos externos de planilha. Todas as abas estão visíveis, sem linhas ou colunas ocultas e sem proteção de folha. Existe uma única validação de lista, “Sim,Não”, em `>>CENTRO SUL<<!E3`, fora das colunas principais do índice.

As quantidades dos índices são números gravados diretamente. Portanto, a inclusão de um cadastro em uma aba não atualiza automaticamente o índice. Parte das abas tem centenas de linhas formatadas sem dados; isso não equivale a centenas de cadastros.

A ausência de proteção de folha não permite concluir quais permissões existem no Drive. O áudio menciona o Drive, mas esta análise examinou o arquivo local recebido, não as configurações de compartilhamento da origem.

## O que cada linha representa

Nas abas territoriais, uma linha combina pessoas com diferentes funções, uma localidade, informação de contato e um vínculo denominado “Dep Federal”. Isso reúne vários conceitos em uma mesma linha:

| Conceito | Campo na planilha | Interpretação para análise |
|---|---|---|
| Pessoa responsável pela articulação | Articulador | Nome, geralmente repetido em diversas linhas |
| Pessoa responsável pela coordenação | Coordenador | Nome opcional no preenchimento atual |
| Contato de coordenação | Primeiro Contato | Interpretação pela posição, a confirmar com o gestor |
| Pessoa identificada como liderança | Liderança | Principal nome da linha, mas nem sempre preenchido |
| Área local | Região | Texto livre, diferente das oito regiões do índice |
| Contato da liderança | Segundo Contato | Interpretação pela posição, a confirmar com o gestor |
| Vínculo de dobrada | Dep Federal | Nome/abreviação do vínculo, sem cadastro padronizado |
| Religião | Religião | Informação declarada no arquivo, incompleta e sem padronização |

O município/localidade é implícito no nome da aba territorial. Nas dobradas acontece o inverso: a localidade é uma coluna explícita e a dobrada é implícita no nome da aba. O rótulo “Dep Federal” deve ser preservado como evidência original, sem presumir o cargo atual de todas as pessoas ali mencionadas.

**Não há identificador único de pessoa ou de vínculo.** Nomes e telefones isolados não bastam para resolver todos os casos de duplicidade. Uma pessoa também pode exercer mais de uma função ou possuir vários vínculos.

## Dicionário de colunas e exceções

| Informação | 53 abas territoriais padrão | Paty do Alferes | 17 abas de dobradas |
|---|---|---|---|
| Localidade | Nome da aba | Nome da aba | A |
| Articulador | A | A | B |
| Coordenador | B | B | C |
| Contato de coordenação | C | C | D |
| Liderança | D | D | E |
| Região local | E | F | F |
| Contato da liderança | F | E | G |
| Dobrada | G | G | Nome da aba |
| Religião | H | H | H |
| Navegação | I2 | I2 | I2 |

Em `Paty do Alferes!E2:F2`, “Contato” e “Região” estão invertidos em relação ao padrão. Uma importação baseada apenas na posição das colunas cadastraria dados no campo errado. Além de classificar o tipo de aba, o importador precisa conferir os cabeçalhos reais.

## Conciliação dos totais

| Visão | Total exibido no índice | Linhas preenchidas nas abas | Diferença |
|---|---:|---:|---:|
| Territorial | 672 | 681 | +9 |
| Dobradas | 591 | 739 | +148 |

Fontes dos totais exibidos: `>>RIO DE JANEIRO<<!B11` e `B30`. A contagem das abas foi refeita diretamente a partir das células, sem tomar os índices como referência de verdade.

### Regiões

A distribuição abaixo segue os agrupamentos do próprio arquivo. Não constitui validação externa da divisão territorial.

| Região | Índice geral | Linhas nas abas territoriais | Diferença |
|---|---:|---:|---:|
| Região dos Lagos | 25 | 25 | 0 |
| Centro Sul | 66 | 71 | +5 |
| Costa Verde | 13 | 13 | 0 |
| Sul Fluminense | 365 | 368 | +3 |
| Metropolitana | 185 | 185 | 0 |
| Noroeste Fluminense | 0 | 0 | 0 |
| Norte Fluminense | 5 | 5 | 0 |
| Serrana | 13 | 14 | +1 |
| **Total** | **672** | **681** | **+9** |

Casos que explicam as diferenças:

- `Paty do Alferes`: 6 linhas preenchidas, enquanto `>>CENTRO SUL<<!B9` informa 1.
- `Volta Redonda`: 164 linhas preenchidas, enquanto `>>SUL FLUNINENSE<<!B15` informa 161.
- `Teresópolis`: 1 linha preenchida; `>>SERRANA<<!B16` está vazio.
- Na Costa Verde, o total coincide, mas a composição diverge: Angra dos Reis tem 8 linhas e o índice informa 9; Itaguaí tem 1 linha e suas quantidades no índice estão vazias. Coincidência de total não prova conciliação dos detalhes.

### Dobradas

| Aba | Quantidade no índice geral | Linhas preenchidas | Diferença |
|---|---:|---:|---:|
| Dani Cunha | 377 | 377 | 0 |
| Coronel Henrique | 5 | 5 | 0 |
| Hugo Leal | 2 | 2 | 0 |
| Wellington José | 18 | 18 | 0 |
| Eloi Ramalho | 4 | 4 | 0 |
| Áureo Ribeiro | 78 | 78 | 0 |
| Júnior Trovão | 1 | 1 | 0 |
| Serfiotis | 22 | 22 | 0 |
| Vinicius Farah | 56 | 56 | 0 |
| Marta Rocha | 11 | 48 | +37 |
| Sostenes | 6 | 43 | +37 |
| Abraão | 1 | 38 | +37 |
| Luciano Vieira | 2 | 39 | +37 |
| Talita Galhardo | 1 | 1 | 0 |
| Altineu Côrtes | 1 | 1 | 0 |
| Gutembertg Reis | 2 | 2 | 0 |
| Luizinho | 4 | 4 | 0 |
| **Total** | **591** | **739** | **+148** |

O bloco `A22:H58` dessas quatro abas é idêntico, célula por célula e sem normalização, a `Vinicius Farah!A22:H58`. Cada uma das 37 linhas encontra uma correspondência territorial única pelos oito campos comuns, e todas essas correspondências têm “VINICIUS FARAH” em Dep Federal. Há forte indício de resíduo de cópia. Os blocos exigem revisão e não devem ser interpretados automaticamente como novos cadastros ou vínculos válidos. Removê-los faria os totais coincidirem, mas não provaria que o restante está correto.

## Qualidade do preenchimento territorial

Denominador: 681 linhas territoriais preenchidas. A contagem considera a exceção de colunas de Paty do Alferes. “Preenchido” significa presença de conteúdo, não validade, confirmação de identidade ou possibilidade de contato.

| Campo | Preenchido | Ausente | Percentual preenchido |
|---|---:|---:|---:|
| Articulador | 679 | 2 | 99,7% |
| Coordenador | 315 | 366 | 46,3% |
| Contato de coordenação | 0 | 681 | 0,0% |
| Liderança | 676 | 5 | 99,3% |
| Região local | 361 | 320 | 53,0% |
| Contato da liderança | 160 | 521 | 23,5% |
| Dep Federal / dobrada | 640 | 41 | 94,0% |
| Religião | 186 | 495 | 27,3% |

O sistema precisa aceitar cadastros incompletos durante a migração e mostrar a pendência de forma explícita. Tornar todos os campos obrigatórios desde a importação forçaria o descarte de registros ou o preenchimento com informações inventadas.

O campo de religião contém dados sobre pessoas. Sua eventual manutenção precisa ter finalidade definida e acesso restrito. Os relatórios administrativos de integridade podem funcionar sem usar esse campo. Não se deve inferir religião a partir de nomes ou títulos.

Os 160 contatos territoriais preenchidos têm quantidade de dígitos compatível com a verificação sintática adotada: 10 ou 11 dígitos após eventual prefixo 55. Isso não confirma que sejam telefones corretos, ativos ou pertencentes à pessoa indicada. Nas dobradas, há 143 contatos de liderança preenchidos. A única célula preenchida no contato de coordenação é `Serfiotis!D3`, com texto de nome em vez de telefone.

## Conciliação e possíveis duplicidades

Para comparar textos, foram removidos espaços externos, reduzidos espaços repetidos e equiparados acentos e maiúsculas/minúsculas. Não foram equiparados apelidos ou grafias diferentes, nem removidos títulos pessoais. A comparação dos oito campos comuns exclui o rótulo da dobrada; a comparação dos nove campos o inclui, usando o título da aba de dobrada quando necessário.

| Critério de comparação | Resultado | Limite da conclusão |
|---|---|---|
| Nove campos normalizados, apenas território | Nenhuma linha completa repetida | Uma pessoa pode estar repetida com algum campo diferente |
| Nove campos normalizados, apenas dobradas | 1 grupo de duas linhas | Par completo em `Wellington José!A11:H12` |
| Nove campos, todos os cadastros | 455 grupos com 911 ocorrências | Inclui as repetições esperadas entre as duas visões |
| Oito campos comuns entre território e dobradas | 545 grupos compartilhados | 545 linhas territoriais correspondem a 694 ocorrências nas dobradas |
| Sem correspondência exata na outra visão | 136 territoriais e 45 nas dobradas | É uma fila de conciliação, não prova de perda de cadastro |

### Mesmo nome de liderança na mesma localidade

Há 13 pares candidatos que diferem em outros campos. Nenhum deles foi tratado automaticamente como a mesma pessoa.

| Referências | Campos diferentes |
|---|---|
| `Barra Mansa!D30` e `D35` | Região local |
| `Barra do Piraí!D10` e `D44` | Coordenador e região local |
| `Barra do Piraí!D32` e `D51` | Coordenador |
| `Porto Real!D6` e `D13` | Articulador e religião |
| `Rio de Janeiro!D6` e `D99` | Região local, contato e Dep Federal |
| `Rio de Janeiro!D10` e `D101` | Região local, contato e Dep Federal |
| `Rio de Janeiro!D21` e `D95` | Região local e contato |
| `Rio de Janeiro!D53` e `D107` | Articulador, contato e religião |
| `Volta Redonda!D7` e `D121` | Região local |
| `Volta Redonda!D22` e `D150` | Coordenador, região local, Dep Federal e religião |
| `Volta Redonda!D110` e `D140` | Região local |
| `Volta Redonda!D113` e `D145` | Coordenador e região local |
| `Volta Redonda!D131` e `D147` | Coordenador e região local |

Há também 5 grupos de telefone repetido, envolvendo 11 linhas territoriais. Em `Iguaba Grande!F14` e `F16`, o mesmo número acompanha nomes distintos em `D14` e `D16`. Um número pode ser compartilhado; ele também não é chave suficiente para fundir pessoas.

## Problemas que precisam ser tratados antes da importação definitiva

1. **Resumo manual divergente.** As telas de resumo devem calcular os totais a partir da base consolidada e deixar claro se contam pessoas, cadastros ou vínculos.
2. **Duplicação de registros entre visões.** A mesma informação aparece em abas territoriais e de dobradas. É preciso conciliar os registros antes de criar pessoas no banco.
3. **Cabeçalhos diferentes.** Paty do Alferes exige mapeamento específico. Os dois campos “Contato” precisam de nomes inequívocos no sistema.
4. **Conteúdo aparentemente deslocado.** `Paraty!D3:D6` está vazio, enquanto `E3:E6` contém textos com aparência de nomes. A ocorrência se repete em `Dani Cunha!E154:F157`. A hipótese de deslocamento é forte, mas a correção deve ser revisada preservando o original.
5. **Liderança ausente.** Além das quatro linhas de Paraty, `Rio de Janeiro!D94` está vazio. A ocorrência não pode ser descartada só por falta desse campo.
6. **Nomes e localidades sem catálogo.** O índice usa “Casimiro de Abreu” e a aba usa “Casemiro de Abreu”; “Serfiotes” aponta para “Serfiotis”; “Gutemberg” aponta para “Gutembertg Reis”. Um cadastro de nomes canônicos e variantes deve manter a grafia original para rastreabilidade.
7. **Localidades repetidas no índice.** `>>COSTA VERDE<<!A4` e `A7` trazem Itaguaí com capitalização diferente. Isso não deve criar duas localidades.
8. **Navegação incompleta.** O hiperlink de `Mendes!I2` aponta para `null!A1`, destino inexistente. Mendes e Teresópolis têm abas, mas não possuem links de entrada correspondentes nos seus índices regionais.
9. **Campos livres e ausência de controles.** Telefones, nomes e vínculos não são validados de forma abrangente. Formatação visual não é regra de integridade.
10. **Divergência em Serfiotis.** `Serfiotis!D3` contém “ENEUSEA” em Contato e `E3` contém “CALIFORNIA” em Liderança. Os mesmos textos aparecem sob Liderança e Região em `Barra do Piraí!D59:E59`, com distribuição diferente de articulador e coordenador. A correção depende de revisão do registro completo.

## Cobertura e padronização de localidades

Os oito índices regionais contêm 90 entradas de localidade, correspondentes a 89 textos distintos após normalização. A diferença decorre da repetição de Itaguaí. Todas as 54 abas territoriais têm uma entrada correspondente nos índices. Há 35 entradas sem aba própria, com quantidade vazia ou zero. Esses números descrevem a cobertura do arquivo e não certificam um catálogo oficial completo.

Nas dobradas, oito ocorrências de localidade não correspondem ao nome de uma aba territorial nem após normalizar espaços, acentos e caixa: “CACHOEIRA DE MACACU”, “CAMPOS DOS GOYTACASES” (duas), “CASEMIRO DE ABEU”, “COMENDADOR LEVY GASPARIAM”, “ENGENHEIRO PAULO DE FRONTIM” e “PATY DO ALVERES” (duas). São candidatos a equivalência cadastral, a confirmar, e não localidades novas a criar automaticamente.

Em todo o arquivo, 890 células textuais contêm espaços externos e 10 contêm somente espaços. As contagens incluem visões repetidas. Normalizar espaços facilita comparações, mas não resolve identidade nem divergências de conteúdo.

## Implicações administrativas para o futuro sistema

Uma base única deve guardar os cadastros e seus vínculos. As visualizações por território e por dobrada devem consultar essa mesma base. O nome da aba deixa de carregar informação escondida e passa a ser um campo ou relacionamento explícito.

É necessário separar **pessoa**, **papel exercido**, **localidade**, **contato** e **vínculo**. Assim, uma pessoa não precisa ser cadastrada novamente por aparecer em outra aba. O sistema deve conservar arquivo, aba e linha de origem para explicar de onde veio cada informação.

Os dados não permitem concluir um número exato de pessoas únicas, uma quantidade de eleitores ou votos, nem o status atual de qualquer vínculo. Esses conceitos não podem ser criados a partir das contagens de linhas.

## Limites desta análise

Todas as abas e células com conteúdo foram extraídas, os recursos estruturais foram inventariados e os três tipos principais de apresentação foram inspecionados visualmente. Os números foram recontados de maneira independente. Como não existem fórmulas, não havia cálculo de Excel a recalcular.

A leitura não confirma a titularidade dos telefones, a identidade das pessoas, a atualidade dos vínculos ou a correção factual de cada cadastro. O conteúdo do áudio e os requisitos derivados estão no documento de análise integrada.
