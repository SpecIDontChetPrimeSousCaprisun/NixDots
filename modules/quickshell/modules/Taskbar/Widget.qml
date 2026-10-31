import "../../services" as Services
import QtQuick

Rectangle {
  color: Services.ColorService.background
  radius: 10

  border {
    color: Services.ColorService.accent
    width: 2
  }
}
