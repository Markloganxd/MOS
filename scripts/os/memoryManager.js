function MemoryManager() {
    this.getByte = function(address) {
        return Memory[address];
    }
    
    this.storeByte = function(address, value) {
        Memory[address] = value;    
    }
}