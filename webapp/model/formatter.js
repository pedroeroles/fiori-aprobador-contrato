sap.ui.define([], function () {
  "use strict";
  return {
    formatEstado: function (sCode) {
      if (!sCode) return "";
      switch (sCode) {
        case "PEND": return "Pendiente";
        case "LIB":  return "Liberado";
        case "ERROR": return "Error";
        case "PROC": return "En proceso";
        default: return sCode;
      }
    },
    formatEstadoColor: function (sCode) {
      switch (sCode) {
        case "LIB": return "Success";
        case "ERROR": return "Error";
        case "PROC": return "Warning";
        default: return "Information";
      }
    },
    // ... otros formatters que ya tengas
        
        formatFechaCritica: function (sFecha) {
            if (!sFecha) {
                return "None";
            }

            // SAP entrega fechas como YYYYMMDD o objetos Date
            var oFechaContrato = new Date(sFecha);
            var oHoy = new Date();
            oHoy.setHours(0, 0, 0, 0); // Normalizamos hoy para comparar solo fechas

            // Si la fecha del contrato es anterior a hoy, es un retraso
            if (oFechaContrato < oHoy) {
                return "Error"; // Color Rojo en Fiori
            } else if (oFechaContrato.getTime() === oHoy.getTime()) {
                return "Warning"; // Color Naranja (es hoy)
            }
            
            return "Success"; // Color Verde (es a futuro)
        }
  };
});
