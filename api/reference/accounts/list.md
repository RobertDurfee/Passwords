# Method: accounts.list

Retrieves the list of account resources.

## HTTP request

```
GET https://api.passwords.durfee.io/accounts
```

## Path parameters

No path parameters are allowed.

## Query parameters

| Parameters           |                                                       |
|----------------------|-------------------------------------------------------|
| `domainName`         | `string`                                              |
|                      |                                                       |
|                      | Returns account resources with domain names exactly   |
|                      | matching the provided domain name.                    |
|                      |                                                       |
| `domainNameEndsWith` | `string`                                              |
|                      |                                                       |
|                      | Returns account resources with domain names ending    |
|                      | with the provided domain name suffix.                 |
|                      |                                                       |
|                      | Note: This is an efficient match making use of        |
|                      | existing indexes.                                     |
|                      |                                                       |
| `domainNameContains` | `string`                                              |
|                      |                                                       |
|                      | Returns account resources with domain names           |
|                      | containing the provided domain name pattern.          |
|                      |                                                       |
|                      | Warning: This is an expensive match that requires an  |
|                      | index scan.                                           |
|                      |                                                       |
| `username`           | `string`                                              |
|                      |                                                       |
|                      | Returns account resources with usernames exactly      |
|                      | matching the provided username.                       |
|                      |                                                       |
| `usernameStartsWith` | `string`                                              |
|                      |                                                       |
|                      | Returns account resources with usernames starting     |
|                      | with the provided username prefix.                    |
|                      |                                                       |
|                      | Note: This is an efficient match making use of        |
|                      | existing indexes.                                     |
|                      |                                                       |
| `usernameContains`   | `string`                                              |
|                      |                                                       |
|                      | Returns account resources with usernames containing   |
|                      | the provided username pattern.                        |
|                      |                                                       |
|                      | Warning: This is an expensive match that requires an  |
|                      | index scan.                                           |
|                      |                                                       |
| `createdAt`          | `string`                                              |
|                      |                                                       |
|                      | Returns account resources created at the provided     |
|                      | time.                                                 |
|                      |                                                       |
| `createdBefore`      | `string`                                              |
|                      |                                                       |
|                      | Returns account resources created before the provided |
|                      | time.                                                 |
|                      |                                                       |
| `createdAfter`       | `string`                                              |
|                      |                                                       |
|                      | Returns account resources created after the provided  |
|                      | time.                                                 |
|                      |                                                       |
| `modifiedAt`         | `string`                                              |
|                      |                                                       |
|                      | Returns account resources modified at the provided    |
|                      | time.                                                 |
|                      |                                                       |
| `modifiedBefore`     | `string`                                              |
|                      |                                                       |
|                      | Returns account resources modified before the         |
|                      | provided time.                                        |
|                      |                                                       |
| `modifiedAfter`      | `string`                                              |
|                      |                                                       |
|                      | Returns account resources modified after the provided |
|                      | time.                                                 |
|                      |                                                       |
| `accessedAt`         | `string`                                              |
|                      |                                                       |
|                      | Returns account resources accessed at the provided    |
|                      | time.                                                 |
|                      |                                                       |
| `accessedBefore`     | `string`                                              |
|                      |                                                       |
|                      | Returns account resources accessed before the         |
|                      | provided time.                                        |
|                      |                                                       |
| `accessedAfter`      | `string`                                              |
|                      |                                                       |
|                      | Returns account resources accessed after the provided |
|                      | time.                                                 |
|                      |                                                       |
| `order`              | 'asc'|'desc'                                          |
|                      |                                                       |
|                      | Specifies the sorting direction.                      |
|                      |                                                       |
|                      | By default, results are returned in ascending order.  |
|                      |                                                       |
| `orderBy`            | `string`                                              |
|                      |                                                       |
|                      | Sorts list results using the provided field.          |
|                      |                                                       |
|                      | Currently supported fields include:                   |
|                      | - `createdTimestamp`                                  |
|                      | - `modifiedTimestamp`                                 |
|                      | - `accessedTimestamp`                                 |
|                      | - `domainName`                                        |
|                      | - `username`                                          |
|                      |                                                       |
|                      | By default, results are sorted using the `domainName` |
|                      | field.                                                |

## Request body

The request body must be empty.

## Response body

If successful, the response body contains data with the following structure:

```json
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
    ],
}
```

| Fields                      |                                                |
|-----------------------------|------------------------------------------------|
| `items[].id`                | `string`                                       |
|                             |                                                |
|                             | The unique identifier for the account          |
|                             | resource. This identifier is defined by the    |
|                             | server.                                        |
|                             |                                                |
| `items[].createdTimestamp`  | `string`                                       |
|                             |                                                |
|                             | The time when the account resource was first   |
|                             | created.                                       |
|                             |                                                |
| `items[].modifiedTimestamp` | `string`                                       |
|                             |                                                |
|                             | The time when the account resource was last    |
|                             | modified.                                      |
|                             |                                                |
| `items[].accessedTimestamp` | `string`                                       |
|                             |                                                |
|                             | The time when the account resource was last    |
|                             | accessed.                                      |
|                             |                                                |
| `items[].key`               | `string`                                       |
|                             |                                                |
|                             | The AES encryption key used to encrypt the     |
|                             | password field. This field is encrypted using  |
|                             | the user's public key.                         |
|                             |                                                |
| `items[].iv`                | `string`                                       |
|                             |                                                |
|                             | The AES initialization vector used to encrypt  |
|                             | the password field.                            |
|                             |                                                |
| `items[].domainName`        | `string`                                       |
|                             |                                                |
|                             | The domain name for the account resource.      |
|                             |                                                |
| `items[].username`          | `string`                                       |
|                             |                                                |
|                             | The username for the account resource.         |
|                             |                                                |
| `items[].password`          | `string`                                       |
|                             |                                                |
|                             | The password for the account resource. This    |
|                             | field is encrypted using the AES encryption    |
|                             | key in the `key` field.                        |

## Example

```
curl                                                                           \
    --cert-type P12                                                            \
    --cert alice.p12                                                           \
    -k                                                                         \
    -G                                                                         \
    "https://api.passwords.durfee.io/accounts"                                 \
    -d "createdBefore=20200322T040621Z"                                        \
    -d "domainNameEndsWith=amazon.com"
```

