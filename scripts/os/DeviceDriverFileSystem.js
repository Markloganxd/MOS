
DeviceDriverFileSystem.prototype = new DeviceDriver; // "Inherit" from prototype DeviceDriver in deviceDriver.js.

function DeviceDriverFileSystem() // Add or override specific attributes and method pointers.
{
    this.driverEntry = krnFileSystemDriverEntry;

  function krnFileSystemDriverEntry() {
      // Initialization routine for this, the kernel-mode file system Device Driver.
      this.status = "loaded";
  }

  this.formatFileSystem = function() {
    for (var track = 0; track < 4; track++) {
      for (var sector = 0; sector < 8; sector++) {
        for (var block = 0; block < 8; block++) {
          if (track + "" + sector + "" + block === "000") {
            localStorage[track + "" + sector + "" + block] = "SPECIAL";
          } else {
            localStorage[track + "" + sector + "" + block] = "0000~";
            var tsb = new TSB(track + "" + sector + "" + block);
            tsb.clear();
          }
        }
      }
    }
  }

  this.createFile = function(filename) {
    var directory = claimFreeDirectory();
    if (directory !== null) {
      var croppedName = filename.slice(0, Math.min(filename.length, 60));
      directory.write(croppedName);
      var data = claimFreeBlock();
      if (data !== null) {
        directory.linkTo(data);
        return true;
      } else {
        return false;
      }
    } else {
        return false;
    }
  }

  this.deleteFile = function(filename) {
    var tsb = this.findDirectory(filename);
    if (tsb !== null) {
      var nextTSB = tsb.getLinkedTSB();
      tsb.clear();
      var currentTSB = nextTSB;

      // delete all links
      do {
        nextTSB = currentTSB.getLinkedTSB();
        currentTSB.clear();
        currentTSB = nextTSB;
      } while (currentTSB !== null);

      return 1;
    } else {
      console.log("couldn't find");
      //TODO throw error
      return -1;
    }
  }

  this.writeToFile = function(filename, contents) {
    var segmentCount = Math.ceil(contents.length / 60);
    var segments = [];
    for (var i = 0; i < segmentCount; i++) {
      segmentEnd = Math.min((i+1)*60, contents.length);
      segments.push(contents.slice(i*60, segmentEnd));
    }
    
    var tsb = this.findDirectory(filename);
    if (tsb !== null) {
      var currentTSB = tsb.getLinkedTSB();
      for (var i = 0; i < segments.length; i++) {
        // write data
        currentTSB.write(segments[i]); 
        // if there is remaining data, make a new block and link it to current one
        if (segments.length - 1 > i) { 
          linkedTSB = claimFreeBlock();
          currentTSB.linkTo(linkedTSB);
          currentTSB = linkedTSB;
        }
      }
      // return success
      return true;
    } else {
      //TODO throw error
      return false;
    }
  }

  this.readFromFile = function(filename) {
    var tsb = this.findDirectory(filename);
    if (tsb !== null) {
      var contents = "";
      var currentTSB = tsb.getLinkedTSB();

      // aggregate contents
      do {
        contents += currentTSB.getContents();
        currentTSB = currentTSB.getLinkedTSB();
      } while (currentTSB !== null);

      // return aggregated contents
      return contents;
    } else {
      console.log("couldn't find");
      //TODO throw error
      return "";
    }
  }

  this.getAllFilenames = function() {
    var names = [];
    var track = 0;
    for (var sector = 0; sector < 8; sector++) {
      for (var block = 0; block < 8; block++) {
        var tsb = new TSB(track + "" + sector + "" + block);
        if (tsb.isClaimed()) {
          names.push(tsb.getContents());
        }
      }
    }
    return names;
  }

  this.findDirectory = function(name) {
    var track = 0;
    for (var sector = 0; sector < 8; sector++) {
      for (var block = 0; block < 8; block++) {
        var tsb = new TSB(track + "" + sector + "" + block);
        if (tsb.isClaimed() && tsb.getContents() === name) {
          return tsb;
        } else if (tsb.isClaimed()){
        } 
      }
    }
    return null;
  }
}

function claimFreeDirectory() {
  var track = 0;
  for (var sector = 0; sector < 8; sector++) {
    for (var block = 0; block < 8; block++) {
      if (track + "" + sector + "" + block !== "000") {
        var tsb = new TSB(track + "" + sector + "" + block);
        if (!tsb.isClaimed()) {
          tsb.claim();
          return tsb;
        }
      } 
    }
  }
  return null;
}

function claimFreeBlock() {
  for (var track = 1; track < 4; track++) {
    for (var sector = 0; sector < 8; sector++) {
      for (var block = 0; block < 8; block++) {
        var tsb = new TSB(track + "" + sector + "" + block);
        if (!tsb.isDirectory() && !tsb.isClaimed()) {
          tsb.claim();
          return tsb;
        }
      }
    }
  }
  return null;
}

function TSB(id) {
    this.id = id;
    this.track = parseInt(this.id[0]);
    this.sector = parseInt(this.id[1]);
    this.block = parseInt(this.id[2]);

    // get meta data and contents
    var data = localStorage[this.id];
    this.linkedBlockId = data[1] + data[2] + data[3];
    if (data.indexOf("~") !== -1) {
      this.contents = data.slice(4, data.indexOf("~"));
    } else {
      this.contents = data.slice(4, 64);
    }
    this.claimedBit = data[0];
    
    this.getLinkedTSB = function() {
      if (this.linkedBlockId !== "000") {
        return new TSB(this.linkedBlockId);
      } else {
        return null;
      }
    }
    this.getContents = function() {
       return this.contents;
    }
    this.write = function(contents) {
      this.contents = contents;
      this.update();
    }
    this.update = function() {
      localStorage[this.id] = this.claimedBit + this.linkedBlockId + this.contents;
      for (var i = localStorage[this.id].length; i < 64; i++) {
        localStorage[this.id] += "~";
      }
    }
    this.claim = function() {
      this.claimedBit = "1";
      this.update();
    }
    this.linkTo = function(tsb) {
      this.linkedBlockId = tsb.id;
      this.update();
    }
    this.clear = function() {
      this.claimedBit = "0";
      this.linkedBlockId = "000";
      this.contents = "";
      this.update();
    }
    this.isClaimed = function() {
      return this.claimedBit === "1";
    }
    this.isDirectory = function() {
      return this.track === 0;
    }
    this.encode = function(){
      var string = this.claimedBit + this.linkedBlockId + this.contents;
      for (var i = string.length; i < 64; i++) {
        string += "~";
      }
      return string;
    }
    this.toString = function(){
      if (this.id !== "000") {
        var string = this.claimedBit + "." + this.linkedBlockId + "." + this.contents;
        for (var i = string.length - 2; i < 64; i++) {
          string += "~";
        }
        return string;
      } else {
        return "MBR";
      }
    }
}
