function* stack_core_network(worker) {
    radix.globals.WORKER = worker;
    var __env__ = $project.env.data;
    radix.globals.environment = __env__;
    //Module dependencies.
    var debug = getDependency('debug')('test:app');
    var http = getDependency('http');
    var https = getDependency('https');
    var fs = getDependency('fs');
    var express = getDependency('express');

    radix.globals.expressApp = express();
    var port;
    //Create HTTP app.
    if (__env__.https) {
        let path = getDependency("path");
        port = __env__.httpsPort;
        radix.globals.expressApp.set('port', port);

        var privateKey = fs.readFileSync(path.join("./config", __env__.privateKeyPath), "utf8");
        var certificate = fs.readFileSync(path.join("./config", __env__.certificatePath), "utf8");
        var ca = [];
        for (var caPath of __env__.caPaths) {
            ca.push(fs.readFileSync(path.join("./config", caPath), "utf8"));
        }
        var credentials = {key: privateKey, cert: certificate, secure: true, ca: ca};

        var redirectServer = express();
        redirectServer.get('*', function (req, res) {
            res.redirect('https://' + __env__.domain + ":" + port + req.url)
        });

        radix.globals.redirectServer = redirectServer.listen(__env__.httpPort);

        radix.globals.server = https.createServer(credentials, radix.globals.expressApp);
    } else {
        port = __env__.httpPort;
        radix.globals.expressApp.set('port', port);
        radix.globals.server = http.createServer(radix.globals.expressApp);
    }

    yield* stack_core_express();

    //Listen on provided port, on all network interfaces.
    radix.globals.server.listen(port);
    radix.globals.server.on('error', function (error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error('Port requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error('Port is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    });
    radix.globals.server.on('listening', function () {
        var addr = radix.globals.server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        radix.helpers.aLog('\033[32mListening on ' + bind + "\033[0m");
        if(worker){
            worker.process.send("done");
        }

        controlFlowCall(function*() {
            radix.helpers.lastLogLevel = 1;
            console.log(radix.globals.WORKER.id + " |-| Executing Stack Start");
            yield* hooks_start();
            console.log(radix.globals.WORKER.id + " |-| Stack start executed");

            if ($project.env.name === 'tests') {
                yield stackCapture(radix.dapis.e2e.init, "e2eInit");
                yield stackCapture(launchTestsHook, "tests");
            }
        })()

    });
}