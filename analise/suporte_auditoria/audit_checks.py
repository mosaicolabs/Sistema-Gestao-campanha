import audit
from collections import defaultdict,Counter
import json
a=audit.data; records=audit.records; w=audit.w; norm=audit.norm; ref=audit.ref
o={}
copies=['Marta Rocha','Sostenes','Abraão','Luciano Vieira']
base=[[w['Vinicius Farah'].cell(r,c).value for c in range(1,9)] for r in range(22,59)]
o['same_block']={s:base==[[w[s].cell(r,c).value for c in range(1,9)] for r in range(22,59)] for s in copies}
o['same_block_count']=len(base)
o['same_block_origins']=[]
for r in records:
    if r['sheet']=='Vinicius Farah' and 22<=r['row']<=58:
        matches=[x for x in records if x['type']=='municipio' and all(x['norm'][i]==r['norm'][i] for i in [0,1,2,3,4,5,6,8])]
        o['same_block_origins'].append(dict(source=ref(r['sheet'],r['row']),municipal=[ref(x['sheet'],x['row']) for x in matches],label=[x['values'][7] for x in matches]))
municipality_names={norm(s):s for s in a['groups']['municipio']}
index_entries=[]
for s in w:
    if s.title not in a['groups']['indice'] or s.title=='>>RIO DE JANEIRO<<':continue
    for row in s.iter_rows(min_row=3):
        c=row[0]
        if not norm(c.value):continue
        target=next((l['target_sheet'] for l in a['links'] if l['source']==ref(s.title,c.coordinate)),None)
        if not target:target=municipality_names.get(norm(c.value))
        index_entries.append(dict(sheet=s.title,cell=c.coordinate,label=c.value,quantity=row[1].value,target=target,records=a['sheet_counts'].get(target) if target else None,hyperlink=bool(c.hyperlink)))
o['index_entries']=index_entries
o['index_without_sheet']=[x for x in index_entries if not x['target']]
o['sheets_without_link']=[s for s in a['groups']['municipio'] if not any(x['target']==s and x['hyperlink'] for x in index_entries)]
o['sheets_without_entry']=[s for s in a['groups']['municipio'] if not any(x['target']==s for x in index_entries)]
index_names=defaultdict(list)
for x in index_entries:index_names[norm(x['label'])].append(x)
o['duplicate_index_names']=[v for v in index_names.values() if len(v)>1]
o['mismatching_index_counts']=[x for x in index_entries if x['target'] and x['quantity']!=x['records']]
o['regions']={s:dict(index_sum=sum(x['quantity'] or 0 for x in index_entries if x['sheet']==s),record_sum=sum(a['sheet_counts'][t] for t in set(x['target'] for x in index_entries if x['sheet']==s and x['target']))) for s in a['groups']['indice'][1:]}
o['totals']={'index_main_regions':sum(w.worksheets[0].cell(r,2).value for r in range(3,11)), 'index_main_recortes':sum(w.worksheets[0].cell(r,2).value for r in range(13,30))}
o['view_city_names_unmatched']=dict(Counter(r['values'][0] for r in records if r['type']=='recorte' and r['norm'][0] not in municipality_names))
o['municipal_same_city_leader_candidates']=[]
buckets=defaultdict(list)
for r in records:
    if r['type']=='municipio' and r['norm'][4]:buckets[(r['norm'][0],r['norm'][4])].append(r)
for k,v in buckets.items():
    if len(v)>1:o['municipal_same_city_leader_candidates'].append(dict(refs=[ref(r['sheet'],r['row']) for r in v],differences=[i for i in range(9) if len(set(r['norm'][i] for r in v))>1]))
o['municipal_no_articulador']=[ref(r['sheet'],r['coords'][1]) for r in records if r['type']=='municipio' and not r['norm'][1]]
o['validations']=[dict(sheet=s.title,rules=[dict(range=str(d.sqref),type=d.type,formula1=d.formula1,formula2=d.formula2) for d in s.data_validations.dataValidation]) for s in w if s.data_validations.dataValidation]
o['municipal_header_mismatch']=[dict(sheet=s.title,title=s['A1'].value) for s in w if s.title in a['groups']['municipio'] and norm(s.title)!=norm(s['A1'].value)]
audit.OUT.joinpath('checks.json').write_text(json.dumps(o,ensure_ascii=False,indent=2,default=str))
print(json.dumps({k:v for k,v in o.items() if k not in ['index_entries','index_without_sheet','same_block_origins']},ensure_ascii=False,indent=2,default=str))
