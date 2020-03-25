# Method: accounts.setUsername

Sets an account's username.

## HTTP request

```
POST https://api.passwords.durfee.io/accounts/{resourceId}/setUsername
```

## Path parameters

| Parameters   |                                                               |
|--------------|---------------------------------------------------------------|
| `resourceId` | `string`                                                      |
|              |                                                               |
|              | The unique identifier of the account resource to return. This |
|              | identifier is defined by the server.                          |

## Query parameters

No query parameters are allowed.

## Request body

The request body contains data with the following structure:

```json
{
    "username": string
}
```

| Fields     |                                                                 |
|------------|-----------------------------------------------------------------|
| `username` | `string`                                                        |
|            |                                                                 |
|            | The username for the account resource.                          |

## Response body

If successful, the response body contains data with the following structure.

```json
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

| Fields              |                                                        |
|---------------------|--------------------------------------------------------|
| `id`                | `string`                                               |
|                     |                                                        |
|                     | The unique identifier for the account                  |
|                     | resource. This identifier is defined by the server.    |
|                     |                                                        |
| `createdTimestamp`  | `string`                                               |
|                     |                                                        |
|                     | The time when the account resource was first created.  |
|                     |                                                        |
| `modifiedTimestamp` | `string`                                               |
|                     |                                                        |
|                     | The time when the account resource was last modified.  |
|                     |                                                        |
| `accessedTimestamp` | `string`                                               |
|                     |                                                        |
|                     | The time when the account resource was last accessed.  |
|                     |                                                        |
| `key`               | `string`                                               |
|                     |                                                        |
|                     | The AES encryption key used to encrypt the password    |
|                     | field. This field is encrypted using the user's        |
|                     | public key.                                            |
|                     |                                                        |
| `iv`                | `string`                                               |
|                     |                                                        |
|                     | The AES initialization vector used to encrypt the      |
|                     | password field.                                        |
|                     |                                                        |
| `domainName`        | `string`                                               |
|                     |                                                        |
|                     | The domain name for the account resource.              |
|                     |                                                        |
| `username`          | `string`                                               |
|                     |                                                        |
|                     | The username for the account resource.                 |
|                     |                                                        |
| `password`          | `string`                                               |
|                     |                                                        |
|                     | The password for the account resource. This field is   |
|                     | encrypted using the AES encryption key in the `key`    |
|                     | field.                                                 |

## Example

```
curl                                                                           \
    --cert-type P12                                                            \
    --cert alice.p12                                                           \
    -k                                                                         \
    -X POST                                                                    \
    "https://api.passwords.durfee.io/accounts/1/setUsername"                   \
    -H "Content-Type: application/json"                                        \
    -d '
    {
       "username": "exampleUsername"
    }
    '
```
