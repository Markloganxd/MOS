/* ------------  
   CPU.js

   Requires global.js.
   
   Routines for the host CPU simulation, NOT for the OS itself.  
   In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
   that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
   JavaScript in both the host and client environments.

   This code references page numbers in the text book: 
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

function Cpu() {
    this.PC = 0;     // Program Counter
    this.Acc = 0;    // Accumulator
    this.Xreg = 0;   // X register
    this.Yreg = 0;   // Y register
    this.Zflag = 0;  // Z-ero flag (Think of it as "isZero".)
    this.isExecuting = false;
    
    this.init = function() {
        this.PC = 0;
        this.Acc = 0;
        this.Xreg = 0;
        this.Yreg = 0;
        this.Zflag = 0;      
        this.isExecuting = false;  
    };
    
    // store the state of the cpu into pcb
    this.storeInto = function(pcb) {
      pcb.PC = this.PC;  
      pcb.Acc = this.Acc;
      pcb.Xreg = this.Xreg;  
      pcb.Yreg = this.Yreg;  
      pcb.Zflag = this.Zflag;  
    };
    
    // context switch
    this.switchTo = function(pcb) {
        this.PC = pcb.start;
        this.Acc = pcb.Acc;
        this.Xreg = pcb.Xreg;
        this.Yreg = pcb.Yreg;
        this.Zflag = pcb.Zflag;
    };
    
    // perform an operation
	var perform = function(opcode) {
	    console.log(opcode);
		switch(opcode) {
			case "A9": loadAccumulatorWithConstant(); break;
			case "AD": loadAccumulatorFromAddress(); break;
			case "8D": storeAccumulatorIntoAddress(); break;
			case "6D": addWithCarry(); break;
			case "A2": loadXRegisterWithConstant(); break;
			case "AE": loadXRegisterFromAddress(); break;
			case "A0": loadYRegisterWithConstant(); break;
			case "AC": loadYRegisterFromAddress(); break;
			case "EA": noOperation(); break;
			case "00": sysBreak(); break;
			case "EC": compareToXRegister(); break;
			case "D0": branchIfNotEqual(); break;
			case "EE": incrementValueAtAddress(); break;
			case "FF": sysCall(); break;
			default: sysBreak(); break;
		}
	};
	
    this.cycle = function() {
        krnTrace("CPU cycle");
        while (_MemoryManager.getByte(_CPU.PC) !== "00") {
            var opcode = _MemoryManager.getByte(_CPU.PC);
            this.PC++;
            perform(opcode);
            //console.log("acc: " + this.Acc + "\n" + "PC" + this.PC + "\n" + " ---------- ");
        }
        
        this.isExecuting = false;
        
        // updating current pcb
        this.storeInto(_CurrentProcess);
        _StdIn.putText("Process finished. State of PCB: ")
        _StdIn.advanceLine();
        _StdIn.putText(_CurrentProcess.toString());
        _StdIn.advanceLine();
        // TODO: Accumulate CPU usage and profiling statistics here.
    };
}

function loadAccumulatorWithConstant() {
    // store the decimal value of the data at the program counter into the accumulator
    _CPU.Acc = hexToDecimal(_MemoryManager.getByte(_CPU.PC));
    console.log("in");   
    // Increment the program counter
    _CPU.PC++; 
}

function loadAccumulatorFromAddress() {
    // get the bytes that make up the address (they are stored backwards for some reason)
    var addressSecondHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    var addressFirstHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    // create the full address
    var address = (addressFirstHalf + addressSecondHalf);
    // convert to decimal
    var addressInDecimal = hexToDecimal(address);
    
    // check if address is within reach of process
    if (_CurrentProcess.contains(addressInDecimal)) {
        // Place contents of the memory location in the ACC
        _CPU.Acc = hexToDecimal(_MemoryManager.getByte(addressInDecimal));
    }
    else {
        // shutdown!
        krnShutdown();
    }
}

function storeAccumulatorIntoAddress() {
    // get the bytes that make up the address (they are stored backwards for some reason)
    var addressSecondHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    var addressFirstHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    // create the full address
    var address = (addressFirstHalf + addressSecondHalf);
    // convert to decimal
    var addressInDecimal = hexToDecimal(address);
    
    console.log("address: " + address);
    console.log("decaddress: " + addressInDecimal);
    
    // store data if address is within reach
    if (_CurrentProcess.contains(addressInDecimal)) {
        var hexForm = decimalToHex(_CPU.Acc);
        _MemoryManager.storeByte(addressInDecimal, hexForm);
    }
    else {
        // shutdown!
        krnShutdown();
    }
}

function addWithCarry() {
    // get the bytes that make up the address (they are stored backwards for some reason)
    var addressSecondHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    var addressFirstHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    // create the full address
    var address = (addressFirstHalf + addressSecondHalf);
    // convert to decimal
    var addressInDecimal = hexToDecimal(address);
    
    // add value of address into acc if address is within reach
    if (_CurrentProcess.contains(addressInDecimal)) {
        _CPU.Acc += hexToDecimal(_MemoryManager.getByte(addressInDecimal));
    }
    else {
        // shutdown!
        krnShutdown();
    }
}

function loadXRegisterWithConstant() {
    // store next byte as constant into x register
    _CPU.Xreg = hexToDecimal(_MemoryManager.getByte(_CPU.PC));
    console.log(_CPU.Xreg);
    _CPU.PC++;
}

function loadXRegisterFromAddress() {
    // get the bytes that make up the address (they are stored backwards for some reason)
    var addressSecondHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    var addressFirstHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    // create the full address
    var address = (addressFirstHalf + addressSecondHalf);
    // convert to decimal
    var addressInDecimal = hexToDecimal(address);
    
    // load value of address into x register if it's within reach
    if (_CurrentProcess.contains(addressInDecimal)) {
        _CPU.Xreg = decimalToHex(_MemoryManager.getByte(addressInDecimal));
    }
    else {
        // shutdown!
        krnShutdown();
    }
}

function loadYRegisterWithConstant() {
    // store next byte as constant into y register
    _CPU.Yreg = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
}

function loadYRegisterFromAddress() {
    // get the bytes that make up the address (they are stored backwards for some reason)
    var addressSecondHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    var addressFirstHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    // create the full address
    var address = (addressFirstHalf + addressSecondHalf);
    // convert to decimal
    var addressInDecimal = hexToDecimal(address);
    
    // load value of address into y register if it's within reach
    if (_CurrentProcess.contains(addressInDecimal)) {
        _CPU.Yreg = decimalToHex(_MemoryManager.getByte(addressInDecimal));
    }
    else {
        // shutdown!
        krnShutdown();
    }
}

function noOperation() {
    // nothing to see here
}

function sysBreak() {
    _CPU.isExecuting = false;
}

function compareToXRegister() {
    // get the bytes that make up the address (they are stored backwards for some reason)
    var addressSecondHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    var addressFirstHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    // create the full address
    var address = (addressFirstHalf + addressSecondHalf);
    // convert to decimal
    var addressInDecimal = hexToDecimal(address);
    
    // check if address is within reach of process
    if (_CurrentProcess.contains(addressInDecimal)) {
        // Set z flag if contents of address is equal to x register
        _CPU.Zflag = (hexToDecimal(_MemoryManager.getByte(addressInDecimal)) === _CPU.Xreg) ? 1 : 0;
    }
    else {
        // shutdown!
        krnShutdown();
    }
}

function branchIfNotEqual() {
    if (_CPU.Zflag === 0) {
        // get amount to jump ahead
        var branchOffset = hexToDecimal(_MemoryManager.getByte(_CPU.PC));
        _CPU.PC++;

        // offset the PC
        _CPU.PC += branchOffset;

        // wrap around the memory block
        _CPU.PC %= 256;
    }
    else {
        // skip the parameter byte
        _CPU.PC++;
    }
}

function incrementValueAtAddress() {
    // get the bytes that make up the address (they are stored backwards for some reason)
    var addressSecondHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    var addressFirstHalf = _MemoryManager.getByte(_CPU.PC);
    _CPU.PC++;
    // create the full address
    var address = (addressFirstHalf + addressSecondHalf);
    // convert to decimal
    var addressInDecimal = hexToDecimal(address);
    
    // check if address is within reach of process
    if (_CurrentProcess.contains(addressInDecimal)) {
        var value = hexToDecimal(_MemoryManager.getByte(addressInDecimal));
        // increment
        value++;
        // convert back to hex
        var hexValue = decimalToHex(value);
        // store back into memory
        _MemoryManager.storeByte(addressInDecimal, hexForm);
    }
    else {
        // shutdown!
        krnShutdown();
    }
}

function sysCall() {
    // output the value of the y register (as a decimal)
    if (_CPU.Xreg === 1) {
        
        // removing leading zeros
        var value = _CPU.Yreg.toString().replace(/^0/, '');
        _StdIn.putText(value);

        // new line
        _StdIn.advanceLine();
    }
    //	output null terminated string starting from y register
    else if (_CPU.Xreg === 2) {
        // starting position
        var addressInDecimal = hexToDecimal(_CPU.Yreg);
        
        var hexValue = _MemoryManager.getByte(addressInDecimal);
        
        while (hexValue != "00") {
            // turn key code number into char and output it
            var charCode = hexToDecimal(hexValue);
            var chr = String.fromCharCode(charCode);
            _StdIn.putText(chr);
            
            // Increment the address
            addressInDecimal++;
            hexValue = _MemoryManager.getByte(addressInDecimal);
        }
        // new line
        _StdIn.advanceLine();
    }
}
