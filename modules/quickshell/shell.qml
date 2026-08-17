//@ pragma UseQApplication
import Quickshell
import QtQuick
import "modules"
import "modules/Taskbar"

ShellRoot {
  Taskbar {}
  Workspaces {}
  Calendar {}
  PowerOptions {}
  MusicWindow {}
  Perfs {}
  Notifications {}
  NC {}
  Git {}
}
