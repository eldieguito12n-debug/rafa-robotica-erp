import os, re

routes_dir = r'c:\Users\Diego\OneDrive\Desktop\RoboLabERP\backend\app\api\routes'
pattern1 = re.compile(r'log_activity\((.*?),\s*data\.model_dump\(\)\)')
pattern2 = re.compile(r'log_activity\((.*?),\s*data\.model_dump\(exclude_unset=True\)\)')

for fname in os.listdir(routes_dir):
    if not fname.endswith('.py'): continue
    path = os.path.join(routes_dir, fname)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = pattern1.sub(r"log_activity(\g<1>, data.model_dump(mode='json'))", content)
    new_content = pattern2.sub(r"log_activity(\g<1>, data.model_dump(mode='json', exclude_unset=True))", new_content)
    
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {fname}')
