var RRD          = require('rrd').RRD;
var rrd          = new RRD('wc.rrd');

rrd.fetch ("10:00", "now", function(err, results) {
      if (err)
         console.log ("error:", err);
      else
        console.log(results);
   });

