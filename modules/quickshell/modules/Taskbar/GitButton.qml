import "../../services" as Services
import Quickshell
import QtQuick
import QtQuick.Layouts

Widget {
  property bool hovered: false
  implicitWidth: layout.implicitWidth + 12
  implicitHeight: layout.implicitHeight + 12

  MouseArea {
    anchors.fill: parent
    hoverEnabled: true
    onEntered: parent.hovered = true
    onExited: parent.hovered = false
  }

  RowLayout {
    id: layout
    anchors.fill: parent
    anchors.rightMargin: 6
    anchors.leftMargin: 6
    Text {
      id: text
      text: ""
      color: Services.ColorService.accent
      font {
        family: "Jetbrains Mono Nerd"
        letterSpacing: -1
        pixelSize: 15
        weight: 600
      }
    }

    MouseArea {
      parent: text
      anchors.fill: parent
      onClicked: {
        Services.Git.dashboardVisible = !Services.Git.dashboardVisible
      }
    }

    Text {
      id: nText
      text: "󰂚"
      color: Services.ColorService.accent
      font {
        family: "Jetbrains Mono Nerd"
        letterSpacing: -1
        pixelSize: 15
        weight: 600
      }
    }

    MouseArea {
      parent: nText
      anchors.fill: parent
      onClicked: {
        Services.NotificationService.centerVisible = !Services.NotificationService.centerVisible
      }
    }

    Text {
      id: volumeText
      text: "󰋋 " + Math.round(Services.VolumeService.speakerVolume * 100) + "%" // muted : 󰟎
      color: Services.ColorService.accent
      font {
        family: "Jetbrains Mono Nerd"
        letterSpacing: -1
        pixelSize: 15
        weight: 600
      }
    }

    MouseArea {
      parent: volumeText
      anchors.fill: parent
      onWheel: wheel => {
        if (wheel.angleDelta.y > 0) {
          Services.VolumeService.setSpeakerVolume(Services.VolumeService.speakerVolume + 0.05)
        } else {
          Services.VolumeService.setSpeakerVolume(Services.VolumeService.speakerVolume - 0.05)
        }
      }
    }

    Text {
      id: micText
      text: "󰍬 " + Math.round(Services.VolumeService.micVolume * 100) + "%" // muted : 󰍭
      color: Services.ColorService.accent
      font {
        family: "Jetbrains Mono Nerd"
        letterSpacing: -1
        pixelSize: 15
        weight: 600
      }
    }

    MouseArea {
      parent: micText
      anchors.fill: parent
      onWheel: wheel => {
        if (wheel.angleDelta.y > 0) {
          Services.VolumeService.setMicVolume(Services.VolumeService.micVolume + 0.05)
        } else {
          Services.VolumeService.setMicVolume(Services.VolumeService.micVolume - 0.05)
        }
      }
    }
  }
}
