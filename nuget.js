
var http = require('http');
var url = require('url');
var fs = require('fs');

var logOptions = function(protocol, options) {
    if (options.port !== undefined) {
        console.log(options.method + ' ' + protocol + '://' + options.host + ':' + options.port + options.path);
    }
    else {
        console.log(options.method + ' ' + protocol + '://' + options.host + options.path);
    }
}

//TODO: consider passing in the destination stream rather than then folder...

var downloadPackage = function (protocol, host, port, path, userAgent, folder, callback) {

    var options = {
        host: host,
        path: path,
        method: 'GET',
        headers: { 'User-Agent': userAgent, 'NuGet-Operation': 'Install' }
    };

    if (port !== undefined) {
        options.port = port;
    }

    logOptions(protocol, options);

    var channel;

    if (protocol === 'http') {
        channel = require('http');
    }
    else {
        channel = require('https');
    }

    var req = channel.request(options, function (res) {

        if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {

            var location = url.parse(res.headers.location);
            if (location.host) {
                downloadPackage(location.protocol, location.host, location.port, location.path, userAgent, folder, callback);
            } else {
                downloadPackage(location.protocol, options.host, options.port, location.path, userAgent, folder, callback);
            }
        }
        else if (res.statusCode != 200) {
            callback({ protocol: protocol, request: options, statusCode: res.statusCode }, null)
            return;
        }
        else {
            if (res.headers['content-disposition']) {

        console.log(res.headers['content-disposition']);

                var filename = res.headers['content-disposition'].replace(/^.*filename=/, '').replace(/^"|$"/g, '');
            }
            else {
                var filename = options.path.substr(options.path.lastIndexOf('/') + 1);
            }

            var writeStream = fs.createWriteStream(folder.replace(/\/$/, '') + '/' + filename);

            res.pipe(writeStream);

            res.on('end', function () {
                writeStream.end();
                callback(null, filename);
            });

            writeStream.on('error', function (e) {
                callback(e, null);
            });
        }
    });

    req.end();

    req.on('error', function (e) {
        callback('error', null);
    });
}

var packagePath = function (name, version) {
    var path = '/api/v2/Package/' + name;
    if (version !== null) {
        path += '/' + version;
    }
    return path;
}

exports.downloadPackage = downloadPackage;
exports.packagePath = packagePath;
