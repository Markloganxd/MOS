/* ------------  
   Devices.js

   Requires global.js.
   
   Routines for the hardware simulation, NOT for our client OS itself. In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
   that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
   JavaScript in both the host and client environments.
   
   This (and simulation scripts) is the only place that we should see "web" code, like 
   DOM manipulation and JavaScript event handling, and so on.  (Index.html is the only place for markup.)
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

var _hardwareClockID = -1;

//
// Hardware/Host Clock Pulse
//
function hostClockPulse()
{
   // Increment the hardware (host) clock.
   _OSclock++;
   // Call the kernel clock pulse event handler.
   krnOnCPUClockPulse();

   // refresh the view of our operating system components
   refreshDisplay();
}


//
// Keyboard Interrupt, a HARDWARE Interrupt Request. (See pages 560-561 in text book.)
//
function hostEnableKeyboardInterrupt()
{
    // Listen for key press (keydown, actually) events in the Document
    // and call the simulation processor, which will in turn call the 
    // OS interrupt handler.
    document.addEventListener("keydown", hostOnKeypress, false);
}

function hostDisableKeyboardInterrupt()
{
    document.removeEventListener("keydown", hostOnKeypress, false);
}

function hostOnKeypress(event)
{
    // The canvas element CAN receive focus if you give it a tab index, which we have.
    // Check that we are processing keystrokes only from the canvas's id (as set in index.html).
    if (event.target.id == "display")
    {
        event.preventDefault();
        // Note the pressed key code in the params (Mozilla-specific).
        var params = new Array(event.which, event.shiftKey);
        // Enqueue this interrupt on the kernel interrupt queue so that it gets to the Interrupt handler.
        _KernelInterruptQueue.enqueue( new Interrupt(KEYBOARD_IRQ, params) );
    }
}

function refreshDisplay() {
  // refresh status
  document.getElementById("status").innerHTML = "Status: " + _OsStatus + "  --  " + new Date();

  // refresh memory
  var html = "<h3>Memory</h3>";
  html += "<table><tr id=\'partition1\'>";
  for (var i = 0; i < _MemoryManager.partitions.length; i++) {
    for (var j = 1; j <= _MemoryManager.partitionSize; j++) {
      html += "<td>" + _MemoryManager.getByte(_MemoryManager.getPartition(i), j - 1) + "</td>";
      if (j % 8 === 0) {
        html += "</tr><tr id=\'partition" + (i + 1) + "\'>";
      }
    }
  }
  html += "</tr></table>";
  document.getElementById("memory").innerHTML = html;

  // refresh cpu data
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
      if (_ReadyQueue[i].partition !== null) {
        document.getElementById("base" + i).innerHTML = _ReadyQueue[i].partition.base;
      } else {
        document.getElementById("base" + i).innerHTML = "HDD";
      }
      if (_ReadyQueue[i].partition !== null) {
        document.getElementById("limit" + i).innerHTML = _ReadyQueue[i].partition.limit;
      } else {
        document.getElementById("limit" + i).innerHTML = "HDD";
      }
      document.getElementById("priority" + i).innerHTML = _ReadyQueue[i].priority;
    } else {
      document.getElementById("pid" + i).innerHTML = "-";
      document.getElementById("state" + i).innerHTML = "-";
      document.getElementById("base" + i).innerHTML = "-";
      document.getElementById("limit" + i).innerHTML = "-";
      document.getElementById("priority" + i).innerHTML = "-";
    }
  }

  // refresh file system
  html = "<h3>File System</h3>";
  html += "<table>";
  for (var track = 0; track < 4; track++) {
    for (var sector = 0; sector < 8; sector++) {
      for (var block = 0; block < 8; block++) {
        html += "<tr>";
        html += "<td>" + track + "" + sector + "" + block + "</td>";
        html += "<td>" + new TSB(track + "" + sector + "" + block).toString() + "</td>";
        html += "</tr>";
      }
    }
  }
  html += "</table>";
  document.getElementById("filesystem").innerHTML = html;
}

