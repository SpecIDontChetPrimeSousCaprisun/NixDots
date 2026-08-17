import "../../services" as Services
import Quickshell
import QtQuick

Widget {
  width: text.implicitWidth + 12
  height: text.implicitHeight + 12
  anchors.centerIn: parent

  Text {
    id: text
    anchors.centerIn: parent
    text: Qt.formatDateTime(clock.date, "hh:mm")
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
      Services.CalendarService.windowVisible = !Services.CalendarService.windowVisible

      if (Services.CalendarService.windowVisible) {
        Services.CalendarService.windowWidth = 500
        Services.CalendarService.windowHeight = 350
        Services.CalendarService.contentOpacity = 1.0
        Services.CalendarService.contentY = 0
      } else {
        Services.CalendarService.windowWidth = 0
        Services.CalendarService.windowHeight = 10
        Services.CalendarService.contentOpacity = 0.0
        Services.CalendarService.contentY = -350
      }
    }
  }

  SystemClock {
    id: clock
    precision: SystemClock.minutes
  }
}
