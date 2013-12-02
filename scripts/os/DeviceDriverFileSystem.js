
DeviceDriverFileSystem.prototype = new DeviceDriver; // "Inherit" from prototype DeviceDriver in deviceDriver.js.

function DeviceDriverFileSystem() // Add or override specific attributes and method pointers.
{
    // "subclass"-specific attributes.
    // this.buffer = "";    // TODO: Do we need this?
    // Override the base method pointers.
    this.driverEntry = krnFileSystemDriverEntry;
    this.isr = ;//TODO
    // "Constructor" code.
}

function krnFileSystemDriverEntry() {
    // Initialization routine for this, the kernel-mode file system Device Driver.
    this.status = "loaded";
}

function writeToFile(filename, contents) {
  var segmentCount = ceil(contents.length / 64);
  var segments = [];
  for (var i = 0; i < segmentCount; i++) {
    segmentEnd = min((i+1)*64, contents.length);
    segments.append(contents.slice(i*64, segmentEnd));
  }
  
  var tsb = findDirectory(filename);
  if (tsb !== null) {
    var currentTSB = tsb.getLinkedTSB();
    for (var i = 0; i < segments.length; i++) {
      // write data
      currentTSB.write(segments[i]); 
      // if there is remaining data, make a new block and link it to current one
      if (segments.length - 1 > i) { 
        linkedTSB = claimFreeBlock();
        currentTSB.linkTo(linkedTSB.id);
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

function readFromFile(filename) {
  var tsb = findDirectory(filename);
  if (tsb !== null) {
    var contents = "";
    var currentTSB = tsb.getLinkedTSB();

    // aggregate contents
    do {
      contents += currentTSB.getContents();
    } while (!currentTSB.isEOF());

    // return aggregated contents
    return contents;
  } else {
    //TODO throw error
    return "";
  }
}

function findDirectory(name) {
  var track = 0;
  for (var sector = 0; sector < 8; sector++) {
    for (var block = 0; block < 8; block++) {
      var tsb = new TSB(track + "" + sector + "" + block);
      if (tsb.isClaimed() && tsb.getContents() === name) {
        return tsb;
      }
    }
  }
  return null;
}
function claimFreeDirectory() {
  var track = 0;
  for (var sector = 0; sector < 8; sector++) {
    for (var block = 0; block < 8; block++) {
      var tsb = new TSB(track + "" + sector + "" + block);
      if (!tsb.isClaimed()) {
        tsb.claim();
        return tsb;
      }
    }
  }
  return null;
}
function claimFreeBlock() {
  for (var track = 0; track < 4; track++) {
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
    this.track = parseInt(id[0]);
    this.sector = parseInt(id[1]);
    this.block = parseInt(id[2]);

    // get meta data and contents
    var data = localStorage[id];
    this.appendedBlockId = data[1] + data[2] + data[3];
    this.contents = data.slice(4, data.length);
    this.claimedBit = data[0];
    
    this.getAppendedBlock = function() {
      return new TSB(this.appendedBlockId);
    }
    this.getContents = function() {
      //TODO get string contents
       return this.contents;
    }
    this.write = function(contents) {
      this.contents = contents;
      localStorage[this.id] = this.contents;
    }
    this.claim = function() {
      this.claimedBit = "1";
    }
    this.free() = function() {
      this.claimedBit = "0";
    }
    this.isClaimed = function() {
      return this.claimedBit === "1";
    }
    this.isDirectory = function() {
      return this.track === 0;
    }
    this.toString = function(){
      return this.track + "" + this.sector + "" + this.block;
    }
}
