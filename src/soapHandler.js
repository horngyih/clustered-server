const _xml2js = require('xml2js');

var availResponseHead = "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><OTA_HotelAvailNotifRS TimeStamp=\"2014-11-05T03:51:20.568Z\" Target=\"Production\" Version=\"1.000\" CorrelationID='";
var availResponseTail = "' xmlns=\"http://www.opentravel.org/OTA/2003/05\"><Success/><Warnings/></OTA_HotelAvailNotifRS></soap:Body></soap:Envelope>"

var rateResponseHead = "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><OTA_HotelRatePlanNotifRS Version=\"1\" CorrelationID=\""
var rateResponseTail = "\" xmlns=\"http://www.opentravel.org/OTA/2003/05\"><Success/></OTA_HotelRatePlanNotifRS></soap:Body></soap:Envelope>";

function execute( request, response ){
    readRequest(request)
    .then(parsePayload);
}

function readRequest( request ){
    return new Promise((resolve, reject)=>{
        let payload = "";
        request.on("data", data=>{
            payload += data;
        });
        request.on("end",()=>{
            console.log( "Request Payload", payload );
            resolve(payload);
        });
    });
}

function parsePayload( payload ){

}

module.exports = {
    execute : execute
}