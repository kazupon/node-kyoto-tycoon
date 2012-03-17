var http = require('http')
var querystring = require('querystring')
try {
    var base64 = require('base64')
}
catch(e) {
    var base64 = require('./base64')
}

exports.TsvRpc = TsvRpc

function TsvRpc(opt) {
    var opt = opt || {}
    this.host = opt.host || 'localhost'
    this.port = opt.port || 1978
    // TODO: must keep alive ??
    // `Connection' header default on
    // http://nodejs.org/api/http.html#http_http_request_options_callback
    this.keepalive = typeof opt.keepalive == 'undefined' ? false : true
}
TsvRpc.serialize = function(obj) {
    var r = ''
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            r += [k, obj[k]].map(querystring.escape).join('\t') + '\n'
        }
    }
    return r
}
TsvRpc.parse = function(tsv, opt) {
    var opt = opt || {}
    var r = {}
    var lines = tsv.split(/\n/)
    lines.forEach(function(i) {
        var tmp = i.split('\t')
        if (tmp.length == 2) {
            if (opt['content-type']) {
                if (opt['content-type'].indexOf('colenc=U') >= 0) {
                    tmp = tmp.map(querystring.unescape)
                }
                if (opt['content-type'].indexOf('colenc=B') >= 0) {
                    tmp = tmp.map(function(i) {
                        return i ? base64.decode(i) : null
                    })
                }
            }
            r[tmp[0]] = tmp[1]
        }
    })
    return r
}

TsvRpc.prototype.rpc = function(method, opt, callback) {
    var options = {
      host: this.host,
      port: this.port,
      path: '/rpc/' + method,
      method: 'POST',
      headers: {
        'Content-Type': 'text/tab-separated-values: colenc=U'
      }
    };
    // TODO: must keep alive ??
    // `Connection' header default on
    // http://nodejs.org/api/http.html#http_http_request_options_callback
    if (this.keepalive) {
      options.headers['Connection'] = 'keep-alive';
      options.agent = false;
    }
    var body = TsvRpc.serialize(opt)
    //console.log('body : %s', body);
    var req = http.request(options, function (res) {
        //console.log('res headers : %j', res.headers);
        var ct = res.headers['content-type']
        var buf = ''
        res.setEncoding('utf-8')
        res.on('data', function (chunk) {
            buf += chunk
        });
        res.on('end', function () {
            //console.log('response : %s', buf);
            var err = (res.statusCode != 200) ? new Error(res.statusCode + ' ' + body) : null
            if (callback) {
                callback(err, TsvRpc.parse(buf, { 'content-type': ct  }))
            }
        })
    })
    req.on('error', function (err) {
      if (callback) {
          callback(err)
      }
    });
    req.end(body)
}
TsvRpc.prototype.end = function() {
    // TODO: mus keep alive ??
    // `Connection' header default on
    // http://nodejs.org/api/http.html#http_http_request_options_callback
    //this.client.end()
}
