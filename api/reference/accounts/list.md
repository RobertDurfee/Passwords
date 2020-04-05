# Method: `accounts.list`

Retrieves the list of account resources.

## HTTP request

```
GET https://api.passwords.durfee.io/accounts
```

## Path parameters

No path parameters are allowed.

## Query parameters

| Parameters |   |
|:--|---|
| `domainName` | `string` <br><br> Returns account resources with domain names exactly matching the provided domain name. |
| `domainNameEndsWith` | `string` <br><br> Returns account resources with domain names ending with the provided domain name suffix. <br><br> Note: This is an efficient match making use of existing indexes. |
| `domainNameContains` | `string` <br><br> Returns account resources with domain names containing the provided domain name pattern. <br><br> Warning: This is an expensive match that requires an index scan. |
| `username` | `string` <br><br> Returns account resources with usernames exactly matching the provided username. |
| `usernameStartsWith` | `string` <br><br> Returns account resources with usernames starting with the provided username prefix. <br><br> Note: This is an efficient match making use of existing indexes. |
| `usernameContains` | `string` <br><br> Returns account resources with usernames containing the provided username pattern. <br><br> Warning: This is an expensive match that requires an index scan. |
| `createdAt` | `string` <br><br> Returns account resources created at the provided time. |
| `createdBefore` | `string` <br><br> Returns account resources created before the provided time. |
| `createdAfter` | `string` <br><br> Returns account resources created after the provided time. |
| `modifiedAt` | `string` <br><br> Returns account resources modified at the provided time. |
| `modifiedBefore` | `string` <br><br> Returns account resources modified before the provided time. |
| `modifiedAfter` | `string` <br><br> Returns account resources modified after the provided time. |
| `accessedAt` | `string` Returns account resources accessed at the provided time. |
| `accessedBefore` | `string` <br><br> Returns account resources accessed before the provided time. |
| `accessedAfter` | `string` <br><br> Returns account resources accessed after the provided time. |
| `order` | `'asc'\|'desc'` <br><br> Specifies the sorting direction. <br><br> By default, results are returned in ascending order. |
| `orderBy` | `string` <br><br> Sorts list results using the provided field. <br><br> Currently supported fields include: <br> <ul><li>`createdTimestamp`</li><li>`modifiedTimestamp`</li><li>`accessedTimestamp`</li><li>`domainName`</li><li>`username`</li></ul> By default, results are sorted using the `domainName` field. |

## Request body

The request body must be empty.

## Response body

If successful, the response body contains data with the following structure:

```
{
    "items": [
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
    ]
}
```

| Fields |   |
|:--|---|
| `items[].id` | `string` <br><br> The unique identifier for the account resource. This identifier is defined by the server. |
| `items[].createdTimestamp` | `string` <br><br> The time when the account resource was first created. |
| `items[].modifiedTimestamp` | `string` <br><br> The time when the account resource was last modified. |
| `items[].accessedTimestamp` | `string` <br><br> The time when the account resource was last accessed. |
| `items[].key` | `string` <br><br> The AES encryption key used to encrypt the password field. This field is encrypted using the user's public key. |
| `items[].iv` | `string` <br><br> The AES initialization vector used to encrypt the password field. |
| `items[].domainName` | `string` <br><br> The domain name for the account resource. |
| `items[].username` | `string` <br><br> The username for the account resource. |
| `items[].password` | `string` <br><br> The password for the account resource. This field is encrypted using the AES encryption key in the `key` field. |

## `curl` Example

```
curl \
    --cert ~/.pw/alice.cert.pem \
    --key ~/.pw/alice.key.pem \
    --cacert ~/.pw/ca.cert.pem \
    -G \
    "https://api.passwords.durfee.io/accounts" \
    -d "domainNameEndsWith=example.domain.name"
```
