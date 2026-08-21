import "../../services" as Services
import "../Taskbar"
import Quickshell
import QtQuick
import QtQuick.Layouts

Item {
  implicitWidth: layout.implicitWidth + 12
  implicitHeight: layout.implicitHeight + 12

  ColumnLayout {
    id: layout
    anchors.fill: parent
    anchors.leftMargin: 6
    anchors.rightMargin: 6
    anchors.topMargin: 6
    anchors.bottomMargin: 6

    RowLayout {
      ProgRing {
        id: cpuRing
        value: Services.PerfService.cpuUsage / 100
        progressColor: Services.ColorService.accent
        icon: ""
      }

      ProgRing {
        id: ramRing
        value: Services.PerfService.ramUsage / 100
        progressColor: Services.ColorService.ram
        icon: ""
      }
    }

    RowLayout {
      Item { Layout.fillWidth: true }

      ProgRing {
        id: gpuRing
        value: Services.PerfService.gpuTemp / 100
        progressColor: Services.ColorService.gpu
        icon: Services.PerfService.gpuTemp <= 70 ? "" :
              Services.PerfService.gpuTemp <= 90 ? "" : ""
      }

      Item { Layout.fillWidth: true }
    }
  }
}
