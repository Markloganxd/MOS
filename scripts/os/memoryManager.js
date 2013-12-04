function Partition(base, limit) {
    this.base = base;
    this.limit = limit;
    this.available = true;
    this.contains = function(address) {
        var absoluteAddress = this.base + address;
        return (absoluteAddress >= this.base) && (absoluteAddress < this.limit);        
    };
}

function MemoryManager() {
    var that = this;
    this.partitionSize = 256;
    this.partitions = [ 
        new Partition(0, this.partitionSize),
        new Partition(this.partitionSize, this.partitionSize * 2),
        new Partition(this.partitionSize * 2, this.partitionSize * 3),
    ];
    this.rollIn = function(pcb, partition) {
      var codes = krnFileSystemDriver.readFromFile("_process_" + pcb.pid).split(" ");
      krnFileSystemDriver.deleteFile("_process_" + pcb.pid);

      // put codes in memory
      var currentAddress = 0;
      codes.forEach(function(code) {
        _MemoryManager.storeByte(partition, currentAddress, code);
        currentAddress++;
      });
      partition.available = false;
      pcb.partition = partition;
    };
    this.rollOut = function(pcb) {
      // grap data from memory
      var fileContents = "";
      for (var i = 0; i < this.partitionSize; i++) {
        fileContents += this.getByte(pcb.partition, i) + " ";
      }
      _MemoryManager.clearPartition(pcb.partition);
      
      // write data to file
      krnFileSystemDriver.createFile("_process_" + pcb.pid);
      krnFileSystemDriver.writeToFile("_process_" + pcb.pid, fileContents);
      pcb.partition = null;
    };
    this.getByte = function(partition, address) {
        if (partition.contains(address)) {
          return Memory[partition.base + address];
        } else {
          _KernelInterruptQueue.enqueue(new Interrupt(READ_VIOLATION_IRQ, address));
          return "Er"
        }
    };
    this.storeByte = function(partition, address, value) {
        if (partition.contains(address)) {
          Memory[partition.base + address] = value;
        } else {
          _KernelInterruptQueue.enqueue(new Interrupt(WRITE_VIOLATION_IRQ, address));
        }
    };
    this.getPartition = function(id) {
        return this.partitions[id];
    };
    this.getFreePartition = function() {
        var freePartition = null;
        var foundIt = false;
        for (var i = 0; i < _MemoryManager.partitions.length && !foundIt; i++) {
            var partition = this.getPartition(i);
            if (partition.available) {
                partition.available = false;
                foundIt = true;
                freePartition = partition;
            }
        }
        return freePartition;
    };
    this.freePartition = function(partition) {
        partition.available = true;
    };
    this.clearPartition = function(partition) {
        for(var i = partition.base; i < partition.limit; i++) {
            Memory[i] = "00";
        }
        partition.available = true;
    };
    this.clearMemory = function() {
        for (var i = 0; i < _MemoryManager.partitions.length; i++) {
            var partition = this.getPartition(i);
            that.clearPartition(partition);
        }
    };
}
