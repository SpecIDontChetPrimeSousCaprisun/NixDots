import "../services" as Services
import "Taskbar"
import Quickshell
import QtQuick
import QtQuick.Layouts

PanelWindow {
  visible: Services.CheatsheetService.windowVisible
  color: "transparent"
  anchors {
    top: true
    bottom: true
    right: true
  }

  width: 380
  
  Widget {
    anchors.fill: parent

    ListView {
      anchors.fill: parent
      model: Object.keys(Services.CheatsheetService.keybinds)
      clip: true
      anchors.leftMargin: 6
      anchors.rightMargin: 6
      anchors.topMargin: 6
      anchors.bottomMargin: 6


      delegate: Item {
        property bool opened: false

        id: item
        implicitWidth: layout.implicitWidth
        implicitHeight: opened ? layout.implicitHeight : text.implicitHeight

        ColumnLayout {
          id: layout

          Text {
            id: text
            text: modelData
            color: Services.ColorService.accent

            font {
              family: "Jetbrains Mono Nerd"
              letterSpacing: -1
              pixelSize: 20
              weight: 600
            }

            MouseArea {
              anchors.fill: parent
              onClicked: item.opened = !item.opened
            }
          }

          Repeater {
            model: Services.CheatsheetService.keybinds[modelData]

            delegate: Item {
              implicitWidth: modelData.type === "label" ? labelText.implicitWidth : categoryText.implicitWidth + categoryLayout.implicitWidth
              implicitHeight: modelData.type === "label" ? labelText.implicitHeight : categoryText.implicitHeight + categoryLayout.implicitHeight

              Text { // Labels
                id: labelText
                visible: modelData.type === "label" && item.opened
                text: modelData.text
                color: Services.ColorService.accent

                font {
                  family: "Jetbrains Mono Nerd"
                  letterSpacing: -1
                  pixelSize: 15
                  weight: 600
                }
              }

              Text { // Categories
                id: categoryText
                visible: modelData.type === "category" && item.opened
                text: "-- " + modelData.name
                color: Services.ColorService.bgHighlight

                font {
                  family: "Jetbrains Mono Nerd"
                  letterSpacing: -1
                  pixelSize: 15
                  weight: 600
                }
              }

              ColumnLayout {
                id: categoryLayout
                anchors.top: categoryText.bottom

                Repeater {
                  model: modelData.labels

                  delegate: Text {
                    visible: item.opened
                    text: modelData
                    color: Services.ColorService.accent

                    font {
                      family: "Jetbrains Mono Nerd"
                      letterSpacing: -1
                      pixelSize: 12
                      weight: 600
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
