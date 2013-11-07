/* ------------  
   Globals.js

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

//
// Global CONSTANTS
//
var APP_NAME = "MOS";  // 'cause I was at a loss for a better name.
var APP_VERSION = "0.01";   // What did you expect?

var CPU_CLOCK_INTERVAL = 100;   // This is in ms, or milliseconds, so 1000 = 1 second.

var TIMER_IRQ = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
                    // NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
var KEYBOARD_IRQ = 1;  
var OS_ERROR = 2;
var KEYBOARD_ERROR = 3;
var TERMINATE_PROCESS_IRQ = 4;
var CONTEXT_SWITCH_IRQ = 5;
var CONSOLE_OUTPUT_IRQ = 6;
var CONTEXT_SWITCH_IRQ = 7;
var WRITE_VIOLATION_IRQ = 8;
var READ_VIOLATION_IRQ = 9;


//
// Global Variables
//
var _CPU = null;

var _OSclock = 0;       // Page 23.

var _Mode = 0;   // 0 = Kernel Mode, 1 = User Mode.  See page 21.

var _MemoryManager = null;

var _CurrentProcess = null;

// process statuses
var RUNNING = 0;

var _Canvas = null;               // Initialized in hostInit().
var _DrawingContext = null;       // Initialized in hostInit().
var _DefaultFontFamily = "sans";  // Ignored, I think. The was just a place-holder in 2008, but the HTML canvas may have use for it.
var _DefaultFontSize = 13;
var _FontHeightMargin = 4;        // Additional space added to font size when advancing a line.

// Default the OS trace to be on.
var _Trace = true;

// OS queues
var _KernelInterruptQueue = null;
var _KernelBuffers = null;
var _KernelInputQueue = null;
var _ReadyQueue = [];

// OS status
var _OsStatus = "";

// Standard input and output
var _StdIn  = null;
var _StdOut = null;

// UI
 /** global desc*/
var _Console = null;
var _OsShell = null;

// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode = false;

// Global Device Driver Objects - page 12
var krnKeyboardDriver = null;

// PID incrementer 
var PID_INCREMENTER = 0;

// Scheduler data
var SCHEDULER_QUANTUM = 6;
var SCHEDULER_COUNT = 0;

// For testing...
var _GLaDOS = null;
