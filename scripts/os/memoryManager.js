function MemoryManager() {
    this.storeByte = function(address, hex) {
      Memory[address] = hex;
    };
}