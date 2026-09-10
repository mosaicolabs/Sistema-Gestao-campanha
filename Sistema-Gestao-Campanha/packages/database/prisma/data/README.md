# Manifesto de localidades da campanha

Este diretório guarda o manifesto versionado usado pela normalização de localidades. O arquivo `campanha-ea-2026-locality-manifest.json` foi gerado a partir das seções **Variações de nomes para revisão** e **Possíveis aliases para validação manual** (linhas 273–344) do relatório `Campanha_EA_2026_articuladores_por_cidade.md`, fornecido pelo usuário.

O campo `sourceSha256` identifica exatamente o relatório utilizado. `entries` contém apenas agrupamentos determinísticos de caixa, acentuação e espaços. `manualCandidates` contém aproximações de grafia que continuam pendentes e não podem virar alias ativo sem decisão registrada pelo gestor.

O relatório anexado não informa a aba, a linha ou o `rowHash` da planilha original. Por isso, o manifesto não substitui `SourceOccurrence`; ele serve como referência de normalização e deve ser aplicado em conjunto com o lote importado que preserva a origem.
