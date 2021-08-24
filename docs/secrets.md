# Secrets

Secrets can be defined using a `secrets.json` file in the root of the project. The contents will look like this:

```json
[
  "bigcommerce-access-token",
  "name-of-my-secret-in-gcp"
]
```

Each value in the array will create a secret in GCP Secret Manager. They will be populated with `INITIAL_VALUE` by default, this means you'll need to login and modify the secret within the GCP projects yourself to configure them with the correct value.
