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
    }
  };
});
