import "../services" as Services
import Quickshell
import Quickshell.Io
import Quickshell.Widgets
import Quickshell.Wayland
import QtQuick
import QtQuick.Layouts

PanelWindow {
  property color accent: Services.AppService.useOffload ? Services.ColorService.gpu : Services.ColorService.accent

  id: root
  color: "transparent"
  visible: Services.AppService.launcherVisible
  WlrLayershell.keyboardFocus: WlrKeyboardFocus.OnDemand
  anchors {
    top: true
    left: true
    right: true
    bottom: true
  }

  Rectangle {
    id: widget
    anchors.centerIn: parent
    color: Services.ColorService.background
    width: root.width / 3.25
    height: root.height / 1.5
    radius: 10

    border {
      color: root.accent
      width: 2
    }

    MouseArea {
      z: -1
      anchors.fill: parent
      acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MiddleButton
      onClicked: {}
    }

    ColumnLayout {
      anchors.fill: parent
      anchors.leftMargin: 12
      anchors.rightMargin: 12
      anchors.bottomMargin: 12
      anchors.topMargin: 12 

      Rectangle {
        Layout.fillWidth: true
        color: Services.ColorService.bgHighlight
        height: 30
        TextInput {
          id: searchBox
          anchors.fill: parent
          color: root.accent
          focus: true
          onTextChanged: Services.AppService.filterQuery = text
          Keys.onReturnPressed: {
            appList.currentItem.launch()
          }

          Keys.onEscapePressed: {
            Services.AppService.launcherVisible = false
          }

          Keys.onUpPressed: {
            appList.currentIndex = Math.max(appList.currentIndex - 1, 0)
          }

          Keys.onDownPressed: {
            appList.currentIndex = Math.min(appList.currentIndex + 1, appList.count - 1)
          }
        }
      }

      ListView {
        id: appList
        Layout.fillWidth: true
        Layout.fillHeight: true
        currentIndex: 0
        model: Services.AppService.apps
        clip: true

        delegate: Rectangle {
          property bool hovered: false

          visible: !modelData.noDisplay
          width: appList.width
          height: 40
          color: ListView.isCurrentItem ? Services.ColorService.bgHighlight : (hovered ? "#80ffffff" : "transparent")

          MouseArea {
            anchors.fill: parent
            hoverEnabled: true
            onEntered: parent.hovered = true
            onExited: parent.hovered = false
          }

          function launch() {
            cmdProc.running = true
            Services.AppService.launcherVisible = false
          }

          Process {
            id: cmdProc
            command: {
              let cmd = modelData.command

              if (Services.AppService.useOffload) cmd.unshift("nvidia-offload");
              if (modelData.runInTerminal) {
                cmd.unshift("alacritty", "-e")
              }

              return cmd
            }
          }

          RowLayout {
            anchors.fill: parent

            IconImage {
              source: Quickshell.iconPath(modelData.icon)
              width: 40
              height: 40
            }

            Text {
              text: modelData.name
              color: root.accent
              Layout.fillWidth: true
              height: 40
              font {
                family: "Jetbrains Mono Nerd"
                letterSpacing: -1
                pixelSize: 15
                weight: 600
              }

              MouseArea {
                anchors.fill: parent

                onClicked: {
                  cmdProc.running = true
                  Services.AppService.launcherVisible = false
                }
              }
            }
          }
        }
      }

      Text {
        Layout.fillWidth: true
        color: root.accent
        height: 30
        text: Services.AppService.useOffload ? "offload" : "normal"
        font {
          family: "Jetbrains Mono Nerd"
          letterSpacing: -1
          pixelSize: 15
          weight: 600
        }

        MouseArea {
          anchors.fill: parent
          onClicked: Services.AppService.useOffload = !Services.AppService.useOffload
        }
      }
    }
  }

  MouseArea {
    z: -1
    anchors.fill: parent
    acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MiddleButton
    onClicked: {
      Services.AppService.launcherVisible = false
    }
  }
}
