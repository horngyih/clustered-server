const _xml2js = require('xml2js');

const _logger = require( './file-logger' );

var availResponseHead = "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><OTA_HotelAvailNotifRS TimeStamp=\"2014-11-05T03:51:20.568Z\" Target=\"Production\" Version=\"1.000\" CorrelationID='";
var availResponseTail = "' xmlns=\"http://www.opentravel.org/OTA/2003/05\"><Success/><Warnings/></OTA_HotelAvailNotifRS></soap:Body></soap:Envelope>"

var rateResponseHead = "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><OTA_HotelRatePlanNotifRS Version=\"1\" CorrelationID=\""
var rateResponseTail = "\" xmlns=\"http://www.opentravel.org/OTA/2003/05\"><Success/></OTA_HotelRatePlanNotifRS></soap:Body></soap:Envelope>";

function execute(request, response) {
    readRequest(request)
        .then(parsePayload)
        .then(prepareResponse)
        .then((responseText) => {
            response.writeHead(200, {
                'Content-Type': 'text/xml; charset=UTF-8'
            });
            response.end(responseText);
        })
        .catch(err => {
            response.writeHead(404);
            response.end(err);
        });
}

function readRequest(request) {
    return new Promise((resolve, reject) => {
        let payload = "";
        if (typeof request === "string") {
            resolve( request );
        } else {
            request.on("data", data => {
                payload += data;
            });
            request.on("end", () => {
                resolve(payload);
            });
        }
    });
}

function parsePayload(payload) {
    _logger.info( "Message received : " + payload );
    return new Promise((resolve, reject) => {
        try {
            _xml2js.parseString(payload, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        } catch (err) {
            reject(err);
        }
    });
}

function prepareResponse(soapMessage) {
    return new Promise((resolve, reject) => {
        if (soapMessage) {
            let soapBody = soapMessage["soap:Envelope"]["soap:Body"];
            for (let elementName in soapBody) {
                let element = soapBody[elementName];
                let echoToken = '';
                let response = '';
                if (element['OTA_HotelAvailNotifRQ']) {
                    let otaHotelAvailNotifRQ = element['OTA_HotelAvailNotifRQ'];
                    echoToken = extractEchoToken(otaHotelAvailNotifRQ);
                    response = availResponseHead + echoToken + availResponseTail;
                } else if (element['OTA_HotelRatePlanNotifRQ']) {
                    let otaHotelRatePlanNotifRQ = element['OTA_HotelRatePlanNotifRQ'];
                    echoToken = extractEchoToken(otaHotelRatePlanNotifRQ);
                    response = rateResponseHead + echoToken + rateResponseTail;
                } else {
                    reject("Unrecognized request");
                }
                _logger.info( "Message Response : " + response );
                resolve( response );
            }
        } else {
            reject( "Empty request" );
        }
    });
}

function extractEchoToken(element) {
    let echoToken = '' + new Date().getTime();
    if (element && element.length > 0) {
        let attributes = element[0].$;
        if (attributes && attributes.EchoToken) {
            return attributes.EchoToken;
        }
    }
    return echoToken;
}

module.exports = {
    execute: execute
}