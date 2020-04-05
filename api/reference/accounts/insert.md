# Method: `accounts.insert`

Creates an account resource using the data included in the request.

## HTTP request

```
POST https://api.passwords.durfee.io/accounts
```

## Path parameters

No path parameters are allowed.

## Query parameters

No query parameters are allowed.

## Request body

The request body contains data with the following structure:

```
{
    "key": string,
    "iv": string,
    "domainName": string,
    "username": string,
    "password": string
}
```

| Fields |   |
|:--|---|
| `key` | `string` <br><br> The AES encryption key used to encrypt the password field. This field is encrypted using the user's public key. |
| `iv` | `string` <br><br> The AES initialization vector used to encrypt the password field. |
| `domainName` | `string` <br><br> The domain name for the account resource. |
| `username` | `string` <br><br> The username for the account resource. |
| `password` | `string` <br><br> The password for the account resource. This field is encrypted using the AES encryption key in the `key` field. |

## Response body

If successful, the response body contains data with the following structure:

```
{
    "id": string,
    "createdTimestamp": string,
    "modifiedTimestamp": string,
    "accessedTimestamp": string,
    "key": string,
    "iv": string,
    "domainName": string,
    "username": string,
    "password": string
}
```

| Fields |   |
|:--|---|
| `id` | `string` <br><br> The unique identifier for the account resource. This identifier is defined by the server. |
| `createdTimestamp` | `string` <br><br> The time when the account resource was first created. |
| `modifiedTimestamp` | `string` <br><br> The time when the account resource was last modified. |
| `accessedTimestamp` | `string` <br><br> The time when the account resource was last accessed. |
| `key` | `string` <br><br> The AES encryption key used to encrypt the password field. This field is encrypted using the user's public key. |
| `iv` | `string` <br><br> The AES initialization vector used to encrypt the password field. |
| `domainName` | `string` <br><br> The domain name for the account resource. |
| `username` | `string` <br><br> The username for the account resource. |
| `password` | `string` <br><br> The password for the account resource. This field is encrypted using the AES encryption key in the `key` field. |

## `curl` Example

```
curl \
    --cert ~/.pw/alice.cert.pem \
    --key ~/.pw/alice.key.pem \
    --cacert ~/.pw/ca.cert.pem \
    -X POST \
    "https://api.passwords.durfee.io/accounts" \
    -H "Content-Type: application/json" \
    -d '{
       "key": "exampleKey",
       "iv": "exampleIV",
       "domainName": "example.domain.name",
       "username": "exampleUsername",
       "password": "examplePassword"
    }'
```

