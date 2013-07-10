var RRD          = require('rrd').RRD;
var directory    = '/var/tmp/';   
var name_file    = 'wc.rrd';
var rrd          = new RRD(directory+name_file);

rrd.fetch ("10:00", "now", function(err, results) {
      if (err)
         console.log ("error:", err);
      else
        console.log(results);
   });

