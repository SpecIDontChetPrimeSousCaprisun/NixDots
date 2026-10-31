import "../../services" as Services
import "../Taskbar"
import Quickshell
import QtQuick
import QtQuick.Layouts

Item {
  implicitWidth: clockLayout.implicitWidth + 12
  implicitHeight: clockLayout.implicitHeight + 12

  ColumnLayout {
    id: clockLayout
    anchors.fill: parent
    anchors.leftMargin: 6
    anchors.rightMargin: 6
    anchors.topMargin: 6
    anchors.bottomMargin: 6

    Text {
      id: clockText 
      text: Qt.formatDateTime(clock.date, "hh:mm t")
      color: Services.ColorService.accent
      Layout.fillWidth: true
      horizontalAlignment: Text.AlignHCenter
      font {
        family: "Jetbrains Mono Nerd"
        letterSpacing: -1
        pixelSize: 35
        weight: 600
      }
    }

    Text {
      id: dateText 
      text: {
        const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
        return Qt.formatDateTime(clock.date, "dd") + "th of " + months[clock.date.getMonth()] + ", " + Qt.formatDateTime(clock.date, "yyyy")
      }
      color: Services.ColorService.accent
      Layout.fillWidth: true
      horizontalAlignment: Text.AlignHCenter
      font {
        family: "Jetbrains Mono Nerd"
        letterSpacing: -1
        pixelSize: 35
        weight: 600
      }
    }
  }
      }

