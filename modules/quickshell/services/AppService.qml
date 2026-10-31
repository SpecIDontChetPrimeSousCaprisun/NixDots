pragma Singleton
import Quickshell
import Quickshell.Io
import QtQuick

Item {
  property bool launcherVisible: false
  property bool useOffload: false
  property string filterQuery: ""
  property var apps: {
    if (filterQuery.length === 0) return DesktopEntries.applications.values
    return DesktopEntries.applications.values.filter(app =>
      app.name.toLowerCase().includes(filterQuery.toLowerCase())
    )
  }

  IpcHandler {
    target: "launcher"
    function open(): void {
      launcherVisible = !launcherVisible
      TmuxService.refresh()
    }
  }
}
