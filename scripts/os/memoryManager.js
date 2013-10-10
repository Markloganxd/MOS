function MemoryManager() {
    this.getByte = function(address) {
        return Memory[address];
    }
    
    this.storeByte = function(address, value) {
        Memory[address] = value;    
    }
    
    this.clearMemory = function() {
        for(var i = 0; i < 256; i++) {
            Memory[i] = "00";
        }
    }
}