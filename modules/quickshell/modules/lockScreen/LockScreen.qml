import "../../services" as Services
import "../Taskbar"
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import QtQuick
import QtQuick.Layouts
import QtQuick.Effects

Item {
  id: root

  property var lockScreenshots: ({})

  SystemClock {
    id: clock
    precision: SystemClock.minutes
  }

  function captureAllScreens(callback) {
    let screens = Quickshell.screens
    let remaining = screens.length

    for (let screen of screens) {
      let path = "/tmp/lockscreen-" + screen.name + ".png"
      let proc = Qt.createQmlObject(
        'import Quickshell.Io; Process { command: ["grim", "-o", "' + screen.name + '", "' + path + '"] }',
        root
      )
      proc.onRunningChanged.connect(() => {
        if (!proc.running) {
          lockScreenshots[screen.name] = path
          remaining--
          if (remaining === 0) callback()
        }
      })
      proc.running = true
    }
  }

  Process {
    id: screenshotProcess
    command: ["grim", "/tmp/lockscreen.png"]
    onExited: {
      lock.locked = true
    }
  }

  WlSessionLock {
    id: lock 

    WlSessionLockSurface {
      id: surface

      Image {
        id: bgImage
        anchors.centerIn: parent
        width: parent.width * 1
        height: parent.height * 1
        source: "file://" + lockScreenshots[surface.screen.name]
        fillMode: Image.PreserveAspectCrop
        cache: false
        visible: false

        Rectangle {
          width: parent.width
          height: parent.width / 3
          anchors.bottom: parent.bottom
          gradient: Gradient {
            orientation: Gradient.Vertical
            GradientStop { position: 1.0; color: Qt.rgba(0, 0.16, 0.21, 1.0) }
            GradientStop { position: 0.0; color: Qt.rgba(0, 0.16, 0.21, 0.0) }
          }

          RowLayout {
            id: visualizer
            anchors.fill: parent
            spacing: 3

            Repeater {
              model: Services.Mpd.bars
              Rectangle {
                width: 15
                height: Math.max(2, (modelData / 100) * visualizer.height)
                color: Services.ColorService.accent
                radius: 6
                anchors.bottom: parent.bottom

                Behavior on height {
                  NumberAnimation { duration: 50; easing.type: Easing.OutCubic }
                }
              }
            }
          }
        }
      }

      MultiEffect {
          anchors.fill: bgImage
          source: bgImage
          blurEnabled: true
          blur: 1.0
          blurMax: 64
      }

      //Wallpaper {}
      TimeWidget {
        x: (surface.width / 2) - (width / 2)
        y: surface.height / 3.5
      }
      LockMusic {
        x: (surface.width / 4) - (width / 2)
        y: surface.height / 2
      }
      LockPerfs {
        x: ((surface.width / 4) * 3) - (width / 2)
        y: (surface.height / 2) - (height / 2)
      }

      Widget {
        width: 200
        height: 40
        anchors.centerIn: parent
        radius: 10

        TextInput {
          anchors.fill: parent
          color: Services.ColorService.accent
          echoMode: TextInput.Password
          focus: true
          horizontalAlignment: TextInput.AlignHCenter
          verticalAlignment: TextInput.AlignVCenter

          font {
            family: "Jetbrains Mono Nerd"
            letterSpacing: 2
            pixelSize: 27
            weight: 600
          }

          Component.onCompleted: {
            forceActiveFocus()
          }

          onAccepted: {
            authenticate(text)
            text = ""
          }
        }
      }
    }
  }

  IpcHandler {
    target: "lock"
    function lock(): void {
      captureAllScreens(() => {
        lock.locked = true
      }) 
    }
  }

  function authenticate(passwd) {
    if (passwd.length === 0) return

    pamHelper.running = true
    pamHelper.write(passwd + "\n")
  }

  Process {
    id: pamHelper

    stdinEnabled: true
    command: ["/home/chevre/.config/quickshell/pam-helper"]

    stdout: StdioCollector {
      onStreamFinished: {
        const result = text.trim()

        if (result === "OK") {
          lock.locked = false
        }
      }
    }

    onExited: {
      console.log("PAM helper exited:", exitCode)
    }
  }
}
