import Quickshell
import Quickshell.Io
import QtQuick
import "../../services"

Widget {
  implicitWidth: text.implicitWidth + 12
  implicitHeight: text.implicitHeight + 12

  Text {
    id: text
    anchors.centerIn: parent
    text: (Mpd.playing ? "<font color='#00ff00'>" : "<font color='#ff0000'>") + "</font> "
          + Mpd.title + " - " + Mpd.artist + " " + Mpd.elapsed + " / " + Mpd.duration + " " + Mpd.volume + "%"
    color: ColorService.accent
    textFormat: Text.RichText

    font {
      family: "Jetbrains Mono Nerd"
      letterSpacing: -1
      pixelSize: 15
      weight: 600
    }
  }

  MouseArea {
    anchors.fill: parent
    acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MiddleButton

    onClicked: mouse => {
      if (mouse.button === Qt.LeftButton) {
        toggleProc.running = true
      } else if (mouse.button == Qt.RightButton) {
        Mpd.windowVisible = !Mpd.windowVisible
      }
    }

    onWheel: wheel => {
      if (wheel.angleDelta.y > 0) {
        Mpd.setVolume(Mpd.volume + 5)
      } else {
        Mpd.setVolume(Mpd.volume - 5)
      }
    }
  }

  Process {
    id: toggleProc
    command: ["mpc", "toggle"]
    running: false
  }
}
