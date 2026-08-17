import "../services" as Services
import Quickshell
import QtQuick

PanelWindow {
  visible: Services.PerfService.perfsVisible
  color: "transparent"
  anchors {
    top: true
    left: true
    right: true
    bottom: true
  }

  Repeater {
    model: Services.PerfService.perfsPositions

    Rectangle {
      x: modelData.info.x
      y: 0
      width: 10 
      radius: 6
      height: Services.PerfService.perfsVisible ? (modelData.name === "cpu" ? Services.PerfService.cpuUsage :
              modelData.name === "ram" ? Services.PerfService.ramUsage :
              Services.PerfService.gpuTemp) : 0
      color: modelData.name === "cpu" ? Services.ColorService.accent :
             modelData.name === "ram" ? Services.ColorService.ram :
             Services.ColorService.gpu

      Behavior on height {
        NumberAnimation { duration: 200 * (index + 1); easing.type: Easing.OutCubic }
      }
    }
  }
}
