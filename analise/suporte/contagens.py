from pathlib import Path
import json, collections, re, unicodedata
p=Path(__file__).parent
d=json.loads((p/'planilha_extraida.json').read_text())
def nonempty(x): return x is not None and str(x).strip()!=''
stats=[]
records=[]
for idx,s in enumerate(d['sheets']):
    if idx<9: continue
    rows=collections.defaultdict(dict)
    for c in s['cells']:
        col=re.match('[A-Z]+',c['cell'])[0]
        row=int(re.search(r'\d+',c['cell'])[0])
        if row>2 and col<'I': rows[row][col]=c['value']
    typ='territorial' if idx<63 else 'dobrada'
    maps={'A':'articulador','B':'coordenador','C':'contato_coordenador','D':'lideranca','E':'regiao_local','F':'contato_lideranca','G':'dobrada','H':'religiao'} if typ=='territorial' else {'A':'localidade','B':'articulador','C':'coordenador','D':'contato_coordenador','E':'lideranca','F':'regiao_local','G':'contato_lideranca','H':'religiao'}
    if s['name']=='Paty do Alferes': maps['E'],maps['F']=maps['F'],maps['E']
    counts=collections.Counter()
    filled=0
    leaderrows=[]
    for row,vals in rows.items():
        if not any(nonempty(x) for x in vals.values()): continue
        filled+=1
        r={'sheet':s['name'],'row':row,'type':typ,**{name:vals.get(col) for col,name in maps.items()}}
        if typ=='territorial':r['localidade']=s['name']
        else:r['dobrada']=s['name']
        records.append(r)
        if nonempty(r.get('lideranca')): leaderrows.append(row)
        for name in maps.values():
            if nonempty(r.get(name)):counts[name]+=1
    stats.append({'sheet':s['name'],'type':typ,'rows':filled,'leader_rows':len(leaderrows),'last_data_row':max(rows.keys()) if rows else 2,'populated':dict(counts)})
(p/'registros_intermediarios.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
(p/'contagens_abas.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2))
for typ in ['territorial','dobrada']:
    group=[s for s in stats if s['type']==typ]
    print(typ, len(group),'abas;',sum(s['rows'] for s in group),'linhas;',sum(s['leader_rows'] for s in group),'com liderança')
    counts=collections.Counter()
    for s in group:counts.update(s['populated'])
    print(dict(counts))
print(json.dumps([{'aba':s['sheet'],'linhas':s['rows'],'com_lideranca':s['leader_rows']} for s in stats],ensure_ascii=False,indent=2))
