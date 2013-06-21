node-gearman-status
===================

Node.js module to monitor Gearman server status
  
    USE:
      Require ('../lib/GearmanStatus')
      Define variables of builder
      Create the object
      Init the events with initHistory()
      When you want the data stored at the history, call writeHistory
  
    EXAMPLE:
      See test.js
  
      status
      name wc
      data [ { timestamp: Fri Jun 21 2013 13:04:02 GMT+0200 (CEST),
         capables: 1,
         waiting: 0,
         running: 0 },
      { timestamp: Fri Jun 21 2013 13:04:08 GMT+0200 (CEST),
         capables: 1,
         waiting: 0,
         running: 0 },
      { timestamp: Fri Jun 21 2013 13:04:14 GMT+0200 (CEST),
         capables: 1,
         waiting: 0,
         running: 0 },
      { timestamp: Fri Jun 21 2013 13:04:20 GMT+0200 (CEST),
         capables: 1,
         waiting: 0,
         running: 0 },
      { timestamp: Fri Jun 21 2013 13:04:26 GMT+0200 (CEST),
         capables: 1,
         waiting: 0,
         running: 0 } ]
      name wc2
      data [ { timestamp: Fri Jun 21 2013 13:04:26 GMT+0200 (CEST),
         capables: 1,
         waiting: 0,
         running: 0 } ]
      
   Where:
      status indicates one new polling saved. 
         name is the name of each funcion
         data contains the date and the data of the status command gearman-job-server
        
  
  
