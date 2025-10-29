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

    //_onMatched: function (oEvent) {
    //  const Ebeln = oEvent.getParameter("arguments").Ebeln;
    //  const oView = this.getView();

    _onMatched: function (oEvent) {
      const Ebeln = oEvent.getParameter("arguments").Ebeln;
      this.getView().bindElement({
        path: `/ContratoSet(Ebeln='${Ebeln}')`
    });

      // Tabla de ítems filtrada por contrato
      const oTable = this.byId("itemsList");
      oTable.unbindItems(); // por si venís de otro contrato
      oTable.bindItems({
        path: "/ContratoItemSet",
        filters: [ new Filter("Ebeln", FilterOperator.EQ, Ebeln) ],
        template: new sap.m.ColumnListItem({
          cells: [
            new sap.m.Text({ text: "{Ebelp}" }),
            new sap.m.Text({ text: "{Matnr}" }),
            new sap.m.Text({ text: "{Txz01}" }),
            new sap.m.Text({ text: "{Menge}" }),
            new sap.m.Text({ text: "{Meins}" }),
            new sap.m.Text({ text: "{Netpr}" }),
            new sap.m.Text({ text: "{Peinh}" }),
            new sap.m.Text({ text: "{Netwrpos}" })
          ]
        })
      });
    },

    onRelease: function () {
      const oCtx = this.getView().getBindingContext();
      if (!oCtx) return;
      const sEbeln = oCtx.getProperty("Ebeln");

      const oModel = this.getView().getModel();
      const oPayload = { Ebeln: sEbeln /* , Frgco: 'XX' */ };

      oModel.create("/ReleaseActionSet", oPayload, {
        success: () => MessageToast.show(`Contrato ${sEbeln} liberado con éxito`, { duration: 3000 }),
        error: () => MessageToast.show("Error al liberar el contrato")
      });
    },

    formatProveedor: function (sLifnr, sName1) {
      if (!sLifnr && !sName1) return "";
      if (sLifnr && sName1) return `${sLifnr} - ${sName1}`;
      return sLifnr || sName1; // si falta alguno
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