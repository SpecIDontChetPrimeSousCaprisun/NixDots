pragma Singleton
import "." as Services
import Quickshell.Io
import QtQuick

Item {
  property bool dashboardVisible: false
  property bool initialising: true
  property string gitUser: "SpecIDontChetPrimeSousCaprisun"
  property string todayDate: ""
  property int todayCount: 0
  property real maxValue: 4
  property var days: []
  property var weeks: {}
  
  Component.onCompleted: {
    refresh()
  }

  function refresh() {
    Services.Git.initialising = true
    fetchProcess.running = true
  }

  Process {
    id: fetchProcess
    command: ["curl", "-s", "https://github.com/users/" + gitUser + "/contributions"]

    stdout: StdioCollector {
      onStreamFinished: {
        let svg = this.text
        let regex = /data-date="([\d-]+)"[^>]*data-level="(\d)"/g
        let countRegex = /data-date="([\d-]+)"[^>]*>([^<]*)<\/td>/g
        let results = []
        let match

        // Extract date + level pairs
        while ((match = regex.exec(svg)) !== null) {
            results.push({ date: match[1], level: parseInt(match[2]) })
        }
        days = results

        // Find today's entry specifically
        let today = new Date().toISOString().split('T')[0]
        let todayEntry = results.find(d => d.date === today)
        todayDate = today
        todayCount = todayEntry ? todayEntry.level : 0
      }
    }

    onExited: {
      let result = []
      let current = []
      for (let i = 0; i < Services.Git.days.length; i++) {
        current.push(Services.Git.days[i])
        if (current.length === 7) {
          result.push(current)
          current = []
        }
      }
      if (current.length > 0) result.push(current)
      
      weeks = result
    }
  }

  Timer {
    interval: 60 * 60 * 1000  // refresh hourly
    running: true
    repeat: true
    triggeredOnStart: true
    onTriggered: refresh()
  }
}
