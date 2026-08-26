import "../services" as Services
import Quickshell
import Quickshell.Io
import Quickshell.Widgets
import Quickshell.Wayland
import QtQuick
import QtQuick.Layouts

PanelWindow {
  property color accent: Services.AppService.useOffload ? Services.ColorService.gpu : Services.ColorService.accent
  property string currentDisplay: "drun"

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
            root.currentDisplay === "drun" ? appList.currentItem.launch() : tmuxList.currentItem.launch()
          }

          Keys.onEscapePressed: {
            Services.AppService.launcherVisible = false
          }

          Keys.onUpPressed: {
            root.currentDisplay === "drun" ? appList.currentIndex = Math.max(appList.currentIndex - 1, 0) : tmuxList.currentIndex = Math.max(tmuxList.currentIndex - 1, 0)
          }

          Keys.onDownPressed: {
            root.currentDisplay === "drun" ? appList.currentIndex = Math.min(appList.currentIndex + 1, appList.count - 1) : tmuxList.currentIndex = Math.min(tmuxList.currentIndex + 1, tmuxList.count - 1)
          }
        }
      }

      ListView {
        id: tmuxList
        Layout.fillWidth: true
        Layout.fillHeight: true
        currentIndex: 0
        model: Services.TmuxService.sessions
        visible: root.currentDisplay === "tmux"
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
            let cmd = ["alacritty", "-e", "tmux", "attach", "-t", modelData]

            Quickshell.execDetached(cmd)
            Services.AppService.launcherVisible = false
          }

          RowLayout {
            anchors.fill: parent

            Text {
              text: modelData
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
                  launch()
                }
              }
            }
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
        visible: root.currentDisplay === "drun"
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
            let cmd = modelData.command

            if (Services.AppService.useOffload) cmd = ["nvidia-offload", ...cmd]
            if (modelData.runInTerminal) cmd = ["alacritty", "-e", ...cmd]

            Quickshell.execDetached(cmd)
            Services.AppService.launcherVisible = false
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
                  launch()
                }
              }
            }
          }
        }
      }

      Item {
        height: 20
        Layout.fillWidth: true

        Rectangle {
          id: selection

          z: 0
          radius: 6
          color: root.accent

          x: Services.AppService.useOffload
              ? normalItem.width + modes.spacing
              : 0

          width: Services.AppService.useOffload
              ? offloadItem.width
              : normalItem.width

          height: normalItem.height

          Behavior on x {
            NumberAnimation {
              duration: 150
              easing.type: Easing.OutCubic
            }
          }

          Behavior on width {
            NumberAnimation {
              duration: 150
              easing.type: Easing.OutCubic
            }
          }
        }

        RowLayout {
          id: modes
          anchors.left: parent.left
          spacing: 6

          Item {
            id: normalItem
            z: 1

            width: normalText.implicitWidth + 10
            height: normalText.implicitHeight + 6

            Text {
              id: normalText
              anchors.centerIn: parent
              text: "normal"

              color: Services.AppService.useOffload
                  ? Services.ColorService.accent
                  : Services.ColorService.background

              font {
                family: "Jetbrains Mono Nerd"
                letterSpacing: -1
                pixelSize: 15
                weight: 600
              }
            }

            MouseArea {
              anchors.fill: parent
              onClicked: Services.AppService.useOffload = false
            }
          }

          Item {
            id: offloadItem
            z: 1

            width: offloadText.implicitWidth + 10
            height: offloadText.implicitHeight + 6

            Text {
              id: offloadText
              anchors.centerIn: parent
              text: "offload"

              color: Services.AppService.useOffload
                  ? Services.ColorService.background
                  : Services.ColorService.gpu

              font {
                family: "Jetbrains Mono Nerd"
                letterSpacing: -1
                pixelSize: 15
                weight: 600
              }
            }

            MouseArea {
              anchors.fill: parent
              onClicked: Services.AppService.useOffload = true
            }
          }
        }

        Item {
          anchors.right: parent.right
          implicitWidth: displayLayout.implicitWidth

          Rectangle {
            id: displaySelection

            z: 0
            radius: 6
            color: root.accent

            x: root.currentDisplay === "tmux"
                ? displayLayout.x + drunItem.width + modes.spacing
                : displayLayout.x

            width: root.currentDisplay === "tmux"
                ? tmuxItem.width
                : drunItem.width

            height: normalItem.height

            Behavior on x {
              NumberAnimation {
                duration: 150
                easing.type: Easing.OutCubic
              }
            }

            Behavior on width {
              NumberAnimation {
                duration: 150
                easing.type: Easing.OutCubic
              }
            }
          }

          RowLayout {
            id: displayLayout
            anchors.fill: parent

            Item {
              id: drunItem
              z: 1

              width: drunText.implicitWidth + 10
              height: drunText.implicitHeight + 6

              Text {
                id: drunText
                anchors.centerIn: parent
                text: "drun"

                color: root.currentDisplay === "tmux"
                    ? Services.ColorService.accent
                    : Services.ColorService.background

                font {
                  family: "Jetbrains Mono Nerd"
                  letterSpacing: -1
                  pixelSize: 15
                  weight: 600
                }
              }

              MouseArea {
                anchors.fill: parent
                onClicked: root.currentDisplay = "drun"
              }
            }

            Item {
              id: tmuxItem
              z: 1

              width: tmuxText.implicitWidth + 10
              height: tmuxText.implicitHeight + 6

              Text {
                id: tmuxText
                anchors.centerIn: parent
                text: "tmux sessions"

                color: root.currentDisplay === "tmux"
                    ? Services.ColorService.background
                    : Services.ColorService.accent

                font {
                  family: "Jetbrains Mono Nerd"
                  letterSpacing: -1
                  pixelSize: 15
                  weight: 600
                }
              }

              MouseArea {
                anchors.fill: parent
                onClicked: root.currentDisplay = "tmux"
              }
            }
          }
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
