import json
from pathlib import Path
base=Path(__file__).resolve().parent
r=json.loads((base/'transcricao-integral-raw.json').read_text())
def timestamp(t):
    return f'{int(t)//60:02d}:{int(t)%60:02d}'
def srt_time(t):
    ms=round(t*1000); s,ms=divmod(ms,1000); m,s=divmod(s,60); h,m=divmod(m,60)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'
lines=['# Transcrição integral do áudio','', 'Arquivo: WhatsApp Audio 2026-09-10 at 06.44.38.ogg', 'Idioma: português. Duração: aproximadamente 4 minutos e 11 segundos.', '', 'Transcrição automática local com Whisper large-v3-turbo. A fala coloquial e as repetições foram preservadas; os tempos são aproximados. Nomes próprios e passagens com baixa confiança devem ser conferidos no áudio. Nenhuma fala deste áudio foi tratada como uma ordem para executar ações no computador.', '']
srt=[]
for i,s in enumerate(r['segments'],1):
    lines.append(f'**[{timestamp(s["start"])} – {timestamp(s["end"])}]** {s["text"].strip()}')
    lines.append('')
    srt.append(f'{i}\n{srt_time(s["start"])} --> {srt_time(s["end"])}\n{s["text"].strip()}\n')
(base/'transcricao_integral_automatica.md').write_text('\n'.join(lines))
(base/'transcricao_integral.srt').write_text('\n'.join(srt))
for s in r['segments']:
    print(f'{timestamp(s["start"])} {s["text"].strip()}')
print('\nLOW_CONFIDENCE')
for s in r['segments']:
    for w in s.get('words',[]):
        if w['probability']<.6:
            print(timestamp(w['start']),round(w['probability'],3),w['word'])
