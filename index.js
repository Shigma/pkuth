const QS = require('querystring')
const http = require('http')
const { URL } = require('url')

const BASR_URL = 'http://www.pkuhelper.com'
const API_URL = 'services/pkuhole/api.php'

class TreeHole {
  constructor(data, api) {
    Object.assign(this, data)
    this.api = api
    this.comments = null
  }

  getComment() {
    if (this.comments) return Promise.resolve(this.comments)
    return this.api.request({
      search: {
        action: 'getcomment',
        pid: this.pid
      }
    }).then((response) => {
      this.comments = response.data
      return response.data
    })
  }
}

module.exports = class {
  constructor({ timeout = 10000 } = {}) {
    this.timeout = timeout
    this.headers = {}
    this.user = null
  }

  request({url, method, headers, search}) {
    if (!(url instanceof URL)) url = new URL(url || API_URL, BASR_URL)
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
    }).then((response) => {
      if (response.code) {
        throw response.msg
      } else {
        return response
      }
    })
  }

  login(uid, password) {
    return this.request({
      url: 'services/login/login.php',
      method: 'POST',
      search: { uid, password }
    }).then((response) => {
      this.user = response
      this.headers['User-token'] = response.user_token
      return response
    })
  }

  getList(page = 1) {
    return this.request({
      search: {
        action: 'getlist',
        p: page
      }
    }).then((response) => {
      return response.data.map(data => new TreeHole(data, this))
    })
  }

  getHole(pid) {
    return this.request({
      search: {
        action: 'getone',
        pid
      }
    }).then((response) => new TreeHole(response.data, this))
  }
}