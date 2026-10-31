import "../services" as Services
import Quickshell
import QtQuick
import QtQuick.Layouts
import "Taskbar"

PanelWindow {
  visible: Services.Git.dashboardVisible
  color: "transparent"
  anchors {
    top: true
    left: true
    right: true
    bottom: true
  }

  Widget {
    anchors.right: parent.right
    implicitWidth: content.implicitWidth + 12
    implicitHeight: content.implicitHeight + 12 
    
    RowLayout {
      property real maxHeight: 125
      id: content
      anchors.centerIn: parent

      ColumnLayout {
        anchors.topMargin: 12
        Text {
          text: "Today: " + Services.Git.todayDate
          color: Services.ColorService.accent
          font {
            family: "Jetbrains Mono Nerd"
            letterSpacing: -1
            pixelSize: 15
            weight: 600
          }
        }

        Text {
          text: "Activity level: " + Services.Git.todayCount + " / 4"
          color: Services.ColorService.accent
          font {
            family: "Jetbrains Mono Nerd"
            letterSpacing: -1
            pixelSize: 15
            weight: 600
          }
        }

        Repeater {
          model: Services.Git.days.slice(-Services.Git.weeks.length)
          Rectangle {
            property bool hovered: false
            property var dayData: modelData
            id: bar
            anchors.right: parent.right
            width: Services.Git.dashboardVisible ? ((modelData["level"] + 1) / Services.Git.maxValue) * content.maxHeight : 0
            height: 7
            color: Services.ColorService.levelColor(modelData.level)
            radius: 2
            Behavior on width {
              NumberAnimation { duration: 500; easing.type: Easing.OutCubic }
            }

            Text {
              visible: parent.hovered
              anchors.right: bar.left
              text: "Activity level: " + modelData.level + " / 4 on " + modelData.date + " "
              color: Services.ColorService.accent

              font {
                family: "Jetbrains Mono Nerd"
                letterSpacing: -1
                pixelSize: 14
                weight: 600
              }
            }

            MouseArea {
              anchors.fill: parent
              hoverEnabled: true
              onEntered: parent.hovered = true
              onExited: parent.hovered = false
            }
          }
        }
      }

      ColumnLayout {
        id: weeksGrid
        spacing: 3
        anchors.top: parent.top

        Repeater {
          id: repeater
          model: Services.Git.weeks
          property int readyCount: 0

          onItemAdded: {
            readyCount++
            if (readyCount === repeater.count) {
                allItemsReady()
            }
          }

          onModelChanged: readyCount = 0  // reset counter when model changes

          function allItemsReady() {
            Services.Git.initialising = false
          }

          delegate: RowLayout {
            property int weekIndex: index
            property var week: modelData
            id: weekLayout
            spacing: 3
            Repeater {
              model: modelData
              Rectangle {
                width: Services.Git.dashboardVisible  || Services.Git.initialising ? 10 : 0
                height: Services.Git.dashboardVisible || Services.Git.initialising ? 10 : 0
                radius: 2
                color: Services.ColorService.levelColor(modelData.level)
                Behavior on width {
                  NumberAnimation { from: 0; duration: 30 * (weekLayout.weekIndex + index); easing.type: Easing.OutCubic }
                }

                Behavior on height {
                  NumberAnimation { from: 0; duration: 30 * (weekLayout.weekIndex + index); easing.type: Easing.OutCubic }
                }
              }
            }
          }
        }
      }
    }
  }
}
