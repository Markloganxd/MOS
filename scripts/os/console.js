/* ------------
   Console.js

   Requires globals.js

   The OS Console - stdIn and stdOut by default.
   Note: This is not the Shell.  The Shell is the "command line interface" (CLI) or interpreter for this console.
   ------------ */
   
function CLIconsole() {
    // Properties
    this.CurrentFont = _DefaultFontFamily;
    this.CurrentFontSize = _DefaultFontSize;
    this.CurrentXPosition = 0;
    this.CurrentYPosition = _DefaultFontSize;
    this.history = new Array();
    this.historyIndex = 0;
    this.active = true;
    this.screenText = "";
    this.buffer = "";

    // Methods
    this.init = function() {
        this.clearScreen();
        this.resetXY();
    };

    this.clearScreen = function() {
        _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        this.screenText = "";
    };

    this.resetXY = function() {
        this.CurrentXPosition = 0;
        this.CurrentYPosition = this.CurrentFontSize;
    };

    this.updateStatus = function() { 
        document.getElementById("status").innerHTML = "Status: " + this.status + "  -- " + new Date();
    };
    
    this.handleInput = function() {
        while (_KernelInputQueue.getSize() > 0) {
            // Get the next character from the kernel input queue.
            var chr = _KernelInputQueue.dequeue();
            if (chr.length > 1) {
                if (chr == "backspace") {
                    this.backspace();
                } else if (chr == "up") {
                    this.showPreviousCommand(1);                
                } else if (chr == "down") {
                    this.showPreviousCommand(-1);                
                }
            } else if (chr == "\n") {
                this.advanceLine();
            } else if (chr == String.fromCharCode(13)) {
                // The enter key marks the end of a console command, so ...
                // ... tell the shell ...
                _OsShell.handleInput(this.buffer);
                this.history[this.history.length] = this.buffer;
                // ... and reset our buffer.
                this.buffer = "";
            }
            // TODO: Write a case for Ctrl-C.
            else {
                // ... and add it to our buffer.
                this.buffer += chr;
                // This is a "normal" character, so ...
                // ... draw it on the screen...
                this.putText(chr);
            }
        }
    };
    
    this.backspace = function(numchars) {
        if(typeof(numchars) === 'undefined') numchars = 1;
        for (var i = 0; i < numchars; i++) {
            if (this.buffer.length > 0) {
                var offset = _DrawingContext.measureText(this.CurrentFont, this.CurrentFontSize, this.screenText[this.screenText.length - 1]);
                this.CurrentXPosition -= offset;
                this.buffer = this.buffer.slice(0, this.buffer.length - 1);
                this.screenText = this.screenText.slice(0, this.screenText.length - 1);
            }
        }
        this.refresh();
    }
        
    this.putText = function(text) {
        // My first inclination here was to write two functions: putChar() and putString().
        // Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
        // between the two.  So rather than be like PHP and write two (or more) functions that
        // do the same thing, thereby encouraging confusion and decreasing readability, I
        // decided to write one function and use the term "text" to connote string or char.
        if (text !== "") {
            // Draw the text at the current X and Y coordinates.
            _DrawingContext.drawText(this.CurrentFont, this.CurrentFontSize, this.CurrentXPosition, this.CurrentYPosition, text);
            // Move the current X position.
            var offset = _DrawingContext.measureText(this.CurrentFont, this.CurrentFontSize, text);
            this.CurrentXPosition = this.CurrentXPosition + offset;
            this.screenText += text;
        }
    };

    this.refresh = function() {
        var currentX = this.CurrentXPosition;
        var lines = this.screenText.match(/[^\r\n]+/g);
        if (this.screenText[this.screenText.length-1] == "\n") {
            lines.push("");
        }
        var maxLines = Math.floor(_Canvas.height / (_DefaultFontSize + _FontHeightMargin));
        if (lines.length > maxLines) {
            var startIndex = lines.length - maxLines;
            startIndex += 1;
            lines.splice(0, startIndex);
        }
        this.clearScreen();
        this.resetXY();
        var that = this;
        lines.forEach(function(line) {
            that.putText(line);
            that.screenText += "\n";
            that.CurrentXPosition = 0;
            that.CurrentYPosition += _DefaultFontSize + _FontHeightMargin;
        });
        //revert last newline
        that.screenText = that.screenText.slice(0, that.screenText.length - 1);
        that.CurrentXPosition = currentX;
        that.CurrentYPosition -= _DefaultFontSize + _FontHeightMargin;
    }
    
    this.changeStatus = function(newStatus) {
        this.status = newStatus;
    }
    
    // cycle through the previous commands
    this.showPreviousCommand = function(direction) {
        console.log(this.history.length);
        if (this.historyIndex + direction - 1 < this.history.length && this.historyIndex + direction > 0) {
            this.historyIndex += direction;
            this.backspace(this.buffer.length);
            this.buffer = this.history[this.history.length - this.historyIndex];
            this.putText(this.history[this.history.length - this.historyIndex]);    
        } else if (this.historyIndex + direction == 0) {
            this.historyIndex += direction;
            this.backspace(this.buffer.length);
        }
    }

    this.advanceLine = function() {
        this.refresh();
        this.screenText += "\n";
        this.CurrentXPosition = 0;
        this.CurrentYPosition += _DefaultFontSize + _FontHeightMargin;
        this.refresh();
    };
}
