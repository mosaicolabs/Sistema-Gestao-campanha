import os
from pathlib import Path
base = Path(__file__).resolve().parent
os.environ['HF_HOME'] = str(base / '.hf-cache')
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
os.environ['HF_HUB_DISABLE_XET'] = '1'
from huggingface_hub import snapshot_download
path = snapshot_download(repo_id='mlx-community/whisper-large-v3-turbo', local_dir=base/'model-large-v3-turbo', allow_patterns=['*.json', '*.safetensors', '*.npz'])
print(path, flush=True)
