function MemoryManager() {
    that = this;
    this.partitionSize = 256;
    this.getByte = function(address) {
        return Memory[address];
    }
    
    this.storeByte = function(address, value) {
        Memory[address] = value;    
    }
    
    this.clearMemory = function() {
        for(var i = 0; i < that.partitionSize; i++) {
            Memory[i] = "00";
        }
    }
}