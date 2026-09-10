import os, json, time, argparse
from pathlib import Path
base = Path(__file__).resolve().parent
os.environ['HF_HOME'] = str(base / '.hf-cache')
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
os.environ['NUMBA_CACHE_DIR'] = str(base / '.numba-cache')
import av
import numpy as np
parser=argparse.ArgumentParser()
parser.add_argument('--start',type=float,default=0)
parser.add_argument('--end',type=float)
parser.add_argument('--suffix',default='integral')
parser.add_argument('--prompt')
args=parser.parse_args()
source=Path('/Users/joaomvalente/Downloads/WhatsApp Audio 2026-09-10 at 06.44.38.ogg')
container = av.open(str(source))
resampler = av.audio.resampler.AudioResampler(format='s16',layout='mono',rate=16000)
parts=[]
for frame in container.decode(audio=0):
    for resampled in resampler.resample(frame):
        parts.append(resampled.to_ndarray().reshape(-1))
for resampled in resampler.resample(None):
    parts.append(resampled.to_ndarray().reshape(-1))
wave=np.concatenate(parts).astype(np.float32)/32768.0
print('DURATION_SECONDS',len(wave)/16000,flush=True)
np.save(base/'waveform-16khz.npy',wave)
metadata={'arquivo':str(source),'duracao_segundos':len(wave)/16000,'sample_rate_processamento':16000,'modelo':'mlx-community/whisper-large-v3-turbo','processamento':'inteiramente local, sem envio do áudio','idioma':'pt'}
(base/'metadados.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2))
if args.start or args.end:
    wave=wave[int(args.start*16000):int(args.end*16000) if args.end else None]
import mlx_whisper
started=time.time()
result = mlx_whisper.transcribe(wave,path_or_hf_repo=str(base/'model-large-v3-turbo'),language='pt',task='transcribe',verbose=True,word_timestamps=True,temperature=0.0,condition_on_previous_text=False,initial_prompt=args.prompt)
for s in result.get('segments',[]):
    s['start']+=args.start
    s['end']+=args.start
    for w in s.get('words',[]):
        w['start']+=args.start
        w['end']+=args.start
(base/f'transcricao-{args.suffix}-raw.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('ELAPSED_SECONDS',time.time()-started,flush=True)
print('OUTPUT',str(base/f'transcricao-{args.suffix}-raw.json'),flush=True)
