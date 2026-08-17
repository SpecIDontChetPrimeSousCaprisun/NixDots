pragma Singleton
import Quickshell
import QtQuick

Item {
  SystemClock {
    id: clock
    precision: SystemClock.minutes
  }
}

