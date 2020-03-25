const express = require('express')
const fs = require('fs')
const http = require('http')
const mongo = require('mongodb')
const MongoClient = mongo.MongoClient;
const uuid = require('uuid').v4

////////////////////////////////////////////////////////////////////////////////
// Global Constants
////////////////////////////////////////////////////////////////////////////////

const MONGO_URL = 'mongodb://localhost:27017'
const DATABASE = 'accountsDB'
const COLLECTION = 'accounts'
const ORDER_BY = 'domainName'
const ORDER = 'asc'
const STATUS_CODE_OK = 200
const STATUS_CODE_NO_CONTENT = 204
const STATUS_CODE_BAD_REQUEST = 400
const STATUS_CODE_NOT_FOUND = 404
const STATUS_CODE_INTERNAL_SERVER_ERROR = 500
const STATUS_BAD_REQUEST = 'BAD_REQUEST'
const STATUS_NOT_FOUND = 'NOT_FOUND'
const STATUS_INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
const LOG_OPTIONS = {
    'color': true,
    'depth': null,
}

////////////////////////////////////////////////////////////////////////////////
// Global Variables
////////////////////////////////////////////////////////////////////////////////

var db

////////////////////////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////////////////////////

const parseDN = dn => {
    return (dn || '').split(',').map(dnp => {
        return dnp.trim().split('=')
    }).reduce((kvs, [k, v]) => {
        return { [k.trim().toLowerCase()]: v.trim(), ...kvs }
    }, {})
}

const reversed = str => str.split('').reverse().join('')

const buildQuery = queryParameters => {
    var query = {}
    for (const [property, value] of Object.entries(queryParameters)) {
        switch (property) {
            case 'domainName':
                query = { 'domainName': reversed(value), ...query }
                break
            case 'domainNameEndsWith':
                query = { 'domainName': new RegExp(`^${reversed(value)}`), ...query }
                break
            case 'domainNameContains':
                query = { 'domainName': new RegExp(`.*${reversed(value)}.*`), ...query }
                break
            case 'username':
                query = { 'username': value, ...query }
                break
            case 'usernameStartsWith':
                query = { 'username': new RegExp(`^${value}`), ...query }
                break
            case 'usernameContains':
                query = { 'username': new RegExp(`.*${value}.*`), ...query }
                break
            case 'createdAt':
                query = { 'createdAt': new Date(value), ...query }
                break
            case 'createdBefore':
                query = { 'createdAt': { '$lt': new Date(value) }, ...query }
                break
            case 'createdAfter':
                query = { 'createdAt': { '$gt': new Date(value) }, ...query }
                break
            case 'modifiedAt':
                query = { 'modifiedAt': new Date(value), ...query }
                break
            case 'modifiedBefore':
                query = { 'modifiedAt': { '$lt': new Date(value) }, ...query }
                break
            case 'modifiedAfter':
                query = { 'modifiedAt': { '$gt': new Date(value) }, ...query }
                break
            case 'accessedAt':
                query = { 'accessedAt': new Date(value), ...query }
                break
            case 'accessedBefore':
                query = { 'accessedAt': { '$lt': new Date(value) }, ...query }
                break
            case 'accessedAfter':
                query = { 'accessedAt': { '$gt': new Date(value) }, ...query }
                break
            case 'order':
            case 'orderBy':
                break
            default:
                throw `Query parameter ${property} is not supported.`
                break
        }
    }
    return query
}

////////////////////////////////////////////////////////////////////////////////
// App Configuration
////////////////////////////////////////////////////////////////////////////////

const app = express()

app.use(express.json())
app.set('json spaces', 2)

////////////////////////////////////////////////////////////////////////////////
// REST Methods
////////////////////////////////////////////////////////////////////////////////

// Method: accounts.get
app.get('/accounts/:resourceId', (req, res) => {
    const dn = parseDN(req.get('X-SSL-CLIENT-DN'))
    const id = uuid()
    console.dir({
        'id': id,
        'request': {
            'dn': dn,
            'method': req['method'],
            'url': req['url'],
            'params': req['params'],
            'query': req['query'],
            'body': req['body'],
        }
    }, LOG_OPTIONS)
    const now = new Date()
    var resourceId
    try {
        resourceId = mongo.ObjectId(req.params['resourceId'])
    } catch (error) {
        const body = {
            'error': {
                'code': STATUS_CODE_BAD_REQUEST,
                'message': `Resource ID ${req.params['resourceId']} is malformed: ${error.message}`,
                'status': STATUS_BAD_REQUEST,
            }
        }
        res.status(STATUS_CODE_BAD_REQUEST).json(body)
        console.dir({
            'id': id,
            'response': {
                'statusCode': res['statusCode'],
                'statusMessage': res['statusMessage'],
                'body': body,
            }
        }, LOG_OPTIONS)
        return
    }
    db.collection(COLLECTION).findOneAndUpdate({
        '_cn': dn['cn'],
        '_id': resourceId,
    }, {
        '$set': {
            'accessedAt': now,
        }
    }).then(result => {
        if (result.value) {
            const body = {
                'id': `${result.value['_id']}`,
                'key': result.value['key'],
                'iv': result.value['iv'],
                'domainName': reversed(result.value['domainName']),
                'username': result.value['username'],
                'password': result.value['password'],
                'createdAt': result.value['createdAt'],
                'modifiedAt': result.value['modifiedAt'],
                'accessedAt': now,
            }
            res.status(STATUS_CODE_OK).json(body)
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        } else {
            const body = {
                'error': {
                    'code': STATUS_CODE_NOT_FOUND,
                    'message': `Resource ${req.params['resourceId']} was not found.`,
                    'status': STATUS_NOT_FOUND,
                }
            }
            res.status(STATUS_CODE_NOT_FOUND).json(body)
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        }
    }).catch(error => {
        const body = {
            'error': {
                'code': STATUS_CODE_INTERNAL_SERVER_ERROR,
                'message': `Unexpected error occurred when getting resource ${req.params['resourceId']}: ${error.message}`,
                'status': STATUS_INTERNAL_SERVER_ERROR,
            }
        }
        res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json(body)
        console.dir({
            'id': id,
            'response': {
                'statusCode': res['statusCode'],
                'statusMessage': res['statusMessage'],
                'body': body,
            }
        }, LOG_OPTIONS)
    })
})

// Method: accounts.delete
app.delete('/accounts/:resourceId', (req, res) => {
    const dn = parseDN(req.get('X-SSL-CLIENT-DN'))
    const id = uuid()
    console.dir({
        'id': id,
        'request': {
            'dn': dn,
            'method': req['method'],
            'url': req['url'],
            'params': req['params'],
            'query': req['query'],
            'body': req['body'],
        }
    }, LOG_OPTIONS)
    var resourceId
    try {
        resourceId = mongo.ObjectId(req.params['resourceId'])
    } catch (error) {
        const body = {
            'error': {
                'code': STATUS_CODE_BAD_REQUEST,
                'message': `Resource ID ${req.params['resourceId']} is malformed: ${error.message}`,
                'status': STATUS_BAD_REQUEST,
            }
        }
        res.status(STATUS_CODE_BAD_REQUEST).json(body)
        console.dir({
            'id': id,
            'response': {
                'statusCode': res['statusCode'],
                'statusMessage': res['statusMessage'],
                'body': body,
            }
        }, LOG_OPTIONS)
        return
    }
    db.collection(COLLECTION).deleteOne({
        '_cn': dn['cn'],
        '_id': resourceId,
    }).then(result => {
        if (result.deletedCount == 1) {
            const body = {}
            res.status(STATUS_CODE_NO_CONTENT).end()
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        } else {
            const body = {
                'error': {
                    'code': STATUS_CODE_NOT_FOUND,
                    'message': `Resource ${req.params['resourceId']} was not found.`,
                    'status': STATUS_NOT_FOUND,
                }
            }
            res.status(STATUS_CODE_NOT_FOUND).json(body)
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        }
    }).catch(error => {
        const body = {
            'error': {
                'code': STATUS_CODE_INTERNAL_SERVER_ERROR,
                'message': `Unexpected error occurred when deleting resource ${req.params['resourceId']}: ${error.message}`,
                'status': STATUS_INTERNAL_SERVER_ERROR,
            }
        }
        res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json(body)
        console.dir({
            'id': id,
            'response': {
                'statusCode': res['statusCode'],
                'statusMessage': res['statusMessage'],
                'body': body,
            }
        }, LOG_OPTIONS)
    })
})

// Method: accounts.insert
app.post('/accounts', (req, res) => {
    const dn = parseDN(req.get('X-SSL-CLIENT-DN'))
    const id = uuid()
    console.dir({
        'id': id,
        'request': {
            'dn': dn,
            'method': req['method'],
            'url': req['url'],
            'params': req['params'],
            'query': req['query'],
            'body': req['body'],
        }
    }, LOG_OPTIONS)
    const now = new Date()
    db.collection(COLLECTION).insertOne({
        '_cn': dn['cn'],
        'key': req.body['key'],
        'iv': req.body['iv'],
        'domainName': reversed(req.body['domainName']),
        'username': req.body['username'],
        'password': req.body['password'],
        'createdAt': now,
        'modifiedAt': now,
        'accessedAt': now,
    }).then(result => {
        if (result.insertedCount == 1) {
            const body = {
                'id': `${result.ops[0]['_id']}`,
                'key': result.ops[0]['key'],
                'iv': result.ops[0]['iv'],
                'domainName': reversed(result.ops[0]['domainName']),
                'username': result.ops[0]['username'],
                'password': result.ops[0]['password'],
                'createdAt': result.ops[0]['createdAt'],
                'modifiedAt': result.ops[0]['modifiedAt'],
                'accessedAt': result.ops[0]['accessedAt'],
            }
            res.status(STATUS_CODE_OK).json(body)
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        } else {
            const body = {
                'error': {
                    'code': STATUS_CODE_INTERNAL_SERVER_ERROR,
                    'message': `Unexpected error occurred when inserting resource: Unexpected number of inserted resources: ${result.insertedCount}`,
                    'status': STATUS_INTERNAL_SERVER_ERROR,
                }
            }
            res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json(body)
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        }
    }).catch(error => {
        const body = {
            'error': {
                'code': STATUS_CODE_INTERNAL_SERVER_ERROR,
                'message': `Unexpected error occurred when inserting resource: ${error.message}`,
                'status': STATUS_INTERNAL_SERVER_ERROR,
            }
        }
        res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json(body)
        console.dir({
            'id': id,
            'response': {
                'statusCode': res['statusCode'],
                'statusMessage': res['statusMessage'],
                'body': body,
            }
        }, LOG_OPTIONS)
    })
})

// Method: accounts.list
app.get('/accounts', (req, res) => {
    const dn = parseDN(req.get('X-SSL-CLIENT-DN'))
    const id = uuid()
    console.dir({
        'id': id,
        'request': {
            'dn': dn,
            'method': req['method'],
            'url': req['url'],
            'params': req['params'],
            'query': req['query'],
            'body': req['body'],
        }
    }, LOG_OPTIONS)
    const now = new Date()
    var query
    try {
        query = buildQuery(req.query)
    } catch (error) {
        const body = {
            'error': {
                'code': STATUS_CODE_BAD_REQUEST,
                'message': `Query is malformed: ${error.message}`,
                'status': STATUS_BAD_REQUEST,
            }
        }
        res.status(STATUS_CODE_BAD_REQUEST).json(body)
        console.dir({
            'id': id,
            'response': {
                'statusCode': res['statusCode'],
                'statusMessage': res['statusMessage'],
                'body': body,
            }
        }, LOG_OPTIONS)
        return
    }
    const orderBy = (req.query['orderBy'] || ORDER_BY)
    const order = (((req.query['order'] || ORDER) == 'asc') ? 1 : -1)
    db.collection(COLLECTION).find(query).sort({ [orderBy]: order }).toArray().then(results => {
        results = {
            'items': results.map(result => {
                return {
                    'id': `${result['_id']}`,
                    'key': result['key'],
                    'iv': result['iv'],
                    'domainName': reversed(result['domainName']),
                    'username': result['username'],
                    'password': result['password'],
                    'createdAt': result['createdAt'],
                    'modifiedAt': result['modifiedAt'],
                    'accessedAt': now,
                }
            }),
        }
        db.collection(COLLECTION).updateMany(query, {
            '$set': {
                'accessedAt': now,
            }
        }).then(result => {
            const body = results
            res.status(STATUS_CODE_OK).json(body)
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        }).catch(error => {
            const body = {
                'error': {
                    'code': STATUS_CODE_INTERNAL_SERVER_ERROR,
                    'message': `Unexpected error occurred when listing resource: ${error.message}`,
                    'status': STATUS_INTERNAL_SERVER_ERROR,
                }
            }
            res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json(body)
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        })
    }).catch(error => {
        const body = {
            'error': {
                'code': STATUS_CODE_INTERNAL_SERVER_ERROR,
                'message': `Unexpected error occurred when listing resource: ${error.message}`,
                'status': STATUS_INTERNAL_SERVER_ERROR,
            }
        }
        res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json(body)
        console.dir({
            'id': id,
            'response': {
                'statusCode': res['statusCode'],
                'statusMessage': res['statusMessage'],
                'body': body,
            }
        }, LOG_OPTIONS)
    })
})

// Method: accounts.setPassword
app.post('/accounts/:resourceId/setPassword', (req, res) => {
    const dn = parseDN(req.get('X-SSL-CLIENT-DN'))
    const id = uuid()
    console.dir({
        'id': id,
        'request': {
            'dn': dn,
            'method': req['method'],
            'url': req['url'],
            'params': req['params'],
            'query': req['query'],
            'body': req['body'],
        }
    }, LOG_OPTIONS)
    const now = new Date()
    var resourceId
    try {
        resourceId = mongo.ObjectId(req.params['resourceId'])
    } catch (error) {
        const body = {
            'error': {
                'code': STATUS_CODE_BAD_REQUEST,
                'message': `Resource ID ${req.params['resourceId']} is malformed: ${error.message}`,
                'status': STATUS_BAD_REQUEST,
            }
        }
        res.status(STATUS_CODE_BAD_REQUEST).json(body)
        console.dir({
            'id': id,
            'response': {
                'statusCode': res['statusCode'],
                'statusMessage': res['statusMessage'],
                'body': body,
            }
        }, LOG_OPTIONS)
        return
    }
    db.collection(COLLECTION).findOneAndUpdate({
        '_cn': dn['cn'],
        '_id': resourceId,
    }, {
        '$set': {
            'key': req.body['key'],
            'iv': req.body['iv'],
            'password': req.body['password'],
            'modifiedAt': now,
            'accessedAt': now,
        },
    }).then(result => {
        if (result.value) {
            const body = {
                'id': `${result.value['_id']}`,
                'key': req.body['key'],
                'iv': req.body['iv'],
                'domainName': reversed(result.value['domainName']),
                'username': result.value['username'],
                'password': req.body['password'],
                'createdAt': result.value['createdAt'],
                'modifiedAt': now,
                'accessedAt': now,
            }
            res.status(STATUS_CODE_OK).json(body)
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        } else {
            const body = {
                'error': {
                    'code': STATUS_CODE_NOT_FOUND,
                    'message': `Resource ${req.params['resourceId']} was not found.`,
                    'status': STATUS_NOT_FOUND,
                }
            }
            res.status(STATUS_CODE_NOT_FOUND).json(body)
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        }
    }).catch(error => {
        const body = {
            'error': {
                'code': STATUS_CODE_INTERNAL_SERVER_ERROR,
                'message': `Unexpected error occurred when updating resource ${req.params['resourceId']}: ${error.message}`,
                'status': STATUS_INTERNAL_SERVER_ERROR,
            }
        }
        res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json(body)
        console.dir({
            'id': id,
            'response': {
                'statusCode': res['statusCode'],
                'statusMessage': res['statusMessage'],
                'body': body,
            }
        }, LOG_OPTIONS)
    })
})

// Method: accounts.setUsername
app.post('/accounts/:resourceId/setUsername', (req, res) => {
    const dn = parseDN(req.get('X-SSL-CLIENT-DN'))
    const id = uuid()
    console.dir({
        'id': id,
        'request': {
            'dn': dn,
            'method': req['method'],
            'url': req['url'],
            'params': req['params'],
            'query': req['query'],
            'body': req['body'],
        }
    }, LOG_OPTIONS)
    const now = new Date()
    var resourceId
    try {
        resourceId = mongo.ObjectId(req.params['resourceId'])
    } catch (error) {
        const body = {
            'error': {
                'code': STATUS_CODE_BAD_REQUEST,
                'message': `Resource ID ${req.params['resourceId']} is malformed: ${error.message}`,
                'status': STATUS_BAD_REQUEST,
            }
        }
        res.status(STATUS_CODE_BAD_REQUEST).json(body)
        console.dir({
            'id': id,
            'response': {
                'statusCode': res['statusCode'],
                'statusMessage': res['statusMessage'],
                'body': body,
            }
        }, LOG_OPTIONS)
        return
    }
    db.collection(COLLECTION).findOneAndUpdate({
        '_cn': dn['cn'],
        '_id': resourceId,
    }, {
        '$set': {
            'username': req.body['username'],
            'modifiedAt': now,
            'accessedAt': now,
        },
    }).then(result => {
        if (result.value) {
            const body = {
                'id': `${result.value['_id']}`,
                'key': result.value['key'],
                'iv': result.value['iv'],
                'domainName': reversed(result.value['domainName']),
                'username': req.body['username'],
                'password': result.value['password'],
                'createdAt': result.value['createdAt'],
                'modifiedAt': now,
                'accessedAt': now,
            }
            res.status(STATUS_CODE_OK).json(body)
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        } else {
            const body = {
                'error': {
                    'code': STATUS_CODE_NOT_FOUND,
                    'message': `Resource ${req.params['resourceId']} was not found.`,
                    'status': STATUS_NOT_FOUND,
                }
            }
            res.status(STATUS_CODE_NOT_FOUND).json(body)
            console.dir({
                'id': id,
                'response': {
                    'statusCode': res['statusCode'],
                    'statusMessage': res['statusMessage'],
                    'body': body,
                }
            }, LOG_OPTIONS)
        }
    }).catch(error => {
        const body = {
            'error': {
                'code': STATUS_CODE_INTERNAL_SERVER_ERROR,
                'message': `Unexpected error occurred when updating resource ${req.params['resourceId']}: ${error.message}`,
                'status': STATUS_INTERNAL_SERVER_ERROR,
            }
        }
        res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).json(body)
        console.dir({
            'id': id,
            'response': {
                'statusCode': res['statusCode'],
                'statusMessage': res['statusMessage'],
                'body': body,
            }
        }, LOG_OPTIONS)
    })
})

////////////////////////////////////////////////////////////////////////////////
// Connect
////////////////////////////////////////////////////////////////////////////////

MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }).then(client => {
    db = client.db(DATABASE)
    http.createServer(app).listen(8002)
}).catch(error => {
    console.error(error)
    process.exit(1)
})

