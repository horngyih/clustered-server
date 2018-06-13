const _cluster = require("cluster");
const _http = require("http");

require('dotenv').config();

const _soapHandler = require("./soapHandler");
const _logger = require("./file-logger");

let shutdown = false;
let serverInstance = null;

function exec( request, response ){
    readRequest( request )
    .then( (result)=>{
        if( result === "SHUTDOWN" ){
            response.writeHead(200);
            response.end( result );
            stopServer();
        } else {
            _logger.debug( "No recognized commands, passing onto implmentation" );
            _soapHandler.execute( result, response );
        }
    });
}

function readRequest( request ){
    return new Promise( (resolve,reject)=>{
        let payload = "";
        request.on( "data", data=>{
            payload += data.toString();
        });
        request.on( "end", ()=>{
            if( payload === "close" ){
                process.send({state: "shutdown"});
                resolve( "SHUTDOWN" );
            } 
            else {
                resolve( payload );
            }
        });
    });
}

function startServer(port){
    port = process.env.PORT || 9988;
    serverInstance = _http.createServer(exec);
    _logger.info( "Server listening on... " + port );
    process.send({state:"ServerStarted"});
    serverInstance.listen(port);
}

function stopServer(){
    serverInstance.close( ()=>{
        _logger.info( "Server stopped listening..." );
        _logger.info( "Server shutting down" );
        setTimeout( ()=> process.exit(0), 1000 );
    });
}

if( _cluster.isMaster ){
    worker = _cluster.fork();
    _cluster.on( "exit", ( worker, code, signal )=>{
        _logger.info( "Worker " + worker.process.pid + " died (" + code + ")" );
        if( shutdown !== true ){
            _logger.info( "Restarting... ");
            _cluster.fork();
        }
    });

    worker.on("message", message=>{
        if( message && message.state === "shutdown" ){
            shutdown = true;
        }
    });

    process.on( "SIGINT", ()=>{
        shutdown = true;
    });
} else {
    let port = 9988;
    startServer(port);

    process.on( "SIGINT", ()=>{
        stopServer();
    });
}