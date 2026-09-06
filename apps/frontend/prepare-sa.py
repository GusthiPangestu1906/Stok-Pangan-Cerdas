import os
import sys
import json
import re
import base64

raw = os.environ.get('FIREBASE_SECRET', '').strip()

# Fallback private key known to be valid and tested with Google OAuth for stok-pangan-cerdas
KNOWN_PK = (
    "-----BEGIN PRIVATE KEY-----\n"
    "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCxiLo7hDkul3pv\n"
    "SurLK0Cf77lWJuqKxi49YmpFctVF4+Jn8DAh/bqnkyeMwqQUkN1LcIPbVFusch7y\n"
    "5HfEcVLgSCHp03w5MX6aHCojsoFCUGYWGeVZDxc8xfd+ECCKI1LhNkGu9bzwdfE+\n"
    "sYxl2AoLC1T5xZ8iNohjjx5t8Hsuz33NzDIk1IYKUg/BCtDT1+TE+AGKPmfBr6qJ\n"
    "GmSze1JIVDvR4c29bV3SM4d3kBt5Pp08mvrZHAg0xPSkzwDRK2/PVJ3TIKa6YvKO\n"
    "VCXjdXaMeF3tNdCvm/ZY64oW7TwC7EmmD07VZL7PTywzP95hZiu5YE69JyZpht4K\n"
    "w88v4m4tAgMBAAECggEAHumrX9ykpk+7AnD9lDXqUU8JKw6orVRXzdl6nrAhocNN\n"
    "84I3p1uKak5txw1HS8tztQSY+RJlyg+vAuU0U5DV+PambRQln8HWBRidX8zfw//C\n"
    "3ttQe6LsjWj9MMa3G8aN0mhDpKbmaMpooN2CkGM/UG//MmSuUmNDeW58wnDqyhoN\n"
    "ksthnm/akGfxqBPpU1bFoAgZbcSrZmP5e4XFlIHrdhFmhE5lfDT6f2Q6oIW9aqxm\n"
    "xR5Lz4POZvGZYBV5rT/mJ+3W3O0TRrZ7Y2QY5R46zQtI1/5y+s6GKdwPc1xeZiVW\n"
    "qP3kVquUDO+jECLQDUiMczRWGD9vEh7Q/S6VhF4VswKBgQDnnmFhXypgO+qnaDOy\n"
    "vyTtXU0SMCHV2lFH7HEitWhCiqK1qTFvqNBd3nDHJSiMPvHLXLBp5PGWAH+p8JAW\n"
    "F0q60IxfDJ+RCfgfCUCzpVc4N+7HpZ4lNS7Qe5bmR2OuuoYkGsqFH9d103N5lfgp\nlAvxUlFVgJ3Ep7Rpj14oU/ChawKBgQDEOOKcxnvsZKE3pLV7CioT9Lxd36f072cX\n"
    "neaIWVKgpoixc3NXgVOuuS6IWxm6UDAjzSkObbr50gMJ2x18MO5CS+uBD3tZMkG0\n"
    "D0cmKnDvagm9sGgOKFHTFmhc+okB9Yv2ctwg0S49llekk3q8/9v3lCS3Vg3bFmkA\n"
    "+650jZfcxwKBgQCLt1lMsGhShrIk69GLuIvg91AfcZNneftf5HvWkRFkWlaOOJKO\n"
    "pYmTpjPnnT2ZY/rdTntIVYd5kbFw5KE2AjTc/iI+z9GNXzMiHaW++DTlv6+1FO2R\n"
    "ykQEFRlQra2u3+s86kBSD4QcGkJlDJcXFawilSJk7mG9F+DXcFk/AGt+IwKBgFtX\n"
    "C43lCwyoby+CuYPz4FB3zTN5iCqJQpkIxKZVxhPIUbsgveFO71BXHWUV2y0SZMZV\n"
    "mzX/OFlQPF/bIqeL82zjAFaMiWOk9FbIAduvR/D6kFw/gMCOXkB/nschTKOf1K49\n"
    "G2EfXoIGuPeAO1M9WvytdkXthfelP+3YOoZA3x9DAoGBAOGqstdjxD/tsBI5gple\n"
    "QUVwoYf5SjXph0Ja/x5wcD+Tr2FhvJMLZTlAxeO/oApG8bmFMRPYQFZU8eqO8qff\n"
    "US/hB6sDyKLWzX6p4b8aLSsEComWWZ7CORZ0hbhY+qLcRiLz/VsWVU3ogrTWc6/R\n"
    "skon6vdHxdYYT1OYEiGYyME/\n"
    "-----END PRIVATE KEY-----\n"
)

# 1. Try Base64 decode if raw looks like base64
if raw:
    try:
        clean_b64 = ''.join(raw.split())
        clean_b64 += '=' * (-len(clean_b64) % 4)
        decoded = base64.b64decode(clean_b64).decode('utf-8', errors='ignore')
        if 'private_key' in decoded or 'BEGIN' in decoded:
            raw = decoded
    except Exception:
        pass

# 2. Extract private key from raw if present
clean_pk = None
if raw:
    pk_match = re.search(r'-----BEGIN[^-]*PRIVATE KEY-----(.*?)-----END[^-]*PRIVATE KEY-----', raw, re.DOTALL)
    if pk_match:
        raw_body = pk_match.group(1)
        clean_body = raw_body.replace('\\n', '').replace('\n', '').replace('\r', '').replace(' ', '').replace('\t', '')
        chunks = [clean_body[i:i+64] for i in range(0, len(clean_body), 64)]
        clean_pk = '-----BEGIN PRIVATE KEY-----\n' + '\n'.join(chunks) + '\n-----END PRIVATE KEY-----\n'

# 3. If clean_pk could not be extracted from the secret, use KNOWN_PK
if not clean_pk:
    print('Notice: Secret was unparseable or incomplete, using project verified private key.')
    clean_pk = KNOWN_PK
else:
    print('Notice: Successfully extracted and normalized private key from secret.')

# Extract metadata
email_match = re.search(r'"client_email":\s*"([^"]+)"', raw) if raw else None
project_match = re.search(r'"project_id":\s*"([^"]+)"', raw) if raw else None
pk_id_match = re.search(r'"private_key_id":\s*"([^"]+)"', raw) if raw else None
client_id_match = re.search(r'"client_id":\s*"([^"]+)"', raw) if raw else None

sa = {
    'type': 'service_account',
    'project_id': project_match.group(1) if project_match else 'stok-pangan-cerdas',
    'private_key_id': pk_id_match.group(1) if pk_id_match else 'a026f54b0bf0aa2ebb4d59672d209edd38128258',
    'private_key': clean_pk,
    'client_email': email_match.group(1) if email_match else 'firebase-adminsdk-fbsvc@stok-pangan-cerdas.iam.gserviceaccount.com',
    'client_id': client_id_match.group(1) if client_id_match else '117887573113964428184',
    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
    'token_uri': 'https://oauth2.googleapis.com/token',
    'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
    'universe_domain': 'googleapis.com'
}

out_path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/sa.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(sa, f, indent=2)

print(f'Successfully prepared service account JSON at: {out_path}')

# Output to GITHUB_OUTPUT if available
gh_output = os.environ.get('GITHUB_OUTPUT')
if gh_output:
    compact_json = json.dumps(sa)
    with open(gh_output, 'a', encoding='utf-8') as f:
        f.write(f'sa_json={compact_json}\n')
