import "../services" as Services
import Quickshell
import Quickshell.Io
import QtQuick
import QtQuick.Layouts

PanelWindow {
  visible: Services.Mpd.windowVisible
  color: "transparent"
  anchors {
    top: true
    left: true
    right: true
    bottom: true
  }

  Rectangle {
    width: 600
    height: parent.height
    gradient: Gradient {
      orientation: Gradient.Horizontal
      GradientStop { position: 0.0; color: Qt.rgba(0, 0.16, 0.21, 1.0) }
      GradientStop { position: 1.0; color: Qt.rgba(0, 0.16, 0.21, 0.0) }
    }

    ColumnLayout {
      id: visualizer
      anchors.fill: parent
      spacing: 3

      Repeater {
        model: Services.Mpd.bars
        Rectangle {
          width: Math.max(2, (modelData / 100) * visualizer.height)
          height: 10
          color: Services.ColorService.accent
          radius: 6
          anchors.left: parent.left

          Behavior on height {
            NumberAnimation { duration: 50; easing.type: Easing.OutCubic }
          }
        }
      }
    }

    Rectangle {
      id: listBg
      width: parent.width
      height: listLayout.implicitHeight
      anchors.centerIn: parent
      gradient: Gradient {
        orientation: Gradient.Horizontal
        GradientStop { position: 0.0; color: Qt.rgba(0, 0.16, 0.21, 1.0) }
        GradientStop { position: 0.3; color: Qt.rgba(0, 0.16, 0.21, 0.5) }
        GradientStop { position: 1.0; color: Qt.rgba(0, 0.16, 0.21, 0.0) }
      }
    
      ColumnLayout {
        id: listLayout
        height: 23 * Services.Mpd.titles.length
        z: 2

        Repeater {
          model: Services.Mpd.titles

          Rectangle {
            property bool hovered: false

            width: listBg.width
            height: 22
            gradient: Gradient {
              orientation: Gradient.Horizontal
              GradientStop { position: 0.0; color: Qt.rgba(0.67, 0.43, 0.87, hovered ? 1.0 : 0) }
              GradientStop { position: 0.3; color: Qt.rgba(0.67, 0.43, 0.87, hovered ? 0.5 : 0) }
              GradientStop { position: 1.0; color: Qt.rgba(0.67, 0.43, 0.87, 0.0) }
            }

            Text {
              id: text
              anchors.fill: parent
              text: modelData + " - " + Services.Mpd.artists[index]
              color: parent.hovered ? Services.ColorService.highlight : (index === 0 ? Services.ColorService.gpu : Services.ColorService.ram)
              textFormat: Text.RichText

              font {
                family: "Jetbrains Mono Nerd"
                letterSpacing: -1
                pixelSize: index === 0 ? 20 : 15
                weight: index === 0 ? 900 : 600
              }
            }

            MouseArea {
              anchors.fill: parent
              hoverEnabled: true
              onEntered: parent.hovered = true
              onExited: parent.hovered = false
              onClicked: searchPlayProc.running = true
              z: 5
            }

            Process {
              id: searchPlayProc
              command: [ "mpc", "searchplay", modelData ]
            }
          }
        }
      }
    }
  }
}
