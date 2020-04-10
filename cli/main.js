const os = require('os')
const program = require('commander')
const fs = require('fs')
const https = require('https')
const readline = require('readline')
const util = require('util')
const crypto = require('crypto')

////////////////////////////////////////////////////////////////////////////////
// Global Constants
////////////////////////////////////////////////////////////////////////////////

const CONFIGURATION = '~/.pw/.pwrc'
const HOSTNAME = 'api.passwords.durfee.io'
const PORT = 443
const BASE_URL = '/accounts'
const QUERY_KEYS = [
    'domainName',
    'domainNameEndsWith',
    'domainNameContains',
    'username',
    'usernameStartsWith',
    'usernameContains',
    'createdAt',
    'createdBefore',
    'createdAfter',
    'modifiedAt',
    'modifiedBefore',
    'modifiedAfter',
    'accessedAt',
    'accessedBefore',
    'accessedAfter',
    'order',
    'orderBy',
]
const STATUS_CODE_OK = 200
const STATUS_CODE_NO_CONTENT = 204
const STATUS_CODE_CONFIGURATION_ERROR = 600
const STATUS_CODE_PARSE_ERROR = 601
const STATUS_CODE_GET_ERROR = 602
const STATUS_CODE_POST_ERROR = 603
const STATUS_CODE_DELETE_ERROR = 604
const STATUS_CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
const STATUS_PARSE_ERROR = 'PARSE_ERROR'
const STATUS_GET_ERROR = 'GET_ERROR'
const STATUS_POST_ERROR = 'POST_ERROR'
const STATUS_DELETE_ERROR = 'DELETE_ERROR'
const GET_SUCCESS_STATUS_CODE = STATUS_CODE_OK
const POST_SUCCESS_STATUS_CODE = STATUS_CODE_OK
const DELETE_SUCCESS_STATUS_CODE = STATUS_CODE_NO_CONTENT

////////////////////////////////////////////////////////////////////////////////
// Global Variables
////////////////////////////////////////////////////////////////////////////////

var yes
var one
var colors
var certificate
var key
var certificateAuthority
var configuration

////////////////////////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////////////////////////

const resolveHomeDirectory = path => {
    return path.replace('~', os.homedir())
}

const urlencode = query => {
    const entries = Object.entries(query)
    if (entries.length > 0) {
        return entries.map(([k, v]) => {
            return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
        }).reduce((kvs, kv) => {
            return `${kvs}&${kv}`
        })
    } else {
        return ''
    }
}

const extractQuery = options => {
    return Object.entries(options).filter(([k]) => {
        return QUERY_KEYS.includes(k)
    }).reduce((kvs, [k, v]) => {
        return {[k]: v, ...kvs }
    }, {})
}

const commonHttpsOptions = () => {
    return {
        'hostname': HOSTNAME,
        'port': PORT,
        'cert': certificate,
        'key': key,
        'ca': certificateAuthority,
    }
}

const logOptions = () => {
    return {
        'colors': colors,
        'depth': null,
    }
}
    
const confirm = (question, records) => {
    return new Promise((resolve, reject) => {
        if (yes) {
            resolve(records)
        } else {
            logInfo(records.map(record => {
                const decryptedPassword = decrypt(record['password'], record['key'], record['iv'])
                return {
                    'createdAt': record['createdAt'],
                    'modifiedAt': record['modifiedAt'],
                    'accessedAt': record['accessedAt'],
                    'domainName': record['domainName'],
                    'username': record['username'],
                    'password': decryptedPassword,
                }
            }))
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            })
            rl.question(`${question} [Y/n] `, answer => {
                rl.close()
                answer = answer.trim().toLowerCase()
                if (answer == 'y' || answer == 'yes' || answer == '') {
                    resolve(records)
                } else {
                    reject()
                }
            })
        }
    })
}

const parseBody = (body, resolve, reject) => {
    if (body == '') {
        resolve({})
    }
    try {
        body = JSON.parse(body)
    } catch (error) {
        reject(parseErrorMessage(error.message, body))
        return
    }
    resolve(body)
}

const display = results => {
    if (one) {
        if (results.length > 0) {
            console.log(decrypt(results[0]['password'], results[0]['key'], results[0]['iv']))
        }
    } else {
        logInfo(results.map(result => {
            const decryptedPassword = decrypt(result['password'], result['key'], result['iv'])
            return {
                'createdAt': result['createdAt'],
                'modifiedAt': result['modifiedAt'],
                'accessedAt': result['accessedAt'],
                'domainName': result['domainName'],
                'username': result['username'],
                'password': decryptedPassword,
            }
        }))
    }
}

////////////////////////////////////////////////////////////////////////////////
// Encryption Methods
////////////////////////////////////////////////////////////////////////////////

const encrypt = value => {
    // Generate AES key and initialization vector
    var aesKey = crypto.randomBytes(32)
    var iv = crypto.randomBytes(16)

    // Encrypt the value using AES
    const cipher = crypto.createCipheriv('aes256', aesKey, iv)
    value = Buffer.concat([cipher.update(value), cipher.final()])

    // Encrypt the AES key with RSA public key
    aesKey = crypto.publicEncrypt(certificate, aesKey)

    // Convert to string
    value = value.toString('base64')
    aesKey = aesKey.toString('base64')
    iv = iv.toString('base64')

    return [value, aesKey, iv]
}

const decrypt = (value, aesKey, iv) => {
    // Convert from string
    value = Buffer.from(value, 'base64')
    aesKey = Buffer.from(aesKey, 'base64')
    iv = Buffer.from(iv, 'base64')

    // Decrypt the AES key with RSA private key
    aesKey = crypto.privateDecrypt(key, aesKey)

    // Decrypt the value using AES
    const decipher = crypto.createDecipheriv('aes256', aesKey, iv)
    value = Buffer.concat([decipher.update(value), decipher.final()])

    // Convert to string
    value = value.toString()

    return value
}

////////////////////////////////////////////////////////////////////////////////
// Error Messages
////////////////////////////////////////////////////////////////////////////////

const parseErrorMessage = (errorMessage, content) => {
    return {
        'error': {
            'code': STATUS_CODE_PARSE_ERROR,
            'message': `Unable to parse: ${errorMessage}: ${content}`,
            'status': STATUS_PARSE_ERROR,
        }
    }
}

const configurationErrorMessage = errorMessage => {
    return {
        'error': {
            'code': STATUS_CODE_CONFIGURATION_ERROR,
            'message': errorMessage,
            'status': STATUS_CONFIGURATION_ERROR,
        }
    }
}

const getErrorMessage = errorMessage => {
    return {
        'error': {
            'code': STATUS_CODE_GET_ERROR,
            'message': `Unable to perform HTTPS GET request: ${errorMessage}`,
            'status': STATUS_GET_ERROR,
        }
    }
}

const postErrorMessage = errorMessage => {
    return {
        'error': {
            'code': STATUS_CODE_POST_ERROR,
            'message': `Unable to perform HTTPS POST request: ${errorMessage}`,
            'status': STATUS_POST_ERROR,
        }
    }
}

const deleteErrorMessage = errorMessage => {
    return {
        'error': {
            'code': STATUS_CODE_DELETE_ERROR,
            'message': `Unable to perform HTTPS DELETE request: ${errorMessage}`,
            'status': STATUS_DELETE_ERROR,
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
// Response Handlers
////////////////////////////////////////////////////////////////////////////////

const handleResponse = (resolve, reject, statusCode) => response => {
    var body = ''
    response.on('data', data => {
        body = body + data
    })
    response.on('end', () => {
        if (response.statusCode == statusCode) {
            parseBody(body, resolve, reject)
        } else {
            parseBody(body, reject, reject)
        }
    })
}

////////////////////////////////////////////////////////////////////////////////
// Error Handlers
////////////////////////////////////////////////////////////////////////////////

const handleError = (reject, errorMessage) => error => {
    reject(errorMessage(error.message))
}

////////////////////////////////////////////////////////////////////////////////
// HTTPS Request Wrappers
////////////////////////////////////////////////////////////////////////////////

const httpsGet = url => {
    const options = {
        'path': url,
        'method': 'GET',
        ...commonHttpsOptions(),
    }
    return new Promise((resolve, reject) => {
        const req = https.request(options, handleResponse(resolve, reject, GET_SUCCESS_STATUS_CODE))
        req.on('error', handleError(reject, getErrorMessage))
        req.end()
    })
}

const httpsPost = (url, payload) => {
    const options = {
        'path': url,
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/json',
            'Content-Length': payload.length,
        },
        ...commonHttpsOptions(),
    }
    return new Promise((resolve, reject) => {
        const req = https.request(options, handleResponse(resolve, reject, POST_SUCCESS_STATUS_CODE))
        req.on('error', handleError(reject, postErrorMessage))
        req.write(payload)
        req.end()
    })
}

const httpsDelete = url => {
    const options = {
        'path': url,
        'method': 'DELETE',
        ...commonHttpsOptions(),
    }
    return new Promise((resolve, reject) => {
        const req = https.request(options, handleResponse(resolve, reject, DELETE_SUCCESS_STATUS_CODE))
        req.on('error', handleError(reject, deleteErrorMessage))
        req.end()
    })
}

////////////////////////////////////////////////////////////////////////////////
// API Wrappers
////////////////////////////////////////////////////////////////////////////////

const accountsDelete = resourceId => {
    return httpsDelete(`${BASE_URL}/${resourceId}`)
}

const accountsGet = resourceId => {
    return httpsGet(`${BASE_URL}/${resourceId}`)
} 

const accountsInsert = resource => {
    return httpsPost(`${BASE_URL}`, JSON.stringify(resource))
} 

const accountsList = query => {
    return httpsGet(`${BASE_URL}?${urlencode(query)}`)
} 

const accountsSetPassword = (resourceId, aesKey, iv, password) => {
    return httpsPost(`${BASE_URL}/${resourceId}/setPassword`, JSON.stringify({ 'key': aesKey, 'iv': iv, 'password': password }))
}

const accountsSetUsername = (resourceId, username) => { 
    return httpsPost(`${BASE_URL}/${resourceId}/setUsername`, JSON.stringify({ 'username': username }))
}

////////////////////////////////////////////////////////////////////////////////
// Logging Helpers
////////////////////////////////////////////////////////////////////////////////

const logFatal = object => {
    console.error(util.inspect(object, logOptions()))
    process.exit(1)
}

const logError = object => {
    console.error(util.inspect(object, logOptions()))
}

const logInfo = object => {
    console.dir(object, logOptions())
}

////////////////////////////////////////////////////////////////////////////////
// Command Handlers
////////////////////////////////////////////////////////////////////////////////

const configurationHandler = options => { 
    const resolvedConfiguration = resolveHomeDirectory(options.parent['configuration'])
    if (fs.existsSync(resolvedConfiguration)) {
        try {
            configuration = JSON.parse(fs.readFileSync(resolvedConfiguration))
        } catch (error) {
            logFatal(configurationErrorMessage(`Unable to parse configuration ${resolvedConfiguration}: ${error.message}`))
        }
    } else {
        logFatal(configurationErrorMessage(`Configuration ${resolvedConfiguration} does not exist.`))
    }
    if ('certificate' in options.parent) {
        certificate = resolveHomeDirectory(options.parent['certificate'])
    } else if ('certificate' in configuration) {
        certificate = resolveHomeDirectory(configuration['certificate'])
    } else {
        logFatal(configurationErrorMessage('Certificate not provided.'))
    }
    if (fs.existsSync(certificate)) {
        certificate = fs.readFileSync(certificate)
    } else {
        logFatal(configurationErrorMessage(`Certificate ${certificate} does not exist.`))
    }
    if ('key' in options.parent) {
        key = resolveHomeDirectory(options.parent['key'])
    } else if ('key' in configuration) {
        key = resolveHomeDirectory(configuration['key'])
    } else {
        logFatal(configurationErrorMessage('Key not provided.'))
    }
    if (fs.existsSync(key)) {
        key = fs.readFileSync(key)
    } else {
        logFatal(configurationErrorMessage(`Key ${key} does not exist.`))
    }
    if ('certificateAuthority' in options.parent) {
        certificateAuthority = resolveHomeDirectory(options.parent['certificateAuthority'])
    } else if ('certificateAuthority' in configuration) {
        certificateAuthority = resolveHomeDirectory(configuration['certificateAuthority'])
    } else {
        logFatal(configurationErrorMessage('Certificate authority not provided.'))
    }
    if (fs.existsSync(certificateAuthority)) {
        certificateAuthority = fs.readFileSync(certificateAuthority)
    } else {
        logFatal(configurationErrorMessage(`Certificate authority ${certificateAuthority} does not exist.`))
    }
    if ('yes' in options.parent) {
        yes = true
    } else if ('yes' in configuration) {
        yes = configuration['yes']
    } else {
        yes = false
    }
    if ('colors' in options.parent) {
        colors = options.parent['colors']
    } else if ('colors' in configuration) {
        colors = configuration['colors']
    } else {
        colors = true
    }
    if ('one' in options.parent) {
        one = true
    } else if ('one' in configuration) {
        one = configuration['one']
    } else {
        one = false
    }
}

const getHandler = options => {
    const query = extractQuery(options)
    accountsList(query).then(results => {
        display(results['items'])
    }).catch(logFatal)
}

const insertHandler = (domainName, username, password, options) => {
    const [encryptedPassword, aesKey, iv] = encrypt(password)
    accountsInsert({
        'key': aesKey,
        'iv': iv,
        'domainName': domainName,
        'username': username,
        'password': encryptedPassword,
    }).then(result => {
        display([result])
    }).catch(logFatal)
}

const setPasswordHandler = (password, options) => {
    const query = extractQuery(options)
    accountsList(query).catch(error => {
        logFatal(error)
    }).then(results => {
        return confirm('Set the password for all of these records?', results['items'])
    }).then(results => {
        return Promise.all(results.map(result => {
            const [encryptedPassword, aesKey, iv] = encrypt(password)
            return accountsSetPassword(result['id'], aesKey, iv, encryptedPassword).then(result => {
                return { 'result': result }
            }).catch(error => {
                return { 'error': error }
            })
        }))
    }).then(allResults => {
        const results = allResults.filter(result => 'result' in result).map(result => result['result'])
        const errors = allResults.filter(result => 'error' in result).map(error => error['error'])
        display(results)
        if (errors.length > 0) {
            logFatal(errors)
        }
    }).catch(() => {
        // Do nothing
    })
}

const setUsernameHandler = (username, options) => {
    const query = extractQuery(options)
    accountsList(query).catch(error => {
        logFatal(error)
    }).then(results => {
        return confirm('Set the username for all of these records?', results['items'])
    }).then(results => {
        return Promise.all(results.map(result => {
            return accountsSetUsername(result['id'], username).then(result => {
                return { 'result': result }
            }).catch(error => {
                return { 'error': error }
            })
        }))
    }).then(allResults => {
        const results = allResults.filter(result => 'result' in result).map(result => result['result'])
        const errors = allResults.filter(result => 'error' in result).map(error => error['error'])
        display(results)
        if (errors.length > 0) {
            logFatal(errors)
        }
    }).catch(() => {
        // Do nothing
    })
}

const deleteHandler = options => {
    const query = extractQuery(options)
    accountsList(query).catch(error => {
        logFatal(error)
    }).then(results => {
        return confirm('Delete all of these records?', results['items'])
    }).then(results => {
        return Promise.all(results.map(result => {
            return accountsDelete(result['id']).then(result => {
                return { 'result': result }
            }).catch(error => {
                return { 'error': error }
            })
        }))
    }).then(allResults => {
        const errors = allResults.filter(result => 'error' in result).map(error => error['error'])
        if (errors.length > 0) {
            logFatal(errors)
        }
    }).catch(() => {
        // Do nothing
    })
}

////////////////////////////////////////////////////////////////////////////////
// Command-Line Arguments
////////////////////////////////////////////////////////////////////////////////

program
    .version('1.0.0')
    .description('Command-line interface for remote secure password storage.')
    .option('-y, --yes', 'Automatic yes to prompts; assume `yes` as answer to all prompts and run non-interactively.')
    .option('-c, --certificate <certificate>', 'Location of certificate to use for encryption and remote authentication. (default: Use the provided certificate in configuration file.)')
    .option('-k, --key <key>', 'Location of key to use for decryption and remote authentication. (default: Use the provided key in configuration file.)')
    .option('--certificate-authority <certificateAuthority', 'Location of certificate authority chain to validate remote connection. (default: Use the provided certificate authority in configuration file.)')
    .option('--configuration <configuration>', 'Location of configuration file.', CONFIGURATION)
    .option('--no-colors', 'Do not use colors in console output')
    .option('--one', 'Only display the first result')

program
    .command('list')
    .description('Get account resources matching the provided options. Options are logically `AND`ed together. If no options are provided, all account resources will be returned.')
    .option('-d, --domain-name <domainName>', 'Returns account resources with domain names exactly matching the provided domain name.')
    .option('--domain-name-ends-with <domainNameSuffix>', 'Returns account resources with domain names ending with the provided domain name suffix. Note: This is an efficient match making use of existing indexes.')
    .option('--domain-name-contains <domainNamePattern>', 'Returns account resources with domain names containing the provided domain name pattern. Warning: This is an expensive match that requires an index scan.')
    .option('-u, --username <username>', 'Returns account resources with usernames exactly matching the provided username.')
    .option('--username-starts-with <usernamePrefix>', 'Returns account resources with usernames starting with the provided username prefix. Note: This is an efficient match making use of existing indexes.')
    .option('--username-contains <usernamePattern>', 'Returns account resources with usernames containing the provided username pattern. Warning: This is an expensive match that requires an index scan.')
    .option('--created-at <createdAt>', 'Returns account resources created at the provided time.')
    .option('--created-before <createdBefore>', 'Returns account resources created before the provided time.')
    .option('--created-after <createdAfter>', 'Returns account resources created after the provided time.')
    .option('--modified-at <modifiedAt>', 'Returns account resources modified at the provided time.')
    .option('--modified-before <modifiedBefore>', 'Returns account resources modified before the provided time.')
    .option('--modified-after <modifiedAfter>', 'Returns account resources modified after the provided time.')
    .option('--accessed-at <accessedAt>', 'Returns account resources accessed at the provided time.')
    .option('--accessed-before <accessedBefore>', 'Returns account resources accessed before the provided time.')
    .option('--accessed-after <accessedAfter>', 'Returns account resources accessed after the provided time.')
    .option('--order <order>', 'Specifies the sorting direction.', 'asc')
    .option('--order-by <orderBy>', 'Sorts list results using the provided field.', 'domainName')
    .action(options => {
        configurationHandler(options)
        getHandler(options)
    })

program
    .command('create <domainName> <username> <password>')
    .description('Create an account resource using the provided data.')
    .action((domainName, username, password, options) => {
        configurationHandler(options)
        insertHandler(domainName, username, password, options)
    })

program
    .command('set-password <password>')
    .description('Set the password for account resources matching the provided options. Options are logically `AND`ed together. If no options are provided, all account resource passwords will be set.')
    .option('-d, --domain-name <domainName>', 'Matches account resources with domain names exactly matching the provided domain name.')
    .option('--domain-name-ends-with <domainNameSuffix>', 'Matches account resources with domain names ending with the provided domain name suffix. Note: This is an efficient match making use of existing indexes.')
    .option('--domain-name-contains <domainNamePattern>', 'Matches account resources with domain names containing the provided domain name pattern. Warning: This is an expensive match that requires an index scan.')
    .option('-u, --username <username>', 'Matches account resources with usernames exactly matching the provided username.')
    .option('--username-starts-with <usernamePrefix>', 'Matches account resources with usernames starting with the provided username prefix. Note: This is an efficient match making use of existing indexes.')
    .option('--username-contains <usernamePattern>', 'Matches account resources with usernames containing the provided username pattern. Warning: This is an expensive match that requires an index scan.')
    .option('--created-at <createdAt>', 'Matches account resources created at the provided time.')
    .option('--created-before <createdBefore>', 'Matches account resources created before the provided time.')
    .option('--created-after <createdAfter>', 'Matches account resources created after the provided time.')
    .option('--modified-at <modifiedAt>', 'Matches account resources modified at the provided time.')
    .option('--modified-before <modifiedBefore>', 'Matches account resources modified before the provided time.')
    .option('--modified-after <modifiedAfter>', 'Matches account resources modified after the provided time.')
    .option('--accessed-at <accessedAt>', 'Matches account resources accessed at the provided time.')
    .option('--accessed-before <accessedBefore>', 'Matches account resources accessed before the provided time.')
    .option('--accessed-after <accessedAfter>', 'Matches account resources accessed after the provided time.')
    .action((password, options) => {
        configurationHandler(options)
        setPasswordHandler(password, options)
    })

program
    .command('set-username <username>')
    .description('Set the username for account resources matching the provided options. Options are logically `AND`ed together. If no options are provided, all account resource usernames will be set.')
    .option('-d, --domain-name <domainName>', 'Matches account resources with domain names exactly matching the provided domain name.')
    .option('--domain-name-ends-with <domainNameSuffix>', 'Matches account resources with domain names ending with the provided domain name suffix. Note: This is an efficient match making use of existing indexes.')
    .option('--domain-name-contains <domainNamePattern>', 'Matches account resources with domain names containing the provided domain name pattern. Warning: This is an expensive match that requires an index scan.')
    .option('-u, --username <username>', 'Matches account resources with usernames exactly matching the provided username.')
    .option('--username-starts-with <usernamePrefix>', 'Matches account resources with usernames starting with the provided username prefix. Note: This is an efficient match making use of existing indexes.')
    .option('--username-contains <usernamePattern>', 'Matches account resources with usernames containing the provided username pattern. Warning: This is an expensive match that requires an index scan.')
    .option('--created-at <createdAt>', 'Matches account resources created at the provided time.')
    .option('--created-before <createdBefore>', 'Matches account resources created before the provided time.')
    .option('--created-after <createdAfter>', 'Matches account resources created after the provided time.')
    .option('--modified-at <modifiedAt>', 'Matches account resources modified at the provided time.')
    .option('--modified-before <modifiedBefore>', 'Matches account resources modified before the provided time.')
    .option('--modified-after <modifiedAfter>', 'Matches account resources modified after the provided time.')
    .option('--accessed-at <accessedAt>', 'Matches account resources accessed at the provided time.')
    .option('--accessed-before <accessedBefore>', 'Matches account resources accessed before the provided time.')
    .option('--accessed-after <accessedAfter>', 'Matches account resources accessed after the provided time.')
    .action((username, options) => {
        configurationHandler(options)
        setUsernameHandler(username, options)
    })

program
    .command('delete')
    .description('Delete account resources matching the provided options. Options are logically `AND`ed together. If no options are provided, all account resources will be deleted.')
    .option('-d, --domain-name <domainName>', 'Deletes account resources with domain names exactly matching the provided domain name.')
    .option('--domain-name-ends-with <domainNameSuffix>', 'Deletes account resources with domain names ending with the provided domain name suffix. Note: This is an efficient match making use of existing indexes.')
    .option('--domain-name-contains <domainNamePattern>', 'Deletes account resources with domain names containing the provided domain name pattern. Warning: This is an expensive match that requires an index scan.')
    .option('-u, --username <username>', 'Deletes account resources with usernames exactly matching the provided username.')
    .option('--username-starts-with <usernamePrefix>', 'Deletes account resources with usernames starting with the provided username prefix. Note: This is an efficient match making use of existing indexes.')
    .option('--username-contains <usernamePattern>', 'Deletes account resources with usernames containing the provided username pattern. Warning: This is an expensive match that requires an index scan.')
    .option('--created-at <createdAt>', 'Deletes account resources created at the provided time.')
    .option('--created-before <createdBefore>', 'Deletes account resources created before the provided time.')
    .option('--created-after <createdAfter>', 'Deletes account resources created after the provided time.')
    .option('--modified-at <modifiedAt>', 'Deletes account resources modified at the provided time.')
    .option('--modified-before <modifiedBefore>', 'Deletes account resources modified before the provided time.')
    .option('--modified-after <modifiedAfter>', 'Deletes account resources modified after the provided time.')
    .option('--accessed-at <accessedAt>', 'Deletes account resources accessed at the provided time.')
    .option('--accessed-before <accessedBefore>', 'Deletes account resources accessed before the provided time.')
    .option('--accessed-after <accessedAfter>', 'Deletes account resources accessed after the provided time.')
    .action(options => {
        configurationHandler(options)
        deleteHandler(options)
    })

program.parse(process.argv)

