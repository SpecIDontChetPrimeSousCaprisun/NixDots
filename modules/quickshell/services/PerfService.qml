pragma Singleton

import QtQuick
import Quickshell
import Quickshell.Io

Item {
  property var perfsPositions: []
  property bool perfsVisible: false
  property real previousTotal: 0
  property real previousIdle: 0
  property int cpuUsage: 0
  property int ramUsage: 0
  property int gpuUsage: 0
  property int gpuTemp: 0

  function getGlobalRect(item) {
    let topLeft = item.mapToItem(null, 0, 0)
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: item.width,
      height: item.height
    }
  }

  Timer {
    interval: 1000
    running: true
    repeat: true
    triggeredOnStart: true

    onTriggered: {
      cpuProc.running = true
      ramProc.running = true
      gpuProc.running = true
    }
  }

  Process {
    id: cpuProc

    command: [
      "sh", "-c",
      "awk '/^cpu / {print $2,$3,$4,$5,$6,$7,$8}' /proc/stat"
    ]

  stdout: StdioCollector {
      onStreamFinished: {
        let values = text.trim().split(" ").map(Number)

        let idle = values[3] + values[4]
        let total = values.reduce((a, b) => a + b, 0)

        if (previousTotal > 0) {
          let totalDelta = total - previousTotal
          let idleDelta = idle - previousIdle

          cpuUsage = (1 - idleDelta / totalDelta) * 100
        }

        previousTotal = total
        previousIdle = idle
      }
    }
  }

  Process {
    id: ramProc

    command: [
      "sh", "-c",
      "free | awk '/Mem:/ {print $3/$2 * 100}'"
    ]

    stdout: StdioCollector {
      onStreamFinished: {
        ramUsage = parseFloat(text.trim())
      }
    }
  }

  Process {
    id: gpuProc

    command: [
      "nvidia-smi",
      "--query-gpu=utilization.gpu,temperature.gpu",
      "--format=csv,noheader,nounits"
    ]

    stdout: StdioCollector {
      onStreamFinished: {
        let values = text.trim().split(",")

        if (values.length >= 2) {
          gpuUsage = parseFloat(values[0])
          gpuTemp = parseFloat(values[1])
        }
      }
    }
  }
}
