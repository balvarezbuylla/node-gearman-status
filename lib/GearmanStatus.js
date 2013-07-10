var net          = require ('net');
var eventEmitter = require ('events').EventEmitter;
var RRD          = require('rrd').RRD;
var fs           = require('fs');


CircularBuffer = function (size) {
  this.size         = size;
  this.buffer       = new Array (size);
  this.pointer      = 0;
  this.full         = false;
}

CircularBuffer.prototype.add = function (data) {
 
 this.buffer[this.pointer] = data;
 this.pointer++;
 
 if (this.pointer > this.size-1) {
   this.pointer = 0;
   this.full    = true;
 }
 
}

CircularBuffer.prototype.get = function () {
  var result;
  var result_partial;
  
  if (this.full) {
    result = this.buffer.slice (this.pointer);
    result_partial=this.buffer.slice(0, this.pointer-1);
    result = result.concat (result_partial);
  }
  else {
    result = this.buffer.slice (0, this.pointer);
  }
  
  return result;
}



GearmanFunction = function (name, bufferSize, path) {       //each function
  var self=this;
  this.name                = name;
  this.pollingData         = new CircularBuffer (bufferSize);   //data function: timestamp, capable, waiting, running
  this.maxCapablesWorkers  = 0;
  this.maxRunningJobs      = 0;
  this.maxWaitingJobs      = 0; 
  this.total_max_capableWorkers = 0;
  this.total_max_waitingJobs    = 0;
  this.total_max_runningJobs    = 0;
  this.average_capableWorkers   = 0;
  this.average_waitingJobs      = 0;
  this.average_runningJobs      = 0;
  this.number_samples           = 0;
  
  if (path!=null){
      this.rrd=check_route_log(name, path);       
  }    
  
}

function check_route_log (name, path){

   if (fs.existsSync(path) ){ 
      console.log("directory of files of log:", path);
      return new RRD(path+name+'.rrd');
   }
   else {
      console.log("directory "+ path +" don't exist");
      fs.mkdir(path, function(err){
         if (err) {
            console.log(err);
            return new RRD(name+'.rrd');
         }   
         else {
            console.log("directory created");
            return new RRD(path+name+'.rrd');
         }      
      });
   } 
}

GearmanFunction.prototype.addPolling = function (status_function, pollingCount) {
 
   var self=this;
   
   //number of samples to do the average
   self.number_samples++;
   //I check if the sample is most minute and if I replace it
   if (self.maxCapablesWorkers<status_function.capableWorkers) {
      self.maxCapablesWorkers=status_function.capableWorkers;
      if (self.maxCapablesWorkers>self.total_max_capableWorkers) self.total_max_capableWorkers=self.maxCapablesWorkers;
   }   
   if (self.maxRunningJobs<status_function.runningJobs){
      self.maxRunningJobs=status_function.runningJobs;
      if (self.maxRunningJobs>self.total_max_runningJobs) self.total_max_runningJobs=self.maxRunningJobs;
   }
   if (self.maxWaitingJobs<status_function.waitingJobs){
      self.maxWaitingJobs=status_function.waitingJobs;
      if (self.maxWaitingJobs>self.total_max_waitingJobs) self.maxWaitingJobs=self.total_max_waitingJobs;
   }
   
   //average
   //first sample
   if (this.number_samples==1){
      this.average_capableWorkers=status_function.capableWorkers; 
      this.average_waitingJobs=status_function.waitingJobs;
      this.average_runningJobs=status_function.runningJobs;
   }
   else{
      this.average_capableWorkers=((this.average_capableWorkers*self.number_samples)+status_function.capableWorkers)/(self.number_samples+1); 
      this.average_waitingJobs=((this.average_waitingJobs*self.number_samples)+status_function.waitingJobs)/(self.number_samples+1);
      this.average_runningJobs=((this.average_runningJobs*self.number_samples)+status_function.runningJobs)/(self.number_samples+1);
   }
   
   //   //I  check if it's been a minute to save -> if it has been keep the higher value of minute, reset the max values
   if (pollingCount%60==0){  
      self.pollingData.add ({timestamp : new Date(),         
                            capables  : self.maxCapablesWorkers,
                            waiting   : self.maxWaitingJobs,
                            running   : self.maxRunningJobs });  
      
      if (self.path!=null){
      //update databases 
         self.rrd.update (new Date, [self.maxCapablesWorkers,self.maxWaitingJobs,self.maxRunningJobs], function(err, res) {
            if (err) console.log ("error", err);
            else console.log("update ok");
         }); 
      }
      
      self.maxCapablesWorkers  = 0;
      self.maxRunningJobs      = 0;
      self.maxWaitingJobs      = 0;
      


   }
}

GearmanFunction.prototype.getHistory =  function () {
   var self=this;
   return {name:self.name, data:self.pollingData.get(), maxCapablesWorkers: self.total_max_capableWorkers, maxRunningJobs: self.total_max_runningJobs, maxWaitingJobs: self.total_max_waitingJobs, average_capable: self.average_capableWorkers, average_running: self.average_runningJobs, average_waiting: self.average_waitingJobs};
   
}

GearmanFunction.prototype.getLog =  function () {
   var self=this;
   var date= new Date;
   self.rrd.fetch (Math.round(date.valueOf() / 1000)-500, Math.round(date.valueOf() / 1000), function(err, results) {
      if (err)
         console.log ("error:", err);
      else
        console.log(results);
   });
   
}

nodeGearmanStatus = function (port, host, buffer_size, interval_polling, path_of_storage) {  
  
  self = this;
  
  this.error            = null;
  this.interval_polling = interval_polling;
   
  this.timer            = new eventEmitter();
  this.gearmanFunctions = {};
  
  this.pollingCount   = 0;
  
  this.socket           = net.connect(port, host);  
  this.socket.setEncoding ("ascii");
  
  this.socket.on ('error', function (e) {
    console.log ("[nodeGearmanStatus]: Error connecting to gearman job server at "+host+":"+port+": "+e);
    self.error=e;
  });
  
  this.socket.on('connect', function (){
    console.log ("[nodeGearmanStatus]: Connected to gearman job server at "+host+":"+port);
  });
  
  var data_received=''; 
  
  this.socket.on ('data', function (chunk) {
    
    data_received+=chunk;
   
    if (data_received.indexOf(".\n")>=0) {   
      var functions = self.parse_data_received (data_received.substring (0, data_received.length-3)); 
      data_received = '';
      
      for (functionName in functions) {                         //para cada función
        if (!self.gearmanFunctions[functionName]) {
          self.gearmanFunctions[functionName] = new GearmanFunction (functionName, buffer_size, path_of_storage);    
          
          if (path_of_storage!=null){
            //if the funtion don't exist, create a new database
            //fields:GAUGE:seconds between value and value. If there is not value-> undefined:min:max   
            self.gearmanFunctions[functionName].rrd.create (["--no-overwrite","DS:capable_workers:GAUGE:80:0:U", "DS:waiting_jobs:GAUGE:80:0:U", "DS:running_jobs:GAUGE:80:0:U", "RRA:AVERAGE:0.5:1:1000"], {}, function(err) {
               if (err)
                  console.log ("error:",err);
               else {
                  console.log("database created");
               }
            });
          }
        }
        self.gearmanFunctions[functionName].addPolling (functions[functionName], self.pollingCount);

      } 
      self.pollingCount++; 
    }
  });
};


nodeGearmanStatus.prototype.parse_data_received = function (data_received) {   
   
  /*
    data_received has this format:  
    
    This sends back a list of all registered functions.  Next to
    each function is the number of jobs in the queue, the number of
    running jobs, and the number of capable workers. The columns are
    tab separated, and the list is terminated with a line containing
    a single '.' (period). The format is:

         FUNCTION\tTOTAL\tRUNNING\tAVAILABLE_WORKERS
    */
  
    
    var result = {};
    
    if (data_received.length == 0) return result;
    
    var lines = data_received.split("\n");  
    
    for (var i=0; i < lines.length; i++) { 
      var lineFields = lines[i].split("\t");
      result[lineFields[0]] = { waitingJobs: parseInt(lineFields[1]),
                                runningJobs: parseInt(lineFields[2]),
                                capableWorkers: parseInt(lineFields[3])};
    }
    return result;
};

nodeGearmanStatus.prototype.initHistory = function () {
   
  var self=this;

  this.timer.on ("elapsed", function () {   //event
    self.socket.write ("status\n");
  });
  
  this.startTime = new Date();              //generate the actual date and time
  this.socket.write ("status\n");               
  
  setInterval (function() { self.timer.emit("elapsed"); }, self.interval_polling);  //interval_polling 
  
  console.log("GearmanStatus: Event init");
  

}


nodeGearmanStatus.prototype.writeHistory = function (){
   /*
    We must read from write_point is, because the point will advance after write.m 
    We must read from write_point is until the end and, after, the beginning. The exception is the first time
    */

  var self=this;
  var history_functions=[];
        
  for (functionName in self.gearmanFunctions) {                         //para cada función
   history_functions.push(self.gearmanFunctions[functionName].getHistory ());
  }


  return history_functions;
  
}; 

nodeGearmanStatus.prototype.getLogFunctions = function () {
   
  var self=this;
 
  for (functionName in self.gearmanFunctions) {                         //para cada función
      console.log("Log of "+functionName+": ");
      self.gearmanFunctions[functionName].getLog();
  }
  
  

}
  
module.exports = nodeGearmanStatus;
