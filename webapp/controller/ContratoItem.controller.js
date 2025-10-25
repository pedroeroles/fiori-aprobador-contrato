sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageToast, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("aprobadores.project2.controller.ContratoItem", {
   onInit: function () {
      this.getOwnerComponent().getRouter()
        .getRoute("ContratoItem")
        .attachPatternMatched(this._onMatched, this);
    },

    _onMatched: function (oEvent) {
      const sEbeln = oEvent.getParameter("arguments").Ebeln;
      const oView = this.getView();
      oView.bindElement(`/ContratoSet(Ebeln='${sEbeln}')`);
      // La tabla ya filtra por Ebeln en la view (XML)
    },

    onRelease: function () {
      const oCtx = this.getView().getBindingContext();
      if (!oCtx) return;
      const sEbeln = oCtx.getProperty("Ebeln");

      const oModel = this.getView().getModel();
      const oPayload = { Ebeln: sEbeln /* , Frgco: 'XX' */ };

      oModel.create("/ReleaseActionSet", oPayload, {
        success: () => MessageToast.show("Contrato liberado"),
        error: () => MessageToast.show("Error al liberar el contrato")
      });
    },

    formatEstadoColor: function (s) {
      switch (s) {
        case "Pendiente": return "Warning";
        case "Liberado":  return "Success";
        case "Rechazado": return "Error";
        default:          return "None";
      }
    },
    formatEstadoIcon: function (s) {
      switch (s) {
        case "Pendiente": return "sap-icon://pending";
        case "Liberado":  return "sap-icon://accept";
        case "Rechazado": return "sap-icon://decline";
        default:          return "sap-icon://document-text";
      }
    }
  });
});