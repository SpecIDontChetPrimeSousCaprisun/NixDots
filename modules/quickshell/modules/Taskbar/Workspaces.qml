import "../../services" as Services
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import QtQuick
import QtQuick.Layouts

PanelWindow {
  id: workspacesWindow
  color: "transparent"
  visible: Services.WorkspaceService.widgetVisible

  anchors {
    top: true
    left: true
    right: true
    bottom: true
  }

  Widget {
    id: workspacesWidget
    width: y === Services.WorkspaceService.yGoal ? workspaces.implicitWidth + 12 : 6
    height: workspaces.implicitHeight + 12
    x: (workspacesWindow.width / 2) - (width / 2)
    y: Services.WorkspaceService.widgetY
    z: -1

    Behavior on y {
      NumberAnimation { duration: 400; easing.type: Easing.OutCubic }
    }

    Behavior on width {
      NumberAnimation { duration: 150; easing.type: Easing.OutCubic }
    }

    Process {
      id: switchWorkspace
      command: ["hyprctl", "dispatch", "workspace", (index + 1).toString()]
    }

    RowLayout {
      id: workspaces
      spacing: 7
      anchors.centerIn: parent

      Repeater {
        model: Services.WorkspaceService.tags[Services.WorkspaceService.currentScreenName]

        Text {
          property bool isActive: modelData["is_active"]
          property bool hovered: false
          text: modelData["index"]
          color: isActive ? Services.ColorService.highlight : Services.ColorService.accent
          opacity: workspacesWidget.width === workspaces.implicitWidth + 12 ? 1.0 : 0.0

          Behavior on opacity {
            NumberAnimation { duration: 200; easing.type: Easing.OutCubic }
          }

          font {
            family: "Jetbrains Mono Nerd"
            pixelSize: 15
            weight: isActive ? 800 : 600
          }

          Rectangle {
            visible: parent.hovered
            anchors.centerIn: parent
            width: parent.width + 7
            height: parent.height + 7
            radius: 6
            color: Services.ColorService.bgHighlight
            z: -1
          }

          MouseArea {
            anchors.fill: parent
            hoverEnabled: true
            onEntered: parent.hovered = true
            onExited: parent.hovered = false
            onClicked: {
              Services.WorkspaceService.switchWorkspace(modelData["index"])
              Services.WorkspaceService.widgetVisible = false
              Services.WorkspaceService.widgetY = -10
            }
          } 
        }
      }
    }
  }

  MouseArea {
    z: -2
    width: parent.width
    height: parent.height - workspacesWidget.height
    y: workspacesWidget.height
    hoverEnabled: true
    onEntered: {
      Services.WorkspaceService.widgetVisible = false
      Services.WorkspaceService.widgetY = -10
    }
  }
}
