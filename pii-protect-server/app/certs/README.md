
NOTE: All certificates and private keys in this folder are examples only and should not be used in production.

# Generating a key
```
openssl ecparam -name secp384r1 -genkey -noout -out key.pem
```

# Generating a certificate
```
openssl req -x509 -key key.pem -out cert.pem
```

