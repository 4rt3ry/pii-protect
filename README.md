# pii-protect
Replaces unencrypted phone-based identity verification with a cryptographically enforced, ephemeral authentication channel that defeats MitM interception and social engineering.


# Developer Resources


## Python Virtual Environments

A virtual environment enables you to work on several projects that each require their own versions of a package. 

To create a virtual environment, run the `venv` python module. 
```
python -m venv .venv
```

To activate the virtual environment, source the venv file.
```
source .venv/bin/activate
```

You can verify that the virtual environment is active by locating the active python version.
```
which python

# sample output
# ~/src/sample-project/.venv/bin/python
```

Since the virtual environment is now active, any time you run "pip install" in the current session, the packages will be installed to the virtual environment directory instead of globally.

```
python -m pip install fastapi[standard]

# alternatively
python -m pip install -r requirements.txt
```

To deactivate the virtual environment, run the deactivation script.
```
deactivate
```

## Deploying

```
# navigate to /pii-protect-server/app/
python deploy.py
```

## Certificates

### Generating a key
```
openssl ecparam -name secp384r1 -genkey -noout -out key.pem
```

### Generating a certificate

In production, SAN FQDNS should match the production FQDN instead of localhost.
```
openssl req -x509 -key key.pem -out cert.pem -addext 'subjectAltName=DNS:localhost,DNS:127.0.0.1'
```

