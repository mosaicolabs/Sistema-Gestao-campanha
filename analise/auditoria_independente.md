# Auditoria da planilha para migração

Fonte: `Campanha_EA_2026_REV-006.xlsx`, recebida em 10/09/2026. Esta auditoria leu as 80 abas e não alterou o arquivo original. As referências abaixo usam `Aba!Célula` ou `Aba!Intervalo`.

Os dados permitem preparar uma importação, mas os totais atuais e as cópias entre abas precisam de conciliação. **681 linhas municipais não equivalem a 681 pessoas únicas.** As 739 linhas das abas nominadas incluem reproduções dos mesmos registros, um par repetido e quatro blocos adicionais idênticos.

## Critérios usados

- Linha de cadastro: linha 3 em diante com ao menos um conteúdo em A:H após retirar espaços externos. Linhas apenas formatadas e textos compostos só de espaços não contam.
- Estruturas: 9 índices, 54 abas locais e 17 abas nominadas presentes no bloco “DOBRADAS” do índice principal. “Municipal” neste relatório descreve a organização do arquivo; não certifica a classificação geográfica oficial de cada localidade.
- Campos comparados: localidade, articulador, coordenador, primeiro contato, liderança, região local, segundo contato, rótulo de “Dep Federal” e religião. Em abas nominadas, o rótulo é o título B1. Em abas municipais, a localidade vem do nome da aba.
- Antes de comparar registros, retiraram-se espaços externos, reduziram-se sequências de espaços, equipararam-se maiúsculas/minúsculas e acentos. Não se removeram títulos pessoais nem se equipararam apelidos ou grafias diferentes.
- Em `Paty do Alferes!E2:F2`, “Contato” e “Região” aparecem na ordem inversa das demais abas. A auditoria respeitou esses cabeçalhos.
- Telefone: inspeção de preenchimento, tipo textual e quantidade de dígitos, aceitando 10 ou 11 dígitos após eventual código 55. Isso não confirma titularidade ou funcionamento.
- Ausência é uma lacuna de informação, não necessariamente uma violação de regra obrigatória. A obrigatoriedade dos campos ainda depende do gestor.

## 1. Totais desatualizados

O índice principal informa **672** em `>>RIO DE JANEIRO<<!B11`. A soma das linhas preenchidas nas 54 abas locais é **681**, diferença de **9**. Os subtotais e totais estão gravados como valores, sem fórmulas de atualização.

| Localidade | Índice | Linhas existentes | Evidência |
|---|---:|---:|---|
| Angra dos Reis | 9 | 8 | `>>COSTA VERDE<<!B3`; `Angra dos Reis!A3:H10` |
| Itaguaí | Em branco | 1 | `>>COSTA VERDE<<!B4` e `B7`; `Itaguaí!A3:H3` |
| Volta Redonda | 161 | 164 | `>>SUL FLUNINENSE<<!B15`; linhas preenchidas na aba `Volta Redonda` |
| Paty do Alferes | 1 | 6 | `>>CENTRO SUL<<!B9`; `Paty do Alferes!A3:H8` |
| Teresópolis | Em branco | 1 | `>>SERRANA<<!B16`; `Teresópolis!A3:H3` |

A diferença de Angra e a ausência de Itaguaí se compensam no subtotal da Costa Verde, que permanece em 13. Assim, um subtotal conciliado pode esconder erros nas parcelas.

| Índice regional | Soma das quantidades gravadas | Linhas locais correspondentes |
|---|---:|---:|
| Costa Verde | 13 | 13 |
| Sul Fluminense | 365 | 368 |
| Metropolitana | 185 | 185 |
| Noroeste Fluminense | 0 | 0 |
| Norte Fluminense | 5 | 5 |
| Região dos Lagos | 25 | 25 |
| Serrana | 13 | 14 |
| Centro Sul | 66 | 71 |
| Total | 672 | 681 |

Não se interpretou ausência de cadastro como ausência de pessoas ou de atividade na localidade.

## 2. Blocos reproduzidos em quatro abas

`Vinicius Farah!A22:H58` contém **37 linhas**. O conteúdo das oito colunas dessas linhas é **exatamente igual, sem normalização**, ao dos mesmos intervalos em:

- `Marta Rocha!A22:H58`;
- `Sostenes!A22:H58`;
- `Abraão!A22:H58`;
- `Luciano Vieira!A22:H58`.

Cada uma das 37 linhas também encontra uma correspondência municipal única pelos oito campos comuns, e as 37 correspondências municipais têm o rótulo “VINICIUS FARAH” em “Dep Federal”. Esse conjunto constitui forte indício de resíduo de cópia entre abas. A origem histórica da cópia e a validade de eventuais vínculos múltiplos precisam ser confirmadas pelo gestor.

| Aba | Quantidade no índice principal | Linhas preenchidas na aba | Diferença |
|---|---:|---:|---:|
| Marta Rocha | 11 (`B22`) | 48 | 37 |
| Sostenes | 6 (`B23`) | 43 | 37 |
| Abraão | 1 (`B24`) | 38 | 37 |
| Luciano Vieira | 2 (`B25`) | 39 | 37 |
| Total das diferenças | | | **148** |

O total do bloco “DOBRADAS” é **591** em `>>RIO DE JANEIRO<<!B30`. As 17 abas nominadas contêm **739** linhas. A diferença é exatamente **148 = 4 × 37**. As quantidades das outras 13 abas nominadas coincidem com o índice. Excluir os quatro blocos suspeitos faria as contagens baterem, mas isso **não provaria** que todos os registros restantes são únicos ou corretos.

## 3. Duplicidade e repetição entre visões

| Critério | Resultado | Interpretação |
|---|---|---|
| Todos os nove campos normalizados, somente abas locais | Nenhuma linha completa repetida | Não permite concluir que não há pessoas repetidas |
| Todos os nove campos normalizados, somente abas nominadas | 1 grupo, 2 linhas | `Wellington José!A11:H12` é um par repetido completo |
| Todos os nove campos normalizados, todas as abas de cadastro | 455 grupos, 911 ocorrências | Inclui cópias esperadas entre a visão local e a visão nominada; não são 455 pessoas duplicadas confirmadas |
| Oito campos comuns, excluindo o rótulo da aba nominada | 545 grupos compartilhados | 545 linhas municipais correspondem a 694 ocorrências nas abas nominadas |

Pelo último critério, **136 linhas municipais** e **45 linhas de abas nominadas** não têm correspondência exata na outra visão. Esse resultado é uma fila de conciliação, não uma contagem de registros “perdidos”: diferenças de escrita, campos deslocados, conteúdo ausente e rótulos divergentes podem impedir o encontro.

Nas abas locais há **13 pares** com o mesmo texto normalizado de liderança na mesma localidade, mas com outros campos diferentes. Devem ser revisados, sem fusão automática:

| Referências | Campos divergentes |
|---|---|
| `Barra Mansa!D30` e `D35` | Região local |
| `Barra do Piraí!D10` e `D44` | Coordenador e região local |
| `Barra do Piraí!D32` e `D51` | Coordenador |
| `Porto Real!D6` e `D13` | Articulador e campo religião |
| `Rio de Janeiro!D6` e `D99` | Região local, contato e rótulo Dep Federal |
| `Rio de Janeiro!D10` e `D101` | Região local, contato e rótulo Dep Federal |
| `Rio de Janeiro!D21` e `D95` | Região local e contato |
| `Rio de Janeiro!D53` e `D107` | Articulador, contato e campo religião |
| `Volta Redonda!D7` e `D121` | Região local |
| `Volta Redonda!D22` e `D150` | Coordenador, região local, rótulo Dep Federal e campo religião |
| `Volta Redonda!D110` e `D140` | Região local |
| `Volta Redonda!D113` e `D145` | Coordenador e região local |
| `Volta Redonda!D131` e `D147` | Coordenador e região local |

Há também **5 grupos de telefone repetido**, envolvendo **11 linhas municipais**. Um exemplo exige atenção especial: `Iguaba Grande!F14` e `F16` contêm o mesmo telefone, com textos distintos em `D14` e `D16`. Nos demais casos, o telefone aparece em localidades diferentes ou com variações de nome. Um contato pode ser compartilhado; telefone também não é chave única suficiente.

## 4. Campos deslocados e cadastros incompletos

### Deslocamento aparente em Paraty

`Paraty!D3:D6`, sob “Liderança”, está vazio. `Paraty!E3:E6`, sob “Região”, contém quatro textos com aparência de nomes pessoais. A mesma disposição é reproduzida em `Dani Cunha!E154:F157`. Importar essas linhas literalmente criaria cadastros sem liderança e colocaria possíveis nomes no campo territorial. É necessária validação da intenção original antes de mover os valores.

### Deslocamento em Serfiotis

`Serfiotis!D3` contém “ENEUSEA” sob “Contato”; `E3` contém “CALIFORNIA” sob “Liderança”. Em `Barra do Piraí!A59:H59`, os mesmos textos aparecem em `D59` (“Liderança”) e `E59` (“Região”), e a distribuição de articulador/coordenador também difere. Há evidência concreta de divergência entre as visões, a resolver com o gestor.

### Linha sem identificação da liderança

`Rio de Janeiro!A94:H94` contém apenas articulador em `A94`. Essa linha entra na contagem de linhas preenchidas, mas não deve gerar automaticamente um cadastro completo de liderança.

### Preenchimento nas 681 linhas locais

| Campo | Preenchido | Ausente | Observação |
|---|---:|---:|---|
| Articulador | 679 | 2 | Ausentes em `Petrópolis!A6` e `Rio de Janeiro!A15` |
| Coordenador | 315 | 366 | Ausência não prova que coordenador seja obrigatório |
| Primeiro Contato, junto ao Coordenador | 0 | 681 | Papel do campo precisa ser confirmado |
| Liderança | 676 | 5 | Quatro linhas de Paraty e uma do Rio de Janeiro |
| Região local | 361 | 320 | Considera a inversão de cabeçalho em Paty do Alferes |
| Segundo Contato, junto à Liderança | 160 | 521 | Cerca de 23,5% das linhas têm preenchimento |
| Dep Federal | 640 | 41 | Rótulos textuais, sem chave de cadastro |
| Religião | 186 | 495 | Inventário de presença do campo; não foi usado para classificação ou priorização de pessoas |

Os 160 contatos locais preenchidos são textos com comprimento numérico compatível com a verificação sintática adotada. Não se verificou se os números funcionam. Nas abas nominadas, há 143 segundos contatos preenchidos; no primeiro contato, a única célula preenchida é `Serfiotis!D3`, que contém texto de nome, não telefone.

## 5. Cobertura, navegação e nomenclatura

Foram encontrados **156 hiperlinks de células**. Um destino de aba não existe: `Mendes!I2` aponta para `null!A1`.

Os oito índices regionais possuem **90 entradas de localidades**, incluindo a repetição de Itaguaí em `>>COSTA VERDE<<!A4` e `A7`. São **89 textos de localidades distintos** após normalização. Todas as 54 abas locais estão representadas por uma entrada do índice, usando o destino do hiperlink para resolver nomes divergentes. Duas abas estão representadas sem hiperlink de acesso: `Mendes` e `Teresópolis`.

Há **35 entradas de localidades sem aba própria**. Seus quantitativos são vazios ou zero. Isso revela a cobertura do arquivo, mas não prova falha cadastral. O catálogo de localidades do sistema deverá ser definido separadamente, sem tomar essa lista parcial como cadastro oficial completo.

Exemplos de nomes divergentes que afetam a importação:

- `>>REGIÃO DOS LAGOS<<!A7` mostra “Casimiro de Abreu”, mas o hiperlink aponta para a aba `Casemiro de Abreu`.
- A aba regional se chama `>>SUL FLUNINENSE<<`, enquanto o título `A1` usa “SUL FLUMINENSE”.
- `>>RIO DE JANEIRO<<!A20` mostra “Serfiotes” e aponta para `Serfiotis`.
- `>>RIO DE JANEIRO<<!A28` mostra “Gutemberg”, o destino é `Gutembertg Reis` e `Gutembertg Reis!B1` usa “GUTEMBERG REIS”.
- Nas abas nominadas, há 8 ocorrências de localidades que não correspondem ao nome de uma aba local nem após normalização de espaços, acentos e caixa: “CACHOEIRA DE MACACU”, “CAMPOS DOS GOYTACASES” (2), “CASEMIRO DE ABEU”, “COMENDADOR LEVY GASPARIAM”, “ENGENHEIRO PAULO DE FRONTIM” e “PATY DO ALVERES” (2).

Em todo o arquivo, **890 células de texto** possuem espaços externos e **10 células** contêm somente espaços. Essas contagens incluem visões repetidas. A limpeza deve preservar o valor original e registrar a transformação; não deve trocar grafias de nomes automaticamente.

## 6. Consequências para a importação

1. **Preservar a procedência.** Cada linha importada deve guardar arquivo, aba, linha, valores originais e lote de importação. Isso permite rastrear qualquer correção.
2. **Mapear cabeçalhos antes de ler posições.** Há duas colunas “Contato” e uma inversão em Paty do Alferes. Um importador que usa somente a posição gravará dados no campo errado.
3. **Definir a fonte principal e conciliar as visões.** As abas locais parecem uma base de trabalho mais apropriada, mas essa escolha ainda deve ser confirmada pelo gestor. As abas nominadas podem preservar dados diferentes e não devem ser descartadas silenciosamente.
4. **Separar pessoas, contatos e vínculos.** A mesma pessoa ou telefone pode aparecer em mais de uma localidade ou relação administrativa. Usar nome ou telefone como chave única produziria fusões indevidas.
5. **Revisar os quatro blocos de 37 linhas e os deslocamentos antes de criar vínculos.** O título de uma aba não basta para confirmar que cada linha pertence a ela.
6. **Gerar totais a partir da base conciliada.** Os índices atuais são valores fixos. O sistema deve distinguir quantidade de linhas, pessoas únicas e relações cadastradas.
7. **Registrar pendências de dados.** Importação parcial deve distinguir informação ausente de valor zero e de campo não aplicável. Não preencher lacunas com suposições.
8. **Manter campos sensíveis fora das regras operacionais automáticas.** A presença de “Religião” e de rótulos políticos na fonte não autoriza inferir características nem classificar ou priorizar pessoas. A finalidade e a necessidade de cada campo devem ser definidas no projeto.

Não foram encontradas fórmulas, erros armazenados de fórmula ou tabelas estruturadas. A única validação de dados é uma lista “Sim,Não” em `>>CENTRO SUL<<!E3`, fora dos cadastros principais. Não há mecanismos de validação nos campos operacionais analisados.

## Validação e limites

Os totais foram calculados diretamente das células e conciliados com os índices. A igualdade dos quatro blocos foi verificada célula por célula nos valores originais. Não houve correções na planilha, confirmação de identidade, validação geográfica externa, teste de telefones ou decisão sobre a veracidade dos vínculos. Os achados documentam a qualidade e a consistência do arquivo recebido.

SHA-256 da fonte lida: `a04f4117cb5fcf07cb2f5bd4a8cdefd17fe58ef2c0bfcd06afc487b1ea9534f0`.
