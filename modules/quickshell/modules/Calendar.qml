import "../services" as Services
import Quickshell
import QtQuick
import QtQuick.Layouts

PanelWindow {
  id: calendarWindow
  visible: Services.CalendarService.windowVisible
  anchors {
    top: true
    left: true
    right: true
    bottom: true
  }

  color: "transparent"

  function monthTriplet(date) {
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                     "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
    let current = date.getMonth()
    let prev = (current + 11) % 12   // wraps December -> January correctly
    let next = (current + 1) % 12    // wraps December -> January correctly
    return months[prev] + "   " + months[current] + "   " + months[next]
  }

  Rectangle {
    id: content
    width: Services.CalendarService.windowWidth
    height: width === 500 ? Services.CalendarService.windowHeight : 10
    anchors.centerIn: parent
    anchors.leftMargin: 14
    anchors.rightMargin: 14
    anchors.topMargin: 14
    anchors.bottomMargin: 14
    radius: 10
    color: Services.ColorService.background

    Behavior on width {
      NumberAnimation { duration: 200; easing.type: Easing.OutCubic }
    }

    Behavior on height {
      NumberAnimation { duration: 200; easing.type: Easing.OutCubic }
    }

    border {
      color: Services.ColorService.accent
      width: 2
    }

    Item {
      opacity: height === 350 ? Services.CalendarService.contentOpacity : 0.0
      y: height === 350 ? Services.CalendarService.contentY : -350
      width: content.width
      height: content.height

      Behavior on opacity {
        NumberAnimation { duration: 200; easing.type: Easing.OutCubic }
      }

      Behavior on y {
        NumberAnimation { duration: 200; easing.type: Easing.OutCubic }
      }

      ColumnLayout {
        MonthRow {}

        Item {
          height: 50
        }

        Text {
          width: content.width
          height: 30
          color: Services.ColorService.accent
          text: Qt.formatDateTime(clock.date, "MM/dd/yyyy hh:mm.ss t")
          horizontalAlignment: Text.AlignHCenter
          font {
            family: "Jetbrains Mono Nerd"
            letterSpacing: -1
            pixelSize: 20
            weight: 600
          }
        }
        
        Item {
          height: 100
          width: content.width

          RowLayout {
            x: 30
            spacing: 60
            
            ColumnLayout {
              Text {
                height: 60
                color: Services.ColorService.accent
                text: Services.Weather.condition
                font {
                  family: "Jetbrains Mono Nerd"
                  letterSpacing: -1
                  pixelSize: 50
                  weight: 600
                }
              }

              Text {
                height: 60
                color: Services.ColorService.accent
                text: "temp : " + Services.Weather.temp + "C"
                font {
                  family: "Jetbrains Mono Nerd"
                  letterSpacing: -1
                  pixelSize: 30
                  weight: 600
                }
              }

              Text {
                height: 60
                color: Services.ColorService.accent
                text: "feel : " + Services.Weather.feelsLike + "C"
                font {
                  family: "Jetbrains Mono Nerd"
                  letterSpacing: -1
                  pixelSize: 27
                  weight: 600
                }
              }
            }

            Text {
              height: 60
              color: Services.ColorService.accent
              text: Services.Weather.weatherIcon(Services.Weather.condition)
              font {
                family: "Jetbrains Mono Nerd"
                letterSpacing: -1
                pixelSize: 150
                weight: 600
              }
            }
          }
        }
      }
    }
  }

  SystemClock {
    id: clock
    precision: SystemClock.seconds
  }
}
