const _fs = require("fs");
const _os = require("os");

function logLevels(){
    let logLevelConfig = process.env.LOG_LEVEL || 'INFO';
    let logLevels = logLevelConfig.toUpperCase().split(",");
    logLevels = logLevels.map(item=>item.trim());
    return logLevels;
}

function info( message ){
    log( message, "INFO" );
}

function debug( message ){
    if( logLevels().indexOf( "DEBUG" ) >= 0 ){
        log( message, "DEBUG" );
    }
}

function warn(message){
    if( logLevels().indexOf( "WARN" ) >= 0 ) {
        log( message, "WARN" );
    }
}

function error(message){
    if( logLevels().indexOf("ERROR") >= 0 ){
        log( message, "ERROR" );
    }
}

function log( message, context ){
    if( message ){
        let logMessage = new Date().toString() + ":" + ( (context)?context:'INFO' ) + ":" + message;
        let logLocation = process.env.LOG_FILE || './server.log';
        try{
            let logFile = _fs.createWriteStream( logLocation, { 'flags' : 'a' } );
            if( logFile && logFile.writable ){
                logFile.write( logMessage );
            }
        } catch( err ){
            console.err( "LOGGER \n" + err );
        }
        console.log( logMessage );
    }
}

module.exports = {
    log : log,
    info : info,
    debug : debug,
    warn : warn,
    error : error
};