function ProcessControlBlock() {
    this.pid = 0;
    this.partition = null;
    
    // used for saving state of CPU
    this.PC = 0;     // Program Counter
    this.Acc = 0;    // Accumulator
    this.Xreg = 0;   // X register
    this.Yreg = 0;   // Y register
    this.Zflag = 0;  // Z-ero flag (Think of it as "isZero".)
    
    var that = this;
    this.contains = function(address) {
        var absoluteAddress = that.partition.base + address;
        return (absoluteAddress >= that.partition.base) && (absoluteAddress < that.partition.limit);        
    }
    this.toString = function(){
        return "pid: " + this.pid + ", PC: " + this.PC + ", Acc: " + this.Acc + ", Xreg: " + this.Xreg + ", Yreg: " + this.Yreg + ", Zflag: " + this.Zflag
    }
}