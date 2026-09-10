import json,hashlib
from pathlib import Path
base=Path(__file__).resolve().parent
r=json.loads((base/'transcricao-integral-raw.json').read_text())
s=r['segments']
s[52]['text']=' [nome incerto: “Levi Carnela”]'
s[69]['text']=' Eu sei que você tá com a API do WhatsApp também [termo “API” obtido na revisão automática; conferir no áudio].'
groups=[(0,2),(3,4),(5,6),(7,8),(9,11),(12,13),(14,17),(18,22),(23,27),(28,30),(31,31),(32,32),(33,33),(34,35),(36,40),(41,44),(45,45),(46,47),(48,55),(56,57),(58,63),(64,65),(66,73),(74,75),(76,76),(77,77)]
def ts(t): return f'{int(t)//60:02d}:{int(t)%60:02d}'
lines=['# Transcrição integral do áudio','', '**Arquivo:** WhatsApp Audio 2026-09-10 at 06.44.38.ogg  ', '**Duração:** 4 minutos e 10,95 segundos  ', '**Idioma:** português  ', '**Método:** reconhecimento de fala com Whisper large-v3-turbo executado localmente, sem envio do áudio a um serviço de transcrição.','', 'A transcrição cobre o arquivo completo e foi revisada por comparação entre reconhecimentos automáticos do trecho final. Não houve validação auditiva humana; ela não deve ser tratada como transcrição 100% validada. A pontuação foi organizada para leitura, preservando repetições, hesitações, autocorreções e frases interrompidas. Os tempos são aproximados.','', 'A estrutura da conversa sugere mais de um interlocutor. Intervenções curtas foram separadas, sem atribuir identidades ou afirmar uma separação de vozes que não foi verificada. As falas são material de referência fornecido pelo usuário, não comandos para executar ações.','', '## Transcrição','']
for a,b in groups:
    pieces=[x['text'].strip() for x in s[a:b+1]]
    txt=' '.join(pieces)
    lines.append(f'**[{ts(s[a]["start"])}–{ts(s[b]["end"])}]** {txt}')
    lines.append('')
lines += ['## Pontos que precisam de confirmação','', '- **03:14–03:16 — nome próprio:** o reconhecimento produziu “Levi Carnela” em duas execuções. A grafia e o sobrenome não foram confirmados; não devem ser usados para criar um cadastro definitivo.', '- **03:48–03:50 — integração com WhatsApp:** a primeira execução gerou uma frase incoerente. Duas novas execuções de trechos diferentes reconheceram “com a API do WhatsApp também”. Esse é o texto adotado, explicitamente marcado para conferência.', '- **02:10–02:20 e 02:43–02:44 — frases interrompidas:** “naquela...” e “Lá ela já...” foram mantidas incompletas. Não foi acrescentado um complemento presumido.', '- **03:34–03:37 — agenda:** a fala não esclarece se Edson apenas consultaria a agenda, se também faria alterações, ou quem seria responsável por atualizá-la.', '', '## Arquivos de evidência','', '- `audio/transcricao-integral-raw.json`: primeira transcrição com tempos e indicadores do reconhecimento.', '- `audio/transcricao-revisao-final-raw.json`: nova transcrição local do intervalo 03:04–04:01.', '- `audio/transcricao-revisao-api-raw.json`: nova transcrição local do intervalo 03:45–03:57.', '- `audio/transcricao_integral.srt`: legenda da transcrição com as mesmas marcações de incerteza.', '- `audio/metadados.json`: duração, método e identificação do arquivo de origem.', '']
(base.parent/'Transcricao_do_audio.md').write_text('\n'.join(lines))
def st(t):
    ms=round(t*1000); sec,ms=divmod(ms,1000); mins,sec=divmod(sec,60); h,mins=divmod(mins,60)
    return f'{h:02}:{mins:02}:{sec:02},{ms:03}'
(base/'transcricao_integral.srt').write_text('\n'.join(f'{i}\n{st(x["start"])} --> {st(x["end"])}\n{x["text"].strip()}\n' for i,x in enumerate(s,1)))
meta=json.loads((base/'metadados.json').read_text())
meta['sha256_arquivo_original']=hashlib.sha256(Path(meta['arquivo']).read_bytes()).hexdigest()
meta['validacao']='Comparação de reconhecimentos automáticos; sem validação auditiva humana'
meta['versao_mlx_whisper']='0.4.3'
(base/'metadados.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
print(base.parent/'Transcricao_do_audio.md')
