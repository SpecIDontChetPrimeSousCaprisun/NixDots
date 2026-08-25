pragma Singleton

import QtQuick
import Quickshell
import Quickshell.Io

Item {
  property string currentScreenName: ""
  property var tags: ({})
  property real widgetY: -10
  property real yGoal: 0
  property int activeTag: 1
  property bool widgetVisible: false

  Process {
    id: tagsProcess

    command: ["mmsg", "watch", "all-tags"]
    running: true

    stdout: SplitParser {
      onRead: data => {
        if (data.trim().length === 0)
          return
        try {
          const parsed = JSON.parse(data)
          let newTags = {}

          for (const screenData of parsed["all_tags"]) {
            newTags[screenData["monitor"]] = screenData["tags"]
          }

          tags = newTags
          console.log("Mango tags:", JSON.stringify(tags))
        } catch (e) {
          console.log("Failed to parse Mango IPC:", data, " ", e)
        }
      }
    }
  }

  function switchWorkspace(index) {
    // Mango calls these "tags".
    // The exact dispatcher depends on your Mango version/config.
    switchProcess.command = [
      "mmsg",
      "dispatch",
      "view,",
      index.toString(),
      ",0"
    ]

    switchProcess.running = true
  }

  Process {
    id: switchProcess
  }
}
