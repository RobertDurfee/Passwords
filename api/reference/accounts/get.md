# Method: `accounts.get`

Returns the specified account resource.

## HTTP request

```
GET https://api.passwords.durfee.io/accounts/{resourceId}
```

## Path parameters

| Parameters |  |
|---|---|
| `resourceId` | `string` <br><br> The unique identifier of the account resource to return. This identifier is defined by the server. |

## Query parameters

No query parameters are allowed.

## Request Body

The request body must be empty.

## Response Body

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
|---|---|
| `id` | `string` <br><br> The unique identifier for the account resource. This identifier is defined by the server. |
| `createdTimestamp` | `string` <br><br> The time when the account resource was first created. |
| `modifiedTimestamp` | `string` <br><br> The time when the account resource was last modified. |
| `accessedTimestamp` | `string` <br><br> The time when the account resource was last accessed. |
| `key` | `string` <br><br> The AES encryption key used to encrypt the password field. This field is encrypted using the user's public key. |
| `iv` | `string` <br><br> The AES initialization vector used to encrypt the password field. |
| `domainName` | `string` <br><br> The domain name for the account resource. |
| `username` | `string` <br><br> The username for the account resource. |
| `password` | `string` <br><br> The password for the account resource. This field is encrypted using the AES encryption key in the `key` field. |

## Example

```
curl                                                                           \
    --cert-type P12                                                            \
    --cert alice.p12                                                           \
    -k                                                                         \
    -X GET                                                                     \
    "https://api.passwords.durfee.io/accounts/1"
```

