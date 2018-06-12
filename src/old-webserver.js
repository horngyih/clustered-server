const _cluster = require('cluster');

var http = require('http');
var xml2js = require('xml2js');
var fs = require('fs');
var os = require('os');

var availResponseHead = "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><OTA_HotelAvailNotifRS TimeStamp=\"2014-11-05T03:51:20.568Z\" Target=\"Production\" Version=\"1.000\" CorrelationID='";
var availResponseTail = "' xmlns=\"http://www.opentravel.org/OTA/2003/05\"><Success/><Warnings/></OTA_HotelAvailNotifRS></soap:Body></soap:Envelope>"

var rateResponseHead = "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><OTA_HotelRatePlanNotifRS Version=\"1\" CorrelationID=\""
var rateResponseTail = "\" xmlns=\"http://www.opentravel.org/OTA/2003/05\"><Success/></OTA_HotelRatePlanNotifRS></soap:Body></soap:Envelope>";

const port = process.env.PORT || 9988;

var execute = function (request, response) {
    if (request) {
        var requestBody = '';
        request.on('data',
            function (data) {
                requestBody += data;
            }
        );

        request.on('end',
            function () {
                try {
                    serverLog("Received : " + new Date());
                    serverLog(requestBody);
                    parseBody(requestBody, response);
                } catch (err) {
                    console.error(err);
                }
            }
        );

    }
}

var parseBody = function (xmlBody, response) {
    xml2js.parseString(xmlBody,
        function (err, result) {
            if (result) {
                prepareResponse(result, response);
            } else {
                serverLog('Not a Soap message. Dropping');
                response.writeHead(404);
                response.end("Unable to process request");
            }
        }
    );
};

var prepareResponse = function (soapMessage, response) {
    console.log(soapMessage);
    var soapBody = soapMessage['soap:Envelope']['soap:Body'];
    for (i in soapBody) {
        var element = soapBody[i];
        var responseXML = '';
        var echoToken = '';
        if (element['OTA_HotelAvailNotifRQ']) {
            var otaHotelAvailNotifRQ = element['OTA_HotelAvailNotifRQ'];
            if (otaHotelAvailNotifRQ.length > 0) {
                var attributes = otaHotelAvailNotifRQ[0].$;
                if (attributes.EchoToken) {
                    echoToken = attributes.EchoToken;
                }
                responseXML = availResponseHead + echoToken + availResponseTail;
            }
        } else if (element['OTA_HotelRatePlanNotifRQ']) {
            var otaHotelRatePlanNotifRQ = element['OTA_HotelRatePlanNotifRQ'];
            if (otaHotelRatePlanNotifRQ.length > 0) {
                var attributes = otaHotelRatePlanNotifRQ[0].$;
                //console.dir( attributes );
                if (attributes.EchoToken) {
                    echoToken = attributes.EchoToken;
                }
                responseXML = rateResponseHead + echoToken + rateResponseTail;
            }
        }
        //log.end( echoToken );
        serverLog(responseXML);
        response.writeHead(200, {
            'Content-Type': 'text/xml; charset=UTF-8'
        });
        response.end(responseXML);
    }
};

var serverLog = function (logMessage) {
    var log = fs.createWriteStream("/data/share/server.log", {
        'flags': 'a'
    });
    if (log) {
        log.write(logMessage + os.EOL);
    } else {
        console.log(logMessage);
    }
};

function startServer() {
    var httpServer = http.createServer(execute);
    console.log("Listening on port ", port);
    serverLog("Server started " + new Date() + " listening to port " + port);
    httpServer.listen(port);
}

if (_cluster.isMaster) {
    _cluster.fork();
    _cluster.on(
        "exit",
        function (worker) {
            serverLog("Server died.... restarting");
            _cluster.fork();
        }
    );
} else if (_cluster.worker) {
    startServer();
}

process.on('uncaughtException', function (err) {
    serverLog("UncaughtException : " + err);
});