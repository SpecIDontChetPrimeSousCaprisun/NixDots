pragma Singleton
import QtQuick
import Quickshell.Io

Item {
  property string artist: ""
  property string title: ""
  property string album: ""
  property int volume: 0
  property bool windowVisible: false
  property bool playing: false
  property bool titleFinished: false
  property string elapsed: "0:00"
  property string duration: "0:00"
  property var artists: []
  property var titles: []
  property var bars: []
  property var lockOptions: [
    {
      name: "play",
      icon: "",
      state: () => playing,
      callback: () => {
        toggleProc.running = true
      }
    },
    {
      name: "looping",
      incon: "",
      state: () => playing,
      callback: () => {

      }
    },
    {
      name: "random",
      incon: "",
      state: () => playing,
      callback: () => {

      }
    }
  ]
 
  function setVolume(value) {
    setVolumeProcess.command = ["mpc", "volume", value.toString()]
    setVolumeProcess.running = true
  }

  function runListsProc() {
    artists = []
    titles = []
    titleFinished = false
    metadataProcess.running = true
    listsProc.running = true
  }

  function waitForTitle(callback) {
    if (titleFinished) {
      callback()
      return
    }

    const connection = titleFinishedChanged.connect(function handler() {
      if (titleFinished) {
        titleFinishedChanged.disconnect(handler)
        callback()
      }
    })
  }

  function reorderTitles() {
    let before = []
    let result = []
    let usingResult = false

    for (const t of titles) {
      if (usingResult) {
        result.push(t)
      } else if (t === title) {
        result.push(t)
        usingResult = true
      } else {
        before.push(t)
      }
    }

    titles = result.concat(before)
    reorderArtists()
  }

  function reorderArtists() {
    let before = []
    let result = []
    let usingResult = false

    for (const t of artists) {
      if (usingResult) {
        result.push(t)
      } else if (t === artist) {
        result.push(t)
        usingResult = true
      } else {
        before.push(t)
      }
    }

    artists = result.concat(before)
  }

  Component.onCompleted: {
    runListsProc()
  }

  Process {
    id: toggleProc
    command: ["mpc", "toggle"]
  }

  Process {
    id: cavaProcess
    command: ["cava", "-p", "/home/chevre/.config/quickshell/cavaConfig"]
    running: true

    stdout: SplitParser {
      onRead: data => {
        let values = data.split(";").filter(v => v.length > 0).map(v => parseInt(v))
        bars = values
      }
    }
  }

  Process {
    id: mpdIdle
    command: ["mpc", "idleloop", "player", "mixer"]
    running: true

    stdout: SplitParser {
      onRead: data => {
        statusProcess.running = true
        runListsProc()
      }
    }
  }

  Process {
    id: metadataProcess
    command: ["mpc", "status", "-f", "{\"artist\":\"%artist%\",\"title\":\"%title%\",\"album\":\"%album%\"}"]
    running: true

    stdout: SplitParser {
      onRead: data => {
        if (data.trim().length > 0) {
          let parsed = JSON.parse(data)
          artist = parsed.artist
          title = parsed.title
          album = parsed.album
        }
      }
    }

    onExited: {
      titleFinished = true
    }
  }

  Process {
    id: listsProc
    command: ["mpc", "ls", "-f", "{\"artist\":\"%artist%\",\"title\":\"%title%\"}"]

    stdout: SplitParser {
      onRead: data => {
        if (data.trim().length > 0) {
          let parsed = JSON.parse(data)
          artists.push(parsed.artist)
          titles.push(parsed.title)
        }
      }
    }

    onExited: {
      waitForTitle(reorderTitles)
    }
  }

  Process {
    id: statusProcess
    command: ["mpc", "status"]
    running: true

    stdout: SplitParser {
      onRead: data => {
        let stateMatch = data.match(/\[(playing|paused)\]/)
        if (stateMatch) playing = stateMatch[1] === "playing"

        let timeMatch = data.match(/(\d+:\d+)\/(\d+:\d+)/)
        if (timeMatch) {
          elapsed = timeMatch[1]
          duration = timeMatch[2]
        }

        let volMatch = data.match(/volume:\s*(\d+)%/)
        if (volMatch) volume = parseInt(volMatch[1])
      }
    }
  }

  Process {
    id: setVolumeProcess
    onRunningChanged: if (!running) statusProcess.running = true
  }

  // Timer to keep elapsed time updating smoothly while playing,
  // since idleloop only fires on actual state changes, not every second
  Timer {
      interval: 100
      running: playing
      repeat: true
      onTriggered: statusProcess.running = true
  }
}
