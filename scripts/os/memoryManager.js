function Partition(base, limit) {
    this.base = base;
    this.limit = limit;
    this.available = true;
}

function MemoryManager() {
    var that = this;
    this.partitionSize = 256;
    this.partitions = [ 
        new Partition(0, this.partitionSize),
        new Partition(this.partitionSize, this.partitionSize * 2),
        new Partition(this.partitionSize * 2, this.partitionSize * 3),
    ];
    this.getByte = function(partition, address) {
        return Memory[partition.base + address];
    };
    this.storeByte = function(partition, address, value) {
        Memory[partition.base + address] = value;    
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
    this.clearPartition = function(partition) {
        for(var i = partition.base; i < partition.limit; i++) {
            Memory[i] = "00";
            console.log(Memory[i])
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
