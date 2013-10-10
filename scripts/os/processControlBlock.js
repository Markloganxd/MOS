function ProcessControlBlock() {
    this.pid = 0;
    this.start = 0;
    this.end = 0;
    
    // used for saving state of CPU
    this.PC = 0;     // Program Counter
    this.Acc = 0;    // Accumulator
    this.Xreg = 0;   // X register
    this.Yreg = 0;   // Y register
    this.Zflag = 0;  // Z-ero flag (Think of it as "isZero".)
    
    var that = this;
    this.contains = function(address) {
        return (address >= that.start) && (address < that.end);        
    }
}