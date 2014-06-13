var stream = require('stream')
  , util = require('util')

function Stream (xhr, options) {
  options = options || {}

  stream.Stream.call(this)
  this.xhr = xhr
  this.offset = 0
  this.paused = false
  this.chunkSize = options.chunkSize || 1024
  this.readable = true
  this.writeable = true
  this._state = 'flowing'
  xhr.onreadystatechange = this.handle.bind(this)
  xhr.send(null)
}

util.inherits(Stream, stream.Stream)

Stream.prototype.handle = function () {
  if (this.xhr.readyState === 3) {
    this.write()
  }
  if (this.xhr.readyState === 4 && !this.paused) {
    this.emit('end')
  }
}

Stream.prototype.write = function () {
  if (this._state === 'paused') {
    return
  }

  // Noop Automatically writes to responseText, go ahead and flush
  flush(this)
}

function flush (stream) {
  if (!stream.xhr.responseText) {
    return
  }
  while (stream.xhr.responseText.length - stream.offset > stream.chunkSize && stream._state === 'flowing') {
    var chunk = stream.xhr.responseText.substr(stream.offset, stream.chunkSize)
    stream.emit('data', chunk)
    stream.offset += chunk.length
  }

  if (stream.offset === stream.xhr.responseText.length) {
    stream.emit('end')
  }
}

Stream.prototype.pause = function() {
  if (this._state === 'paused') {
    return
  }
  this._state = 'paused'
  this.emit('pause')
}

Stream.prototype.resume = function() {
  if (this._state === 'paused') {
    flush(this)
  }
  this._state = 'flowing'
}

module.exports = Stream
