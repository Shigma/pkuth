const QS = require('querystring')
const http = require('http')
const { URL } = require('url')

const BASR_URL = 'http://www.pkuhelper.com'

class Treehole {
  constructor({ timeout = 10000 } = {}) {
    this.timeout = timeout
    this.headers = {}
  }

  request({url, method, headers, search}) {
    if (!(url instanceof URL)) url = new URL(url, BASR_URL)
    return new Promise((resolve, reject) => {
      let data = ''
      const timeout = setTimeout(() => request.abort(), this.timeout)
      const request = http.request({
        method: method || 'GET',
        headers: Object.assign(this.headers, headers),
        hostname: url.hostname,
        path: url.pathname + (search ? '?' + QS.stringify(search) : ''),
      }, (response) => {
        response.on('data', chunk => data += chunk)
        response.on('end', () => {
          clearTimeout(timeout)
          try {
            return resolve(JSON.parse(data))
          } catch (err) {
            return reject(new Error(`An error is encounted in ${data}\n${err}`))
          }
        })
      })
      request.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
      request.end()
    })
  }

  login(uid, password) {
    return this.request({
      url: 'services/login/login.php',
      method: 'POST',
      search: { uid, password }
    })
  }

  getList(page = 1) {
    return this.request({
      url: 'services/pkuhole/api.php',
      search: {
        action: 'getlist',
        p: page
      }
    })
  }
}

module.exports = Treehole