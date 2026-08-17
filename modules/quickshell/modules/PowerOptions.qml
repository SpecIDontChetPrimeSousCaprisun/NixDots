import "../services" as Services
import "Taskbar"
import Quickshell
import Quickshell.Io
import QtQuick
import QtQuick.Layouts

PanelWindow {
  visible: Services.PowerService.optionsVisible
  color: "transparent"
  anchors {
    top: true
    left: true
    right: true
    bottom: true
  } 

  ColumnLayout {
    id: powerLayout
    x: Services.PowerService.optionsX 

    Behavior on x {
      NumberAnimation { duration: 200; easing.type: Easing.OutCubic }
    }

    Repeater {
      model: Services.PowerService.powerOptions

      Widget {
        id: powerWidget
        height: powerIcon.implicitHeight
        width: powerLayout.x === Services.PowerService.optionsXTarget ? powerIcon.implicitWidth + 12 : 10

        Behavior on width {
          NumberAnimation { duration: Services.PowerService.shouldChangeOpacity ? 200 * (index + 1) : 200; easing.type: Easing.OutCubic }
        }

        Text {
          id: powerIcon
          opacity: powerWidget.width === implicitWidth + 12 || !Services.PowerService.shouldChangeOpacity ? Services.PowerService.textOpacity : 0
          text: Services.PowerService.hoveredIndex === index ? modelData.icon + " " + modelData.name : modelData.icon
          color: Services.ColorService.accent
          anchors.centerIn: parent
          font {
            family: "Jetbrains Mono Nerd"
            letterSpacing: -1
            pixelSize: 30
            weight: 600
          }

          Behavior on opacity {
            NumberAnimation { duration: 200; easing.type: Easing.OutCubic }
          }
        }

        MouseArea {
          parent: powerIcon
          anchors.fill: parent
          hoverEnabled: true
          onEntered: {
            Services.PowerService.shouldChangeOpacity = false
            Services.PowerService.hoveredIndex = index
          }

          onClicked: { 
            powerProc.running = true
            Services.PowerService.optionsX = -100
            Services.PowerService.textOpacity = 0
            Services.PowerService.optionsVisible = false
          }
        }

        Process {
          id: powerProc
          command: modelData.command
        }
      }
    }
  }
}
