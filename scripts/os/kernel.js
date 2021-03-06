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

  // Load the FileSystem Device Driver
  krnTrace("Loading the Filesystem device driver.");
  krnFileSystemDriver = new DeviceDriverFileSystem(); // Construct it.  TODO: Should that have a _global-style name?
  krnFileSystemDriver.driverEntry(); // Call the driverEntry() initialization routine.
  krnTrace(krnFileSystemDriver.status);

  // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
  krnTrace("Enabling the interrupts.");
  krnEnableInterrupts();

  _OsStatus = "Operational";

  // Launch the shell.
  krnTrace("Creating and Launching the shell.");
  _OsShell = new Shell();
  _OsShell.init();
  krnFileSystemDriver.formatFileSystem();
  
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
  //console.log("clockpulse");
  //console.log("currentProcess: " + _CurrentProcess.pid);
  //console.log("readyQueueTop: " + _ReadyQueue[0].pid);

  // Check for an interrupt, are any. Page 560
  if (_KernelInterruptQueue.getSize() > 0) {
    // Process the first interrupt on the interrupt queue.
    var interrupt = _KernelInterruptQueue.dequeue();
    krnInterruptHandler(interrupt.irq, interrupt.params);
  } else if (_ReadyQueue.length > 0) {
    // run a cpu cycle
    updateScheduler();
    _CPU.cycle(); 
  } else {
    // krnTrace("Idle");
  }
  // call the timer isr here (otherwise the 'else if' clause will never be met)
  //krnTimerISR();
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

function getLeastImportantProcess() {
  if (SCHEDULER_TYPE === "priority") {
    // get least priority process
    var lowestProcess = _ReadyQueue[0];
    for (var i = 0; i < _ReadyQueue.length; i++) {
      if (_ReadyQueue[i].partition !== null && _ReadyQueue[i].priority < lowestProcess.priority) {
        lowestProcess = _ReadyQueue[i];
      }
    }
    return lowestProcess;
  } else {
    // get last partition-using process
    var lastProcess = _ReadyQueue[0];
    for (var i = 0; i < _ReadyQueue.length; i++) {
      if (_ReadyQueue[i].partition !== null) {
        lastProcess = _ReadyQueue[i];
      }
    }
    return lastProcess;
  }
  return null;
}

function krnGetProcessInPartition(partition) {
  for (var i = 0; i < _ReadyQueue.length; i++) {
    if (_ReadyQueue[i].partition === partition) {
      return _ReadyQueue[i];
    }
  }
  return null;
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
      krnTimerISR(params); // Kernel built-in routine for timers (not the clock).
      break;
    case CONSOLE_OUTPUT_IRQ:
      writeToConsole(params);
      break;
    case TERMINATE_PROCESS_IRQ:
      krnKillProcess(params);
      break;
    case KEYBOARD_IRQ:
      // no keys are handled if the console isn't active
      krnKeyboardDriver.isr(params); // Kernel mode device driver
      if (_StdIn.active) {
        _StdIn.handleInput();
      }
      break;
    case CONTEXT_SWITCH_IRQ:
      hostLog("Changing context to process " + params + ".");
      var process = krnFetchProcess(params);
      if (process !== null && _ReadyQueue.indexOf(process) !== -1) {
        if (process.partition === null) {
          var partition = _MemoryManager.getFreePartition();
          if (partition !== null) {
            _MemoryManager.rollIn(process, partition);
          } else {
            var swappedProcess = getLeastImportantProcess();
            var emptyPartition = swappedProcess.partition;
            _MemoryManager.rollOut(swappedProcess);
            _MemoryManager.rollIn(process, emptyPartition);
          }
        }
        _CPU.switchTo(process);
        // position the new current process as the first in ready queue
        while (_ReadyQueue[0].pid !== _CurrentProcess.pid) {
          _ReadyQueue.push(_ReadyQueue.shift());
        }
        SCHEDULER_COUNT = 0;
      }
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

function krnTimerISR(params) // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver).
{
  _ReadyQueue.push(_CurrentProcess);
  _ReadyQueue.shift();
  if (_CurrentProcess !== _ReadyQueue[0]) {
    _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _ReadyQueue[0].pid));
  }
}

function updateScheduler() {
  // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
  if (SCHEDULER_TYPE === "rr") {
    if (SCHEDULER_COUNT >= SCHEDULER_QUANTUM - 1 && _CurrentProcess != null) {
      // switch process if the time quantum has expired
      _KernelInterruptQueue.enqueue(new Interrupt(TIMER_IRQ, ""));
      hostLog("Scheduler Quantum reached. ");
    }
  } else if (SCHEDULER_TYPE === "fcfs") {
    // do nothing
  } else if (SCHEDULER_TYPE === "priority") {
    // do nothing
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
var _Residents = {};

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

//function krnTerminateCurrentProcess() {
  ////_CPU.isExecuting = false;

  //_MemoryManager.clearPartition(_CurrentProcess.partition);
  //console.log("removing process " + _CurrentProcess.pid + " from ready queue of size: " + _ReadyQueue.length);
  //console.log("before: ");
  //for (var i = 0; i < _ReadyQueue.length; i++) {
    //console.log(_ReadyQueue[i].toString());
  //}
  //_ReadyQueue.shift();
  //console.log("after: ");
  //for (var i = 0; i < _ReadyQueue.length; i++) {
    //console.log(_ReadyQueue[i].toString());
  //}
  //// remove from residents list
  //delete _Residents[_CurrentProcess.pid];
  //if (_ReadyQueue.length === 0) {
    //_CurrentProcess = null;
  //} else {
    //_KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _ReadyQueue[0].pid));
  //}
  ////_CPU.isExecuting = false;
//}
function getNextRunningProcess() {
  if (SCHEDULER_TYPE === "rr") {
    return _ReadyQueue[0];
  } else if (SCHEDULER_TYPE === "fcfs") {
    return _ReadyQueue[0];
  } else if (SCHEDULER_TYPE === "priority") {
    var priorityPcb = _ReadyQueue[0];
    for (var i = 0; i < _ReadyQueue.length; i++) {
      if (priorityPcb.priority < _ReadyQueue[i].priority) {
        priorityPcb = _ReadyQueue[i];
      }
    }
    return priorityPcb;
  }
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
    _ReadyQueue[index].state = "Dead";
    // print death message
    _StdOut.putText("Process finished. State of PCB: ")
    _StdOut.advanceLine();
    _StdOut.putText(_Residents[pid].toString());
    _StdOut.advanceLine();

    // clear the memory or file containing process
    if (_ReadyQueue[index].partition !== null) {
      _MemoryManager.clearPartition(_ReadyQueue[index].partition);
    } else if (krnFileSystemDriver.findDirectory("_process_" + pid) !== null) {
      krnFileSystemDriver.deleteFile("_process_" + pid);
    }
    // remove the process from Ready Queue
    _ReadyQueue.splice(index, 1);
    // remove from residents list
    delete _Residents[pid];

    // switch the context if the killed process is currently active
    if (index === 0 && _ReadyQueue.length > 0) {
      krnUpdateProcessOrder();
      //_KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _ReadyQueue[0].pid));
    } else if (_ReadyQueue.length === 0) {
      _CurrentProcess = null;
    }
    return true;
  } else {
    // process doesn't exist or isn't running
    return false;
  }
}

// register a pcb into the map
function krnRegisterProcess(pid, pcb) {
  _Residents[pid] = pcb;    
}

function krnStartProcess(pid) {
  var process = krnFetchProcess(pid);
  if (process !== null) {
    process.state = "Waiting";
    _ReadyQueue.push(process);
    // only reassign the running process if none are running currently
    if (_CurrentProcess === null) {
      krnUpdateProcessOrder();
    }
  }
}

function krnUpdateProcessOrder() {
  if (SCHEDULER_TYPE === "priority") {
    _ReadyQueue = _ReadyQueue.sort(function(a, b) {
      if (b.priority < a.priority) return 1;
      else if (b.priority > a.priority) return -1;
      else return 0;
    });
  }
  if (_ReadyQueue.length > 0) {
    var nextProcess = _ReadyQueue[0];
    if (_CurrentProcess !== nextProcess) {
      _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, nextProcess.pid));
    }
  }
}

function krnStartAllProcesses(pid) {
  //for (var i = 0; i < _Residents.length; ++i) {
  for (var key in _Residents) {
    var process = _Residents[key];
    krnStartProcess(process.pid);
  }
}

function krnCreateProcess(codes, priority) {
  // create pcb
  var pcb = new ProcessControlBlock();
  pcb.pid = getNewPid();
  pcb.priority = priority;

  // adds to pcb map
  krnRegisterProcess(pcb.pid, pcb);

  // clear memory in current block
  var partition = _MemoryManager.getFreePartition();
  if (partition != null) {
    var currentAddress = 0;

    // puts codes in memory
    codes.forEach(function(code) {
      _MemoryManager.storeByte(partition, currentAddress, code);
      currentAddress++;
    });

    // register the partition
    pcb.partition = partition;
  } else {
    // tell the pcb that it's not in memory
    pcb.partition = null;
    
    // put into filesystem
    krnFileSystemDriver.createFile("_process_" + pcb.pid);
    krnFileSystemDriver.writeToFile("_process_" + pcb.pid, codes.join(" "));
  }
  return pcb.pid;
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
