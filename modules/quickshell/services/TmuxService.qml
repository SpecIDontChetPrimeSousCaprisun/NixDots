pragma Singleton
import Quickshell
import Quickshell.Io
import QtQuick

Item {
  property var sessions: []

  Component.onCompleted: {
    refresh()
  }

  function refresh() {
    listSessions.running = true
  }

  Process {
    id: listSessions

    command: [
      "tmux",
      "list-sessions",
      "-F",
      "#{session_name}"
    ]

    stdout: StdioCollector {
      onStreamFinished: {
          const output = text.trim()

        if (output.length === 0) {
          sessions = []
          return
        }

        sessions = output.split("\n")
      }
    }
  }

  Process {
    id: attachSession

    function attach(name) {
      command = [
        "alacritty",
        "-e",
        "tmux",
        "attach-session",
        "-t",
        name
      ]

      running = true
    }
  }

  function attach(name) {
    attachSession.attach(name)
  }
}
