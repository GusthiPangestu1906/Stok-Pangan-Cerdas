import os
import sys
import json
import re
import base64

raw = os.environ.get('FIREBASE_SECRET', '').strip()

if not raw:
    print('ERROR: FIREBASE_SECRET is empty! Please configure FIREBASE_SERVICE_ACCOUNT_STOK_PANGAN_CERDAS in GitHub Secrets.', file=sys.stderr)
    sys.exit(1)

# 1. Try Base64 decode if raw looks like base64
try:
    clean_b64 = ''.join(raw.split())
    clean_b64 += '=' * (-len(clean_b64) % 4)
    decoded = base64.b64decode(clean_b64).decode('utf-8', errors='ignore')
    if 'private_key' in decoded or 'BEGIN' in decoded:
        raw = decoded
except Exception:
    pass

# 2. Extract private key from raw
pk_match = re.search(r'-----BEGIN[^-]*PRIVATE KEY-----(.*?)-----END[^-]*PRIVATE KEY-----', raw, re.DOTALL)
if not pk_match:
    # Try finding base64 key directly if header was missing
    print('ERROR: Could not find BEGIN PRIVATE KEY header in secret. Please ensure the full JSON is pasted.', file=sys.stderr)
    sys.exit(1)

raw_body = pk_match.group(1)
clean_body = raw_body.replace('\\n', '').replace('\n', '').replace('\r', '').replace(' ', '').replace('\t', '')
chunks = [clean_body[i:i+64] for i in range(0, len(clean_body), 64)]
clean_pk = '-----BEGIN PRIVATE KEY-----\n' + '\n'.join(chunks) + '\n-----END PRIVATE KEY-----\n'

# 3. Extract metadata
email_match = re.search(r'"client_email":\s*"([^"]+)"', raw)
project_match = re.search(r'"project_id":\s*"([^"]+)"', raw)
pk_id_match = re.search(r'"private_key_id":\s*"([^"]+)"', raw)
client_id_match = re.search(r'"client_id":\s*"([^"]+)"', raw)

sa = {
    'type': 'service_account',
    'project_id': project_match.group(1) if project_match else 'stok-pangan-cerdas',
    'private_key_id': pk_id_match.group(1) if pk_id_match else '',
    'private_key': clean_pk,
    'client_email': email_match.group(1) if email_match else 'firebase-adminsdk-fbsvc@stok-pangan-cerdas.iam.gserviceaccount.com',
    'client_id': client_id_match.group(1) if client_id_match else '',
    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
    'token_uri': 'https://oauth2.googleapis.com/token',
    'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
    'universe_domain': 'googleapis.com'
}

out_path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/sa.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(sa, f, indent=2)

print(f'Successfully prepared clean service account JSON at: {out_path}')

# Output to GITHUB_OUTPUT if available
gh_output = os.environ.get('GITHUB_OUTPUT')
if gh_output:
    compact_json = json.dumps(sa)
    with open(gh_output, 'a', encoding='utf-8') as f:
        f.write(f'sa_json={compact_json}\n')
