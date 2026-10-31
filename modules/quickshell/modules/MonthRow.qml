import "../services" as Services
import Quickshell
import QtQuick
import QtQuick.Layouts

Item {
  id: monthRow
  width: content.width
  height: 60

  function monthName(offset) {
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                      "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
    let idx = ((clock.date.getMonth() + offset) % 12 + 12) % 12
    return months[idx]
  }

  RowLayout {
    id: monthLayout
    anchors.centerIn: parent
    spacing: 20

    Text {
      id: prevMonth
      text: monthRow.monthName(-1)
      color: Services.ColorService.accent
      opacity: 0.35
      font {
        family: "Jetbrains Mono Nerd"
        letterSpacing: -1
        pixelSize: 30
        weight: 600
      }
    }

    Text {
      id: currentMonth
      text: monthRow.monthName(0)
      color: Services.ColorService.accent
      opacity: 1.0
      font {
        family: "Jetbrains Mono Nerd"
        letterSpacing: -1
        pixelSize: 30
        weight: 600
      }
    }

    Text {
      id: nextMonth
      text: monthRow.monthName(1)
      color: Services.ColorService.accent
      opacity: 0.35
      font {
        family: "Jetbrains Mono Nerd"
        letterSpacing: -1
        pixelSize: 30
        weight: 600
      }
    }
  }
}
