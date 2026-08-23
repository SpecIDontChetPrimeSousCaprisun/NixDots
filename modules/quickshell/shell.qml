//@ pragma UseQApplication
import Quickshell
import QtQuick
import "modules"
import "modules/Taskbar"
import "modules/lockScreen"

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
  LockScreen {}
  AppLauncher {}
}
