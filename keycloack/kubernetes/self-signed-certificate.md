# Add TLS encryption with self-signed certificate to enable HTTPs

## Create self-signed certificate
```
openssl req \
-x509 -newkey rsa:4096 -sha256 -nodes \
-keyout tls.key -out tls.crt \
-subj "/CN=keycloak.example.com" -days 365

```

## Create kubernetes secret with those keys
```
kubectl create secret tls ingress-keycloak \
--cert=tls.crt \
--key=tls.key
```