import "../../services" as Services
import Quickshell
import QtQuick
import QtQuick.Layouts

Item {
  implicitWidth: layout.implicitWidth
  implicitHeight: layout.implicitHeight

  ColumnLayout {
    id: layout

    Text {
      id: text

      property real scrollY: textClip.height + text.width

      text: Services.Mpd.title + " - " +
            Services.Mpd.artist + " " +
            Services.Mpd.elapsed + " / " +
            Services.Mpd.duration
      color: Services.ColorService.accent
      font {
          family: "Jetbrains Mono Nerd"
          letterSpacing: -1
          pixelSize: 15
          weight: 600
      }
    }

    Item { height: 20 }

    Rectangle {
      id: prog
      anchors.centerIn: parent
      height: 20
      width: ((parseFloat(Services.Mpd.duration.replace(":", ".")) -
                parseFloat(Services.Mpd.elapsed.replace(":", "."))) /
                parseFloat(Services.Mpd.duration.replace(":", "."))) * 300

      radius: 6
      color: Services.ColorService.accent
    }
    
    RowLayout {
      Repeater {
        model: Services.Mpd.lockOptions
        delegate: ColumnLayout {
          Rectangle {
            radius: 12
            width: 90
            height: 40
            color: modelData.state() ? Services.ColorService.accent : Services.ColorService.background 
            border {
              color: modelData.state() ? Services.ColorService.background : Services.ColorService.accent
              width: 4
            }

            Rectangle {
              x: 20 - (width / 2)
              y: 20 - (height / 2)
              radius: 12
              height: 30
              width: 30
              color: modelData.state() ? Services.ColorService.background : Services.ColorService.accent
            }
          }
        }
      }
    }
  }
}
