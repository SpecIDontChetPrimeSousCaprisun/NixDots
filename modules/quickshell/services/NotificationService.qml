pragma Singleton
import Quickshell.Io
import Quickshell.Wayland
import QtQuick

Item {
  property var history: []
  property bool centerVisible: false

  IpcHandler {
    target: "notifications"
    function toggle(): void { centerVisible = !centerVisible }
    function show(): void { centerVisible = true }
    function hide(): void { centerVisible = false }
  }
}
