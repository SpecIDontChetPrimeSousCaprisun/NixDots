import "../../services" as Services
import Quickshell
import Quickshell.Services.SystemTray
import QtQuick
import QtQuick.Layouts

Widget {
  visible: repeater.count > 0
  implicitWidth: layout.implicitWidth + 12
  implicitHeight: layout.implicitHeight + 12

  RowLayout {
    id: layout
    anchors.fill: parent
    anchors.leftMargin: 6
    anchors.rightMargin: 6

    Repeater {
      id: repeater
      model: SystemTray.items

      Image {
        id: img
        Layout.preferredHeight: 18
        Layout.preferredWidth: 18
        fillMode: Image.PreserveAspectFit
        visible: source.toString() !== ""
        source: modelData.icon || ""

        MouseArea {
          anchors.fill: parent
          acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MiddleButton
          onClicked: mouse => {
            if (mouse.button === Qt.LeftButton) {
              modelData.activate()
            } else if (mouse.button === Qt.RightButton) {
              const rect = Services.PerfService.getGlobalRect(img)
              modelData.display(taskbar, rect.x + mouse.x, rect.y + mouse.y)
            } else if (mouse.button === Qt.MiddleButton) {
              modelData.secondaryActivate()
            }
          }
        }
      }
    }
  }
}
