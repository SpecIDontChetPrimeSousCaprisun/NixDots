pragma Singleton
import QtQuick

Item {
  property string background: "#161F22"
  property string bgHighlight: "#435257"
  property string accent: "#81a2be"
  property string highlight: "#8abeb7"
  property string ram: "#b294bb"
  property string gpu: "#ad70de"

  function levelColor(level) {
    const colors = [
      "#28323B",  // level 0 - empty (Solarized base02)
      "#3E4E5C",
      "#516678",
      "#5A7185",
      "#81A2BE"   // level 4 - most active (full accent)
    ]
    return colors[level] || colors[0]
  }
}
