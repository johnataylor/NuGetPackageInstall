
var fs = require('fs');
var nuget = require('./nuget');

var protocol = 'http';
var host = 'preview.nuget.org';
var port = 80;
var path = nuget.packagePath('EntityFramework', '5.0.0');
//var host = 'localhost';
//var port = 55880;
//var path = nuget.packagePath('Pack1', null);

var userAgent = 'Download Testing';

var parallelCount = 10;
var sequentialCount = 10;


var parallel = function (count, callback) {
    var iter = 0;
    for (var i=0; i<count; i++) {
        var folder = i.toString();
        nuget.downloadPackage(protocol, host, port, path, userAgent, folder, function(err, filename) {
            if (err !== null) {
                callback(err);
            }
            else {
                iter = iter + 1;
                if (iter === count) {
                    callback(null);
                }
            }
        });
    }
}

var sequential = function (count, callback) {

    console.log(count);
    
    if (count === 0) {
        callback();
        return;
    }
    parallel(parallelCount, function (err) {

        console.log('parallel done');

        if (err !== null) {
            console.log('error: ' + JSON.stringify(err));
            console.log('error: ' + err);
            callback();
        }
        else {
            console.log('complete');
            sequential(count - 1, callback);
        }
    });
}

for (var i = 0; i < parallelCount; i += 1) {
    fs.mkdir(i);
}

sequential(sequentialCount, function () { console.log('all done'); });
