pragma Singleton
import Quickshell
import Quickshell.Io
import QtQuick

Item {
  property bool optionsVisible: false
  property bool shouldChangeOpacity: true
  property int optionsX: -100
  property int optionsXTarget: 0
  property int textOpacity: 0
  property int hoveredIndex: 0
  property var powerOptions: [
    { name: "Shutdown", icon: "", command: [ "shutdown", "-h", "now" ] },
    { name: "Reboot", icon: "", command: [ "reboot" ] },
    { name: "Lock", icon: "", command: [ "qs", "ipc", "call", "lock", "lock" ] },
    { name: "Hibernate", icon: "󰒲", command: [ "qs", "ipc", "call", "lock", "hibernate" ] },
    { name: "Sleep", icon: "󰤄", command: [ "qs", "ipc", "call", "lock", "sleep" ] }
  ]
}
