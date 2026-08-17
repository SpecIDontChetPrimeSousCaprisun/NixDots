import "../services" as Services
import Quickshell
import Quickshell.Services.Notifications
import QtQuick
import QtQuick.Layouts
import "Taskbar"

PanelWindow {
  visible: Services.NotificationService.centerVisible
  color: "transparent"
  anchors {
    top: true
    bottom: true
    right: true
  }

  width: 380

  Widget {
    anchors.right: parent.right
    height: parent.height
    width: Services.NotificationService.centerVisible ? parent.width : 10

    Behavior on width {
      NumberAnimation { duration: 300; easing.type: Easing.OutCubic }
    }

    ColumnLayout {
      anchors.fill: parent
      spacing: 10
      anchors.topMargin: 6
      anchors.bottomMargin: 6
      anchors.leftMargin: 6
      anchors.rightMargin: 6

      Repeater {
        model: Services.NotificationService.history

        Widget {
          Layout.fillWidth: true
          implicitHeight: nLayout.implicitHeight + 12
          border.color: modelData.urgency === NotificationUrgency.Critical ? Services.ColorService.ram : Services.ColorService.accent

          ColumnLayout {
            id: nLayout
            anchors.fill: parent
            anchors.topMargin: 6
            anchors.bottomMargin: 6
            anchors.leftMargin: 6
            anchors.rightMargin: 6
            
            Text {
              Layout.fillWidth: true
              id: sum
              text: modelData.summary
              color: modelData.urgency === NotificationUrgency.Critical ? Services.ColorService.gpu : Services.ColorService.highlight
              font {
                family: "Jetbrains Mono Nerd"
                letterSpacing: -1
                pixelSize: 20
                weight: 600
              }
            }

            Text {
              Layout.fillWidth: true
              id: timeTxt
              text: "sent by : " + modelData.appName + " at : " + modelData.time
              color: Services.ColorService.bgHighlight
              wrapMode: Text.WordWrap
              font {
                family: "Jetbrains Mono Nerd"
                letterSpacing: -1
                pixelSize: 10
                weight: 600
              }
            }

            Text {
              Layout.fillWidth: true
              id: desc
              visible: text !== ""
              text: modelData.body
              color: Services.ColorService.accent
              wrapMode: Text.WordWrap
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
    }
  }
}
