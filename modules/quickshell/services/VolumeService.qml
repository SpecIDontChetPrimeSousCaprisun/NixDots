pragma Singleton
import Quickshell.Io
import QtQuick

Item {
  property bool speakerMuted: false
  property bool micMuted: false
  property real speakerVolume: 0
  property real micVolume: 0

  function refresh() {
    getSpeaker.running = true
    getMic.running = true
  }

  function setSpeakerVolume(value) {
    setSpeaker.command = ["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", value.toString()]
    setSpeaker.running = true
  }

  function setMicVolume(value) {
    setMic.command = ["wpctl", "set-volume", "@DEFAULT_AUDIO_SOURCE@", value.toString()]
    setMic.running = true
  }

  function toggleSpeakerMute() {
    toggleSpeakerMuteProc.running = true
  }

  function toggleMicMute() {
    toggleMicMuteProc.running = true
  }

  Process {
    id: getSpeaker
    command: ["wpctl", "get-volume", "@DEFAULT_AUDIO_SINK@"]
    stdout: SplitParser {
      onRead: data => {
        let match = data.match(/Volume:\s*([\d.]+)/)
        if (match) speakerVolume = parseFloat(match[1])
        speakerMuted = data.includes("[MUTED]")
      }
    }
  }

  Process {
    id: getMic
    command: ["wpctl", "get-volume", "@DEFAULT_AUDIO_SOURCE@"]
    stdout: SplitParser {
      onRead: data => {
        let match = data.match(/Volume:\s*([\d.]+)/)
        if (match) micVolume = parseFloat(match[1])
        micMuted = data.includes("[MUTED]")
      }
    }
  }

  Process {
    id: subscribeProcess
    command: ["pactl", "subscribe"]
    running: true
    stdout: SplitParser {
      onRead: data => {
        if (data.includes("sink") || data.includes("source")) {
          refresh()
        }
      }
    }
  }

  Process {
    id: setSpeaker
    onRunningChanged: if (!running) getSpeaker.running = true
  }

  Process {
    id: setMic
    onRunningChanged: if (!running) getMic.running = true
  }

  Process {
    id: toggleSpeakerMuteProc
    command: ["wpctl", "set-mute", "@DEFAULT_AUDIO_SINK@", "toggle"]
    onRunningChanged: if (!running) getSpeaker.running = true
  }

  Process {
    id: toggleMicMuteProc
    command: ["wpctl", "set-mute", "@DEFAULT_AUDIO_SOURCE@", "toggle"]
    onRunningChanged: if (!running) getMic.running = true
  }

  Component.onCompleted: refresh()
}
