var GearmanStatus       = require ('../lib/GearmanStatus');
var port                = 4730;
var host                = "127.0.0.1";
var buffer_size         = 2880;
var interval_polling    = 1000; //ms

GearmanStatus= new GearmanStatus(port, host, buffer_size, interval_polling);

GearmanStatus.initHistory();            //init the events


setInterval (function() { 
      var history=GearmanStatus.writeHistory()
      console.log("status");
      for (i=0; i<history.length; i++){
         console.log("name", history[i].name);
         console.log("data", history[i].data);
      }

   }, 5000);

