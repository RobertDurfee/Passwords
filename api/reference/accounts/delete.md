# Method: `accounts.delete`

Deletes the specified account resource.

## HTTP request

```
DELETE https://api.passwords.durfee.io/accounts/{resourceId}
```

## Path parameters

| Parameters |   |
|:--|---|
| `resourceId` | `string` <br><br> The unique identifier of the account resource to return. This identifier is defined by the server. |

## Query parameters

No query parameters are allowed.

## Request Body

The request body must be empty.

## Response body

If successful, the response body will be empty.

## `curl` Example

```
curl \
    --cert ~/.pw/alice.cert.pem \
    --key ~/.pw/alice.key.pem \
    --cacert ~/.pw/ca.cert.pem \
    -X DELETE \
    "https://api.passwords.durfee.io/accounts/5e7be4d894ab3d01651df603"
```

