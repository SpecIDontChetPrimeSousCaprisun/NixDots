import "../../services" as Services
import Quickshell
import QtQuick
import QtQuick.Layouts

Variants {
  model: Quickshell.screens

  PanelWindow {
    required property var modelData
    screen: modelData
    id: taskbar

    anchors {
      top: true
      left: true
      right: true
    }

    implicitHeight: 38

    color: "transparent" 

    RowLayout {
      anchors.leftMargin: 16
      anchors.rightMargin: 16
      anchors.fill: parent

      Power {}
      Music {}
      Item { Layout.fillWidth: true }
      Tray {}
      GitButton {}
    }
    
    Clock {}

    MouseArea {
      z: -1
      anchors.fill: parent
      hoverEnabled: true
      acceptedButtons: Qt.NoButton
      onEntered: {
        Services.WorkspaceService.widgetVisible = true
        Services.WorkspaceService.widgetY = Services.WorkspaceService.yGoal
      }
    }
  }
}

