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
    // TODO: Check for running processes.  Alert if there are some, alert and stop.  Else...    
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
    /* This gets called from the host hardware sim every time there is a hardware clock pulse.
       This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
       This, on the other hand, is the clock pulse from the hardware (or host) that tells the kernel 
       that it has to look for interrupts and process them if it finds any.                           */

    // Check for an interrupt, are any. Page 560
    if (_KernelInterruptQueue.getSize() > 0) {
        // Process the first interrupt on the interrupt queue.
        // TODO: Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
        var interrupt = _KernelInterruptQueue.dequeue();
        krnInterruptHandler(interrupt.irq, interrupt.params);
    }
    else if (_CPU.isExecuting) // If there are no interrupts then run one CPU cycle if there is anything being processed.
    {
        _CPU.cycle();
        //refresh the status
    }
    else // If there are no interrupts and there is nothing being executed then just be idle.
    {
        krnTrace("Idle");
    }
    document.getElementById("status").innerHTML = "Status: " + _OsStatus + "  --  " + new Date();
    var html = "<table>";
    for (var i = 1; i <= 256; i++) {
        html += "<td>" + _MemoryManager.getByte(i - 1) + "</td>";
        if (i % 8 === 0) {
            html += "</tr><tr>";
        }
    }
    html += "</tr></table>";
    document.getElementById("memory").innerHTML = html
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
    case KEYBOARD_IRQ:
        // no keys are processed if the console isn't active
        if (_StdIn.active) {
            krnKeyboardDriver.isr(params); // Kernel mode device driver
            _StdIn.handleInput();
        }
        break;
    case OS_ERROR:
        krnTrapError("OS error!");
        break;
    case KEYBOARD_ERROR:
        krnTrapError("Invalid character press");
        break;
    default:
        krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
    }
}

function krnTimerISR() // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver).
{
    // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
}


//
// System Calls... that generate software interrupts via tha Application Programming Interface library routines.
//
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
var krnProcesses = [];

// register a pcb into the map
function krnRegisterProcess(pid, pcb) {
    krnProcesses[pid] = pcb;    
}

function krnStartProcess(pid) {
    _CurrentProcess = krnProcesses[pid];
    _CPU.switchTo(krnProcesses[pid]);
    _CPU.isExecuting = true;
}

function krnCreateProcess(codes) {
    // TODO get starting address for process (currently just using 0)
    var startAddress = 0;
    var currentAddress = startAddress;
    
    // puts codes in memory
    codes.forEach(function(code) {
        _MemoryManager.storeByte(currentAddress, code);
        currentAddress++;
    });
    
    // create pcb
    var pcb = new ProcessControlBlock();
    pcb.pid = getNewPid();
    pcb.start = startAddress;
    pcb.end = 256;
    
    // adds to pcb map
    krnRegisterProcess(pcb.pid, pcb);
}

function krnRunProcess(pid) {
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
