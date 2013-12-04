/* ------------
   Shell.js
   
   The OS Shell - The "command line interface" (CLI) for the console.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

function Shell() {
    // Properties
    this.promptStr = ">";
    this.commandList = [];
    this.curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
    this.apologies = "[sorry]";
    // Methods
    this.init = shellInit;
    this.putPrompt = shellPutPrompt;
    this.handleInput = shellHandleInput;
    this.execute = shellExecute;
}

function shellInit() {
    var sc = null;
    //
    // Load the command list.

    // ver
    sc = new ShellCommand();
    sc.command = "ver";
    sc.description = "- Displays the current version data.";
    sc.
    function = shellVer;
    this.commandList[this.commandList.length] = sc;

    // help
    sc = new ShellCommand();
    sc.command = "help";
    sc.description = "- This is the help command. Seek help.";
    sc.
    function = shellHelp;
    this.commandList[this.commandList.length] = sc;

    // shutdown
    sc = new ShellCommand();
    sc.command = "shutdown";
    sc.description = "- Shuts down the virtual OS but leaves the underlying hardware simulation running.";
    sc.
    function = shellShutdown;
    this.commandList[this.commandList.length] = sc;

    // cls
    sc = new ShellCommand();
    sc.command = "cls";
    sc.description = "- Clears the screen and resets the cursor position.";
    sc.
    function = shellCls;
    this.commandList[this.commandList.length] = sc;

    // man <topic>
    sc = new ShellCommand();
    sc.command = "man";
    sc.description = "<topic> - Displays the MANual page for <topic>.";
    sc.
    function = shellMan;
    this.commandList[this.commandList.length] = sc;

    // trace <on | off>
    sc = new ShellCommand();
    sc.command = "trace";
    sc.description = "<on | off> - Turns the OS trace on or off.";
    sc.
    function = shellTrace;
    this.commandList[this.commandList.length] = sc;

    // rot13 <string>
    sc = new ShellCommand();
    sc.command = "rot13";
    sc.description = "<string> - Does rot13 obfuscation on <string>.";
    sc.
    function = shellRot13;
    this.commandList[this.commandList.length] = sc;

    // prompt <string>
    sc = new ShellCommand();
    sc.command = "prompt";
    sc.description = "<string> - Sets the prompt.";
    sc.
    function = shellPrompt;
    this.commandList[this.commandList.length] = sc;
    
    // load program from input box
    sc = new ShellCommand();
    sc.command = "load";
    sc.description = " - Load contents of input box";
    sc.function = shellLoad;
    this.commandList[this.commandList.length] = sc;

    // Crash and burn
    sc = new ShellCommand();
    sc.command = "cab";
    sc.description = " - Crash and burn. (Throw OS Error)";
    sc.function = shellCrashAndBurn;
    this.commandList[this.commandList.length] = sc;
    
    // Change the OS status
    sc = new ShellCommand();
    sc.command = "status";
    sc.description = " - set the OS status";
    sc.function = shellChangeStatus;
    this.commandList[this.commandList.length] = sc;
    
    // whereami
    sc = new ShellCommand();
    sc.command = "whereami";
    sc.description = " - Where are you?";
    sc.function = shellWhereAmI;
    this.commandList[this.commandList.length] = sc;    
    
    // Print date
    sc = new ShellCommand();
    sc.command = "date";
    sc.description = " - Print the date";
    sc.function = shellPrintDate;
    this.commandList[this.commandList.length] = sc;    
    
    // Print date
    sc = new ShellCommand();
    sc.command = "diffuse-bomb";
    sc.description = " - Diffuse the bomb";
    sc.function = shellDiffuseBomb;
    this.commandList[this.commandList.length] = sc; 
    
    // run process
    sc = new ShellCommand();
    sc.command = "run";
    sc.description = " - run process";
    sc.function = shellRun;
    this.commandList[this.commandList.length] = sc; 
    
    // run all processes
    sc = new ShellCommand();
    sc.command = "runall";
    sc.description = " - run all process";
    sc.function = shellRunAll;
    this.commandList[this.commandList.length] = sc; 

    // kill a process
    sc = new ShellCommand();
    sc.command = "kill";
    sc.description = " - kill a process by its pid";
    sc.function = shellKillProcess;
    this.commandList[this.commandList.length] = sc; 

    // set the quantum for round robin scheduling
    sc = new ShellCommand();
    sc.command = "quantum";
    sc.description = " - set the quantum for round robin scheduling";
    sc.function = shellSetQuantum;
    this.commandList[this.commandList.length] = sc; 
    
    // list the running processes
    sc = new ShellCommand();
    sc.command = "ps";
    sc.description = " - list the running processes";
    sc.function = shellListProcesses;
    this.commandList[this.commandList.length] = sc; 

    // create file
    sc = new ShellCommand();
    sc.command = "create";
    sc.description = " - create a file";
    sc.function = shellCreateFile;
    this.commandList[this.commandList.length] = sc; 

    // write to a file
    sc = new ShellCommand();
    sc.command = "write";
    sc.description = " - write to a file";
    sc.function = shellWriteToFile;
    this.commandList[this.commandList.length] = sc; 

    // read a file
    sc = new ShellCommand();
    sc.command = "read";
    sc.description = " - read a file";
    sc.function = shellReadFile;
    this.commandList[this.commandList.length] = sc; 

    // delete a file
    sc = new ShellCommand();
    sc.command = "delete";
    sc.description = " - delete a file";
    sc.function = shellDeleteFile;
    this.commandList[this.commandList.length] = sc; 

    // list all files
    sc = new ShellCommand();
    sc.command = "ls";
    sc.description = " - list all files";
    sc.function = shellListFiles;
    this.commandList[this.commandList.length] = sc; 

    // format the filesystem
    sc = new ShellCommand();
    sc.command = "format";
    sc.description = " - format the filesystem";
    sc.function = shellFormatFileSystem;
    this.commandList[this.commandList.length] = sc; 

    // set the current scheduling type
    sc = new ShellCommand();
    sc.command = "setschedule";
    sc.description = " - set the current scheduling type: [rr, fcfs, priority]";
    sc.function = shellSetSchedule;
    this.commandList[this.commandList.length] = sc; 

    // get the current scheduling type
    sc = new ShellCommand();
    sc.command = "getschedule";
    sc.description = " - get the current scheduling type: [rr, fcfs, priority]";
    sc.function = shellGetSchedule;
    this.commandList[this.commandList.length] = sc; 

    // Display the initial prompt.
    this.putPrompt();
}

function shellPutPrompt() {
    _StdIn.putText(this.promptStr);
}

function shellHandleInput(buffer) {
    krnTrace("Shell Command~" + buffer);
    // 
    // Parse the input...
    //
    var userCommand = new UserCommand();
    userCommand = shellParseInput(buffer);
    // ... and assign the command and args to local variables.
    var cmd = userCommand.command;
    var args = userCommand.args;
    //
    // Determine the command and execute it.
    //
    // JavaScript may not support associative arrays in all browsers so we have to
    // iterate over the command list in attempt to find a match.  TODO: Is there a better way? Probably.
    var index = 0;
    var found = false;
    while (!found && index < this.commandList.length) {
        if (this.commandList[index].command === cmd) {
            found = true;
            var fn = this.commandList[index].
                function;
        }
        else {
            ++index;
        }
    }
    if (found) {
        this.execute(fn, args);
    }
    else {
        // It's not found, so check for curses and apologies before declaring the command invalid.
        if (this.curses.indexOf("[" + rot13(cmd) + "]") >= 0) // Check for curses.
        {
            this.execute(shellCurse);
        }
        else if (this.apologies.indexOf("[" + cmd + "]") >= 0) // Check for apologies.
        {
            this.execute(shellApology);
        }
        else // It's just a bad command.
        {
            this.execute(shellInvalidCommand);
        }
    }
}

function shellParseInput(buffer) {
    var retVal = new UserCommand();

    // 1. Remove leading and trailing spaces.
    buffer = trim(buffer);

    // 2. Lower-case it. 
    //buffer = buffer.toLowerCase();

    // 3. Separate on spaces so we can determine the command and command-line args, if any.
    var tempList = buffer.split(" ");

    // 4. Take the first (zeroth) element and use that as the command.
    var cmd = tempList.shift(); // Yes, you can do that to an array in JavaScript.  See the Queue class.
    // 4.1 Remove any left-over spaces.
    cmd = trim(cmd);
    // 4.2 Record it in the return value.
    retVal.command = cmd;

    // 5. Now create the args array from what's left.
    for (var i in tempList) {
        var arg = trim(tempList[i]);
        if (arg != "") {
            retVal.args[retVal.args.length] = tempList[i];
        }
    }
    return retVal;
}

function shellExecute(fn, args) {
    // We just got a command, so advance the line...
    _StdIn.advanceLine();
    // ... call the command function passing in the args...
    fn(args);
    // Check to see if we need to advance the line again
    if (_StdIn.CurrentXPosition > 0) {
        _StdIn.advanceLine();
    }
    // if a process is being executed, deactivate console until it finishes
    if(fn === shellRun) {
        // deactivate console while process is running
        _StdIn.active = false;
    
        // create a timer to reactivate console when process is finished
        var timerId = null;
        timerId = setInterval(function() {
            if(!_CPU.isExecuting) { 
                _OsShell.putPrompt();
                _StdIn.refresh();
                _StdIn.active = true;
                clearTimeout(timerId);
            }
        }, 50);
    } else {
        _OsShell.putPrompt();
        _StdIn.refresh();

    }
}


//
// The rest of these functions ARE NOT part of the Shell "class" (prototype, more accurately), 
// as they are not denoted in the constructor.  The idea is that you cannot execute them from
// elsewhere as shell.xxx .  In a better world, and a more perfect JavaScript, we'd be
// able to make then private.  (Actually, we can. have a look at Crockford's stuff and Resig's JavaScript Ninja cook.)
//

//
// An "interior" or "private" class (prototype) used only inside Shell() (we hope).
//
function ShellCommand() {
    // Properties
    this.command = "";
    this.description = "";
    this.
    function = "";
}

//
// Another "interior" or "private" class (prototype) used only inside Shell() (we hope).
//
function UserCommand() {
    // Properties
    this.command = "";
    this.args = [];
}

//
// Shell Command Functions.  Again, not part of Shell() class per se', just called from there.
//
function shellInvalidCommand() {
    _StdIn.putText("Invalid Command. ");
    if (_SarcasticMode) {
        _StdIn.putText("Duh. Go back to your Speak & Spell.");
    }
    else {
        _StdIn.putText("Type 'help' for, well... help.");
    }
}

function shellCurse() {
    _StdIn.putText("Oh, so that's how it's going to be, eh? Fine.");
    _StdIn.advanceLine();
    _StdIn.putText("Bitch.");
    _SarcasticMode = true;
}

// print the date
function shellPrintDate() {
    _StdIn.putText(new Date().toString());    
}

// run diffuse bomb sequence
function shellDiffuseBomb() {
    var that = this;
    setTimeout(
        function() {
            _StdIn.putText(">Starting transmission...");
            _StdIn.advanceLine();
        }, 
    1000);
    setTimeout(
        function() {
            _StdIn.putText("R.O.B. 64: A bomb has been planted at the base.");
            _StdIn.advanceLine();
        }, 
    3000);
    setTimeout(
        function() {
            _StdIn.putText("Fox McCloud: Jeez! Can anyone take care of it?");
            _StdIn.advanceLine();
        }, 
    5000);
    setTimeout(
        function() {
            _StdIn.putText("Wolf O'Donnell: Can't let you do that, Star Fox!");
            _StdIn.advanceLine();
        }, 
    7000);
    setTimeout(
        function() {
            _StdIn.putText("Leon Powalski: Andross has ordered us to take you down.");
            _StdIn.advanceLine();
        }, 
    9000);
    setTimeout(
        function() {
            _StdIn.putText("Pigma Dengar: Peppy! Long time no see!");
            _StdIn.advanceLine();
        }, 
    11000);
    setTimeout(
        function() {
            _StdIn.putText("Andrew Oikonny: Andross' enemy is MY enemy.");
            _StdIn.advanceLine();
        }, 
    13000);
    setTimeout(
        function() {
            _StdIn.putText("Fox McCloud: Just what I needed to see. Star Wolf.");
            _StdIn.advanceLine();
            _StdIn.putText("Let's take care of these guys first.");
            _StdIn.advanceLine();
        }, 
    15000);
    setTimeout(
        function() {
            _StdIn.putText("Transmission ended.");
            _StdIn.advanceLine();
            _StdIn.putText(">"); 
            _StdIn.refresh();
        }, 
    17000);
}

function shellSetQuantum(params) {
  var schedule = params[0];
  if (schedule === "rr" || schedule === "fcfs" || schedule === "priority") {
    SCHEDULER_QUANTUM = params[0];
  } else {
    _StdIn.putText("Not a valid scheduler.");
    _StdIn.advanceLine();
  }
}

function shellListProcesses(params) {
  for (var key in _Residents) {
    _StdIn.putText(_Residents[key].pid);
    _StdIn.putText(" ");
  }
  _StdIn.advanceLine();
}

function shellCreateFile(params) {
  var filename = params[0];
  createFile(filename);
}

function shellReadFile(params) {
  var filename = params[0];
  if (findDirectory(filename) !== null) {
    var contents = readFromFile(filename);
    _StdIn.putText(contents);
    _StdIn.advanceLine();
  } else {
    _StdIn.putText("File does not exist.");
    _StdIn.advanceLine();
  }
}

function shellWriteToFile(params) {
  var filename = params[0];
  var contents = params.slice(1).join(" ");
  if (findDirectory(filename) !== null) {
    writeToFile(filename, contents);
    _StdIn.putText("file written.");
    _StdIn.advanceLine();
  } else {
    _StdIn.putText("File does not exist.");
    _StdIn.advanceLine();
  }
}

function shellDeleteFile(params) {
  var filename = params[0];
  if (findDirectory(filename) !== null) {
    deleteFile(filename);
    _StdIn.putText("file removed.");
    _StdIn.advanceLine();
  } else {
    _StdIn.putText("File does not exist.");
    _StdIn.advanceLine();
  }
}

function shellListFiles(params) {
  var files = getAllFilenames();
  for (var i = 0; i < files.length; i++) {
    console.log(files[i]);
    _StdIn.putText(files[i] + " ");
    _StdIn.advanceLine();
  }
}

function shellFormatFileSystem(params) {
  formatFileSystem();
  _StdIn.putText("file system reformatted.");
  _StdIn.advanceLine();
}

function shellSetSchedule(params) {
  var schedule = params[0];
  if (schedule === "rr" || schedule === "fcfs" || schedule === "priority") {
    SCHEDULER_TYPE = schedule;
    _StdIn.putText("schedule type set.");
    _StdIn.advanceLine();
  } else {
    _StdIn.putText("Not a valid scheduler.");
    _StdIn.advanceLine();
  }
}

function shellGetSchedule(params) {
  _StdIn.putText(SCHEDULER_TYPE);
  _StdIn.advanceLine();
}

// print whereami messages
function shellWhereAmI() {
    _StdIn.putText("Calculating GPS...");
    _StdIn.advanceLine();
    _StdIn.putText("Analyzing results...");
    _StdIn.advanceLine();
    _StdIn.putText("Initializing coordinate tracker...");
    _StdIn.advanceLine();
    _StdIn.putText("Sending results...");
    _StdIn.advanceLine();
    _StdIn.putText("Location received. Thank you for registering with the NSA");
    _StdIn.advanceLine();
    _StdIn.putText("Civilian Monitoring Program.");
}


function shellApology() {
    if (_SarcasticMode) {
        _StdIn.putText("Okay. I forgive you. This time.");
        _SarcasticMode = false;
    }
    else {
        _StdIn.putText("For what?");
    }
}

function shellVer(args) {
    _StdIn.putText(APP_NAME + " version " + APP_VERSION);
}

function shellHelp(args) {
    _StdIn.putText("Commands:");
    for (var i in _OsShell.commandList) {
        _StdIn.advanceLine();
        _StdIn.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
    }
}

function shellShutdown(args) {
    _StdIn.putText("Shutting down...");
    // Call Kernel shutdown routine.
    krnShutdown();
    // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
}

function shellCls(args) {
    _StdIn.clearScreen();
    _StdIn.resetXY();
}

function shellChangeStatus(args) {
    _OsStatus = args.join(" ");
}

function shellLoad(args) {
    var input = document.getElementById("taProgramInput").value;
    var program = validateInstructions(input);
    if (program.invalidCodes.length > 0) {
        _StdIn.putText("invalid OP codes: " + program.invalidCodes.join(", "));
    } else {
        var pid = krnCreateProcess(program.validCodes);
        if (pid !== -1) {
            _StdOut.putText("Process Loaded (pid " + pid + ")");
        } else {
            _StdOut.putText("Not enough memory to load process");
        }
    }
}

function shellRun(args) {
    krnStartProcess(args[0]);
}

function shellRunAll(args) {
    krnStartAllProcesses(args[0]);
}

function shellCrashAndBurn() {
    _KernelInterruptQueue.enqueue(new Interrupt(OS_ERROR, ""));
}

function shellKillProcess(args) {
    krnKillProcess(parseInt(args[0]));
}

function validateInstructions(program) {
    var invalidCodes = [];
    var validCodes = [];
    var instructions = program.split(" ");
    instructions.forEach(function(instruction) {
        // make sure instruction is hex and only has 2 characters
        if (!instruction.match("[a-fA-F0-9]{2}") || instruction.length != 2) {
            invalidCodes.push(instruction);
        } else {
            validCodes.push(instruction);
        }
    }); 
    return {
        validCodes : validCodes,
        invalidCodes : invalidCodes
    };
}

function shellMan(args) {
    if (args.length > 0) {
        var topic = args[0];
        switch (topic) {
        case "help":
            _StdIn.putText("Help displays a list of (hopefully) valid commands.");
            break;
        default:
            _StdIn.putText("No manual entry for " + args[0] + ".");
        }
    }
    else {
        _StdIn.putText("Usage: man <topic>  Please supply a topic.");
    }
}

function shellTrace(args) {
    if (args.length > 0) {
        var setting = args[0];
        switch (setting) {
        case "on":
            if (_Trace && _SarcasticMode) {
                _StdIn.putText("Trace is already on, dumbass.");
            }
            else {
                _Trace = true;
                _StdIn.putText("Trace ON");
            }

            break;
        case "off":
            _Trace = false;
            _StdIn.putText("Trace OFF");
            break;
        default:
            _StdIn.putText("Invalid arguement.  Usage: trace <on | off>.");
        }
    }
    else {
        _StdIn.putText("Usage: trace <on | off>");
    }
}

function shellRot13(args) {
    if (args.length > 0) {
        _StdIn.putText(args[0] + " = '" + rot13(args[0]) + "'"); // Requires Utils.js for rot13() function.
    }
    else {
        _StdIn.putText("Usage: rot13 <string>  Please supply a string.");
    }
}

function shellPrompt(args) {
    if (args.length > 0) {
        _OsShell.promptStr = args[0];
    }
    else {
        _StdIn.putText("Usage: prompt <string>  Please supply a string.");
    }
}
