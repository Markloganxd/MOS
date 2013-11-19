/* ------------
   Kernel.js

   Requires globals.js

   Routines for the Operating System, NOT the host.

   This code references page numbers in the text book: 
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */


//
// OS Startup and Shutdown Routines   
//
function krnBootstrap() // Page 8.
{
  hostLog("bootstrap", "host"); // Use hostLog because we ALWAYS want this, even if _Trace is off.

  // Initialize our global queues.
  _KernelInterruptQueue = new Queue(); // A (currently) non-priority queue for interrupt requests (IRQs).
  _KernelBuffers = new Array(); // Buffers... for the kernel.
  _KernelInputQueue = new Queue(); // Where device input lands before being processed out somewhere.

  _Console = new CLIconsole(); // The command line interface / console I/O device.

  // Initialize the CLIconsole.
  _Console.init();

  // Initialize standard input and output to the _Console.
  _StdIn = _Console;
  _StdOut = _Console;

  // Load the Keyboard Device Driver
  krnTrace("Loading the keyboard device driver.");
  krnKeyboardDriver = new DeviceDriverKeyboard(); // Construct it.  TODO: Should that have a _global-style name?
  krnKeyboardDriver.driverEntry(); // Call the driverEntry() initialization routine.
  krnTrace(krnKeyboardDriver.status);

  //
  // ... more?
  //

  // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
  krnTrace("Enabling the interrupts.");
  krnEnableInterrupts();

  _OsStatus = "Operational";

  // Launch the shell.
  krnTrace("Creating and Launching the shell.");
  _OsShell = new Shell();
  _OsShell.init();
  // Finally, initiate testing.
  if (_GLaDOS) {
    _GLaDOS.afterStartup();
  }
}

function krnShutdown() {
  krnTrace("begin shutdown OS");
  // ... Disable the Interrupts.
  krnTrace("Disabling the interrupts.");
  krnDisableInterrupts();
  // 
  // Unload the Device Drivers?
  // More?
  //
  krnTrace("end shutdown OS");
}

function krnOnCPUClockPulse() {
  // call the timer isr here (otherwise the 'else if' clause will never be met)
  krnTimerISR();

  // Check for an interrupt, are any. Page 560
  if (_KernelInterruptQueue.getSize() > 0) {
    // Process the first interrupt on the interrupt queue.
    var interrupt = _KernelInterruptQueue.dequeue();
    krnInterruptHandler(interrupt.irq, interrupt.params);
  } else if (_ReadyQueue.length > 0) {
    // run a cpu cycle
    _CPU.cycle(); 
  } else {
    // krnTrace("Idle");
  }
  // refresh status
  document.getElementById("status").innerHTML = "Status: " + _OsStatus + "  --  " + new Date();

  // refresh memory
  var html = "<table><tr id=\'partition1\'>";
  for (var i = 0; i < _MemoryManager.partitions.length; i++) {
    for (var j = 1; j <= _MemoryManager.partitionSize; j++) {
      html += "<td>" + _MemoryManager.getByte(_MemoryManager.getPartition(i), j - 1) + "</td>";
      if (j % 8 === 0) {
        html += "</tr><tr id=\'partition" + (i + 1) + "\'>";
      }
    }
  }
  // refresh cpu data
  html += "</tr></table>";
  document.getElementById("memory").innerHTML = html;
  document.getElementById("Accumulator").innerHTML = _CPU.Acc;
  document.getElementById("PC").innerHTML = _CPU.PC;
  document.getElementById("Xregister").innerHTML = _CPU.Xreg;
  document.getElementById("Yregister").innerHTML = _CPU.Yreg;
  document.getElementById("Zflag").innerHTML = _CPU.Zflag;

  // refresh ready queue
  for (var i = 0; i < _MemoryManager.partitions.length; i++) {
    if (i < _ReadyQueue.length) {
      document.getElementById("pid" + i).innerHTML = _ReadyQueue[i].pid;
      document.getElementById("state" + i).innerHTML = _ReadyQueue[i].state;
      document.getElementById("base" + i).innerHTML = _ReadyQueue[i].partition.base;
      document.getElementById("limit" + i).innerHTML = _ReadyQueue[i].partition.limit;
    } else {
      document.getElementById("pid" + i).innerHTML = "-";
      document.getElementById("state" + i).innerHTML = "-";
      document.getElementById("base" + i).innerHTML = "-";
      document.getElementById("limit" + i).innerHTML = "-";
    }
  }
}

// 
// Interrupt Handling
// 
function krnEnableInterrupts() {
  // Keyboard
  hostEnableKeyboardInterrupt();
  // Put more here.
}

function krnDisableInterrupts() {
  // Keyboard
  hostDisableKeyboardInterrupt();
  // Put more here.
}

function krnInterruptHandler(irq, params) // This is the Interrupt Handler Routine.  Pages 8 and 560.
{
  // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on.  Page 766.
  krnTrace("Handling IRQ~" + irq);

  // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
  // TODO: Consider using an Interrupt Vector in the future.
  // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.  
  //       Maybe the hardware simulation will grow to support/require that in the future.
  switch (irq) {
    case TIMER_IRQ:
      krnTimerISR(); // Kernel built-in routine for timers (not the clock).
      break;
    case CONSOLE_OUTPUT_IRQ:
      console.log('doin it');
      writeToConsole(params);
      break;
    case TERMINATE_PROCESS_IRQ:
      krnTerminateCurrentProcess();
      break;
    case KEYBOARD_IRQ:
      // no keys are handled if the console isn't active
      krnKeyboardDriver.isr(params); // Kernel mode device driver
      if (_StdIn.active) {
        _StdIn.handleInput();
      }
      break;
    case CONTEXT_SWITCH_IRQ:
      _CPU.switchTo(krnFetchProcess(params));
      hostLog("Changing context to process " + params + ".");
      break;
    case OS_ERROR:
      krnTrapError("OS error!");
      break;
    case KEYBOARD_ERROR:
      hostLog("Invalid character press");
      break;
    case WRITE_VIOLATION_IRQ:
      hostLog("Write violation occurred at address: " + params);
      break;
    case READ_VIOLATION_IRQ:
      hostLog("Read violation occurred at address: " + params);
      break;
    default:
      krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
  }
}

function krnTimerISR() // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver).
{
  // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
  if (SCHEDULER_COUNT > SCHEDULER_QUANTUM && _CurrentProcess != null) {
  // switch process if the time quantum has expired
    _ReadyQueue.push(_CurrentProcess);
    _ReadyQueue.shift()
    _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _ReadyQueue[0].pid));
    hostLog("Scheduler Quantum reached. ");
    SCHEDULER_COUNT = 0;
  }
  SCHEDULER_COUNT++;
}


//
// System Calls... that generate software interrupts via tha Application Programming Interface library routines.
function writeToConsole(type) {
  if (type === 1) {
    // removing leading zeros
    var value = _CPU.Yreg.toString().replace(/^0/, '');
    _StdOut.putText(value);
  }
  //	output null terminated string starting from y register
  else if (type === 2) {
    // starting position
    var currentAddress = hexToDecimal(_CPU.Yreg);
    var hexValue = _MemoryManager.getByte(_CurrentProcess.partition, currentAddress);
    while (hexValue != "00") {
      // turn key code number into char and output it
      var charCode = hexToDecimal(hexValue);
      var chr = String.fromCharCode(charCode);
      _StdOut.putText(chr);

      // Increment the address
      currentAddress++;
      hexValue = _MemoryManager.getByte(_CurrentProcess.partition, currentAddress);
    }
  }
  // new line
  _StdOut.advanceLine();
}


// Some ideas:
// - ReadConsole
// - WriteConsole
// - CreateProcess
// - ExitProcess
// - WaitForProcessToExit
// - CreateFile
// - OpenFile
// - ReadFile
// - WriteFile
// - CloseFile


// mapping of pids to process control blocks
var _Residents = [];

// get PCB from pid
function krnFetchProcess(pid) {
  if(typeof _Residents[pid] == 'undefined') {
    // does not exist
    hostLog("pid " + pid + " does not exist.")
      return null;
  } else {
    // does exist
    return _Residents[pid];    
  }
}

function krnTerminateCurrentProcess() {
  //_CPU.isExecuting = false;
  _StdOut.putText("Process finished. State of PCB: ")
  _StdOut.advanceLine();
  _StdOut.putText(_CurrentProcess.toString());
  _StdOut.advanceLine();

  _MemoryManager.clearPartition(_CurrentProcess.partition);
  _ReadyQueue.shift();
  delete _Residents[_CurrentProcess.pid];
  if (_ReadyQueue.length === 0) {
    _CurrentProcess = null;
  } else {
    _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _ReadyQueue[0].pid));
    SCHEDULER_COUNT = 0;
  }
  //_CPU.isExecuting = false;
}

function krnKillProcess(pid) {
  // see if the pid is in the ready queue
  var index = -1;
  for (var i = 0; i < _ReadyQueue.length; i++) {
    if (_ReadyQueue[i].pid === pid) {
      index = i;
    }
  }

  // if it is, then kill it 
  if (index !== -1) {
    _ReadyQueue.splice(index, index + 1);
    // switch the context if the killed process with currently active
    if (index === 0 && _ReadyQueue.length > 0) {
      _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _ReadyQueue[0].pid));
    } else if (_ReadyQueue.length === 0) {
      _CurrentProcess = null;
    }
  }
}

// register a pcb into the map
function krnRegisterProcess(pid, pcb) {
  _Residents[pid] = pcb;    
}

function krnStartProcess(pid) {
  var process = krnFetchProcess(pid);
  if (process !== null) {
    _ReadyQueue.push(process);
    if (_CurrentProcess === null) {
      _CurrentProcess = _ReadyQueue[0];
      _CPU.switchTo(_ReadyQueue[0]);
    }
  }
}

function krnStartAllProcesses(pid) {
  for (var i = 0; i < _Residents.length; ++i) {
    var process = _Residents[i];
    krnStartProcess(process.pid);
  }
}

function krnCreateProcess(codes) {
  // clear memory in current block
  var partition = _MemoryManager.getFreePartition();
  if (partition != null) {
    var currentAddress = 0;

    // puts codes in memory
    codes.forEach(function(code) {
      _MemoryManager.storeByte(partition, currentAddress, code);
      currentAddress++;
    });

    // create pcb
    var pcb = new ProcessControlBlock();
    pcb.pid = getNewPid();
    pcb.partition = partition;

    // adds to pcb map
    krnRegisterProcess(pcb.pid, pcb);
    return pcb.pid;
  } else {
    return -1;
  }
}

function getNewPid() {
  return PID_INCREMENTER++;
}

//
// OS Utility Routines
//
function krnTrace(msg) {
  // Check globals to see if trace is set ON.  If so, then (maybe) log the message. 
  if (_Trace) {
    if (msg === "Idle") {
      // We can't log every idle clock pulse because it would lag the browser very quickly.
      if (_OSclock % 10 == 0) // Check the CPU_CLOCK_INTERVAL in globals.js for an 
      { // idea of the tick rate and adjust this line accordingly.
        hostLog(msg, "OS");
      }
    }
    else {
      hostLog(msg, "OS");
    }
  }
}

function krnTrapError(msg) {
  hostLog("OS ERROR - TRAP: " + msg);
  krnShutdown();
  document.write("DEATH<br/>" + msg)
}
