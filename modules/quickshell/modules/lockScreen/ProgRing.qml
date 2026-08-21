import QtQuick
import QtQuick.Shapes

Item {
  id: root
  property real value: 0.65  // 0.0 to 1.0
  property color trackColor: "#073642"  // Solarized base02
  property color progressColor: "#268bd2"  // Solarized blue
  property string icon: ""
  property int lineWidth: 12

  width: 120
  height: 120

  // Background track (full circle)
  Shape {
    anchors.fill: parent
    ShapePath {
      strokeColor: root.trackColor
      strokeWidth: root.lineWidth
      fillColor: "transparent"
      capStyle: ShapePath.RoundCap

      PathAngleArc {
        centerX: root.width / 2
        centerY: root.height / 2
        radiusX: (root.width - root.lineWidth) / 2
        radiusY: (root.height - root.lineWidth) / 2
        startAngle: 0
        sweepAngle: 360
      }
    }
  }

  // Foreground progress arc
  Shape {
    anchors.fill: parent
    ShapePath {
      strokeColor: root.progressColor
      strokeWidth: root.lineWidth
      fillColor: "transparent"
      capStyle: ShapePath.RoundCap

      PathAngleArc {
        centerX: root.width / 2
        centerY: root.height / 2
        radiusX: (root.width - root.lineWidth) / 2
        radiusY: (root.height - root.lineWidth) / 2
        startAngle: -90  // start from the top, like a clock
        sweepAngle: 360 * root.value

        Behavior on sweepAngle {
          NumberAnimation { duration: 400; easing.type: Easing.OutCubic }
        }
      }
    }
  }

  // Optional: percentage label in the center
  Text {
    anchors.centerIn: parent
    text: Math.round(root.value * 100) + "% " + icon
    color: root.progressColor
    font {
      family: "Jetbrains Mono Nerd"
      letterSpacing: -1
      pixelSize: 15
      weight: 600
    }
  }
}

