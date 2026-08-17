import "../../services" as Services
import Quickshell
import QtQuick
import QtQuick.Layouts

Widget {
  implicitWidth: powerLayout.implicitWidth + 12
  implicitHeight: powerLayout.implicitHeight + 12

  Component.onCompleted: {
    Services.PerfService.perfsPositions.push({
      info: Services.PerfService.getGlobalRect(cpuText),
      name: "cpu"
    })

    Services.PerfService.perfsPositions.push({
      info: Services.PerfService.getGlobalRect(ramText),
      name: "ram"
    })

    Services.PerfService.perfsPositions = [
      ...Services.PerfService.perfsPositions,
      {
        info: Services.PerfService.getGlobalRect(gpuTempText),
        name: "gpu"
      }
    ]
  }

  RowLayout {
    id: powerLayout
    anchors.fill: parent
    anchors.leftMargin: 6
    anchors.rightMargin: 6

    Text {
      id: powerText
      text: ""
      color: Services.ColorService.accent
      font {
        family: "Jetbrains Mono Nerd"
        letterSpacing: -1
        pixelSize: 15
        weight: 600
      }
    }

    Item {
      implicitWidth: perfsLayout.implicitWidth + 6
      implicitHeight: perfsLayout.implicitHeight

      MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        onEntered: Services.PerfService.perfsVisible = true
        onExited: Services.PerfService.perfsVisible = false
      }

      RowLayout {
        id: perfsLayout
        anchors.fill: parent
        anchors.leftMargin: 6
        anchors.rightMargin: 6

        Text {
          id: cpuText
          text: " " + Services.PerfService.cpuUsage + "%"
          color: Services.ColorService.accent
          font {
            family: "Jetbrains Mono Nerd"
            letterSpacing: -1
            pixelSize: 15
            weight: 600
          }
        }

        Text {
          id: ramText
          text: " " + Services.PerfService.ramUsage + "%"
          color: Services.ColorService.ram
          font {
            family: "Jetbrains Mono Nerd"
            letterSpacing: -1
            pixelSize: 15
            weight: 600
          }
        }

        Text {
          id: gpuTempText
          text: (Services.PerfService.gpuTemp <= 70 ? " " : 
                Services.PerfService.gpuTemp <= 90 ? " " : " ")
                + Services.PerfService.gpuTemp + "C"
          color: Services.ColorService.gpu
          font {
            family: "Jetbrains Mono Nerd"
            letterSpacing: -1
            pixelSize: 15
            weight: 600
          }
        }
      }
    }
  }

  MouseArea {
    parent: powerText
    anchors.fill: parent
    onClicked: { 
      Services.PowerService.optionsVisible = !Services.PowerService.optionsVisible

      if (Services.PowerService.optionsVisible) {
        Services.PowerService.optionsX = Services.PowerService.optionsXTarget
        Services.PowerService.shouldChangeOpacity = true;
        Services.PowerService.textOpacity = 1
        Services.WorkspaceService.widgetVisible = false
        Services.WorkspaceService.widgetY = -10
      } else {
        Services.PowerService.optionsX = -100
        Services.PowerService.textOpacity = 0
      }
    }
  }
}
