const _cluster = require("cluster");
const _http = require("http");

const _soapHandler = require("./soapHandler");

let shutdown = false;

let serverInstance = null;

function exec( request, response ){
    _soapHandler.execute( request, response );
    readRequest( request )
    .then( (result)=>{
        if( result === "SHUTDOWN" ){
            stopServer();
        }
    });
    /*
    readRequest( request )
    .then( (result) =>{
        response.writeHead(200);
        response.end(result);
        if( result === "SHUTDOWN" ){
            stopServer();
        }
    })
    .catch(err=>{
        console.log(err);
        response.writeHead(501);
        response.end("ERROR");
    });
    */
}

function readRequest( request ){
    let requestPayload = "";
    return new Promise( (resolve,reject)=>{
        let payload = "";
        request.on( "data", data=>{
            payload += data.toString();
        });
        request.on( "end", ()=>{
            console.log( "Request Payload :", payload );
            if( payload === "close" ){
                process.send({state: "shutdown"});
                resolve( "SHUTDOWN" );
            } 
            else if( payload === "x" ){
                t.run();
            }
            else {
                resolve( "OK" );
            }
        });
    });
}

function startServer(port){
    port = port || 9988;
    serverInstance = _http.createServer(exec);
    console.log( "Server listening on... " + port );
    process.send({state:"ServerStarted"});
    serverInstance.listen(port);
}

function stopServer(){
    serverInstance.close( ()=>{
        console.log( "Server stopped listening..." );
        console.log( "Server shutting down" );
        setTimeout( ()=> process.exit(0), 1000 );
    });
}

if( _cluster.isMaster ){
    worker = _cluster.fork();
    _cluster.on( "exit", ( worker, code, signal )=>{
        console.log( "Worker " + worker.process.pid + " died (" + code + ")" );
        if( shutdown !== true ){
            console.log( "Restarting... ");
            _cluster.fork();
        }
    });

    worker.on("message", message=>{
        console.log( "Message recvd : ", message );
        if( message && message.state === "shutdown" ){
            shutdown = true;
        }
    });
} else {
    let port = 9988;
    startServer(port);
}