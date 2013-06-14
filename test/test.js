var GearmanStatus       = require ('../lib/GearmanStatus');
var port                = 4730;
var host                = "127.0.0.1";
var buffer_size         = 10;
var interval_polling    = 1000; //ms

GearmanStatus= new GearmanStatus(port, host, buffer_size, interval_polling);

GearmanStatus.initHistory();            //init the events


setInterval (function() { console.log("status", GearmanStatus.writeHistory()); }, 5000);

