pragma Singleton
import QtQuick
import Quickshell.Io

Item {
  property string temp: "--"
  property string condition: ""
  property string humidity: ""
  property string feelsLike: ""
  property string iconUrl: ""

  function weatherIcon(condition) {
    if (condition.includes("Sunny") || condition.includes("Clear")) return "☀"
    if (condition.includes("Cloud")) return "☁"
    if (condition.includes("Rain")) return "🌧"
    if (condition.includes("Snow")) return "❄"
    if (condition.includes("Thunder")) return "⛈"
    return "?"
  }


  function refresh() {
    weatherProcess.running = true
  }

  Process {
    id: weatherProcess
    command: ["curl", "-s", "wttr.in/?format=j1"]

    stdout: StdioCollector {
      onStreamFinished: {
        try {
          let data = JSON.parse(this.text)
          let current = data.current_condition[0]
          temp = current.temp_C
          feelsLike = current.FeelsLikeC
          humidity = current.humidity
          condition = current.weatherDesc[0].value
          iconUrl = current.weatherIconUrl[0].value
        } catch (e) {
          console.log("Weather parse error:", e)
        }
      }
    }
  }

  Timer {
    interval: 30 * 60 * 1000  // refresh every 30 minutes
    running: true
    repeat: true
    triggeredOnStart: true
    onTriggered: refresh()
  }
}
