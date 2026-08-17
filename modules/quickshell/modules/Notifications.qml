import "../services" as Services
import Quickshell
import Quickshell.Wayland
import Quickshell.Services.Notifications
import QtQuick
import QtQuick.Layouts
import "Taskbar"

Scope {
  id: ncRoot

  NotificationServer {
    id: server
    actionsSupported: true
    bodySupported: true
    imageSupported: true
    onNotification: n => { 
      Services.NotificationService.history = [...Services.NotificationService.history, {
        summary: n.summary,
        body: n.body,
        appName: n.appName,
        urgency: n.urgency,
        time: Qt.formatDateTime(new Date(), "HH:mm.ss")
      }]
      n.tracked = true 
    }
  }

  PanelWindow {
    visible: !Services.NotificationService.centerVisible
    anchors {
      top: true
      right: true
    }

    margins {
      top: 12
      right: 12
    }

    implicitWidth: 380
    implicitHeight: Math.max(1, column.implicitHeight)
    color: "transparent"
    exclusionMode: ExclusionMode.Ignore

    ColumnLayout {
      id: column
      width: parent.width
      spacing: 10

      Repeater {
        model: server.trackedNotifications

        Widget {
          property var startTime: Date.now()

          width: column.width
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

            Image {
              Layout.preferredHeight: 36
              Layout.preferredWidth: 36
              fillMode: Image.PreserveAspectFit
              visible: source.toString() !== ""
              source: modelData.image || modelData.appIcon || ""
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

            Rectangle {
              id: timerRect
              visible: modelData.urgency !== NotificationUrgency.Critical
              height: 10
              radius: 6
              color: Services.ColorService.accent
              width: parent.width
            }

            Timer {
              running: true
              interval: 1
              onTriggered: {
                timerRect.width = parent.width * (1 - ((Date.now() - startTime) / 5000))
                running = true
              }
            }
          }

          MouseArea {
            anchors.fill: parent
            onClicked: { 
              //modelData.actions[0].invoke()
              modelData.dismiss()
            }
          }

          Timer {
            running: modelData.urgency !== NotificationUrgency.Critical
            interval: 5000
            onTriggered: modelData.dismiss()
          }
        }
      }
    }
  }
}
