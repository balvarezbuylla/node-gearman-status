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
  
      The return data have format:
         [ [ { name: 'prueba2',
              date: Wed Jun 12 2013 13:25:39 GMT+0200 (CEST),
              workers: [Object] },
            { name: 'prueba',
              date: Wed Jun 12 2013 13:25:39 GMT+0200 (CEST),
              workers: [Object] } ],
          [ { name: 'prueba2',
              date: Wed Jun 12 2013 13:25:45 GMT+0200 (CEST),
              workers: [Object] },
            { name: 'prueba',
              date: Wed Jun 12 2013 13:25:45 GMT+0200 (CEST),
              workers: [Object] } ] ]

        
        Where:
            Each array contained in main array has all workers that have been initiated with his name, date when has 
            been given the data and workers. Workers is an array with [number of jobs in the queue, number of
            running jobs, number of capable workers].
            
            When an event occurs, the main array increases one position.
        
        
  
  
