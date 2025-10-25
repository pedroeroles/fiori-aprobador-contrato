sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  //"sap/ui/model/json/JSONModel"
],
function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("aprobadores.project2.controller.Contratos", {
    onInit: function () {
      var oHeader = new sap.ui.model.json.JSONModel();
      oHeader.setData({
        approverName: "Pedro Eroles",
        pendingCount: 0,
        releaseGroup: "K1"
      });
              
      this.getView().setModel(oHeader, "header");
      this._refreshHeaderCount();
    },

    _refreshHeaderCount: function () {
      const oList = this.byId("listContratos");
      const oBinding = oList.getBinding("items");
      if (!oBinding) return;

      // Recuenta tras actualización del binding
      oBinding.attachEventOnce("dataReceived", () => {
        const i = oBinding.getLength();
        this.getView().getModel("header").setProperty("/pendingCount", i);
      });
    },

    onRefresh: function () {
      const oList = this.byId("listContratos");
      oList.getBinding("items").refresh();
      this._refreshHeaderCount();
      MessageToast.show("Lista actualizada");
    },

    onSearch: function (oEvent) {
      const sQuery = oEvent.getSource().getValue();
      const oList = this.byId("listContratos");
      const oBinding = oList.getBinding("items");
      if (!oBinding) return;

      const aFilters = [];
      if (sQuery) {
        aFilters.push(new sap.ui.model.Filter("Ebeln", sap.ui.model.FilterOperator.Contains, sQuery));
      }
      oBinding.filter(aFilters);
      this._refreshHeaderCount();
    },

    onItemPress: function (oEvent) {
      const sEbeln = oEvent.getSource().getBindingContext().getProperty("Ebeln");
      this._navToDetail(sEbeln);
    },

    onNavToDetail: function () {
      const oItem = this.byId("listContratos").getSelectedItem();
      if (!oItem) return MessageToast.show("Seleccioná un contrato");
      const sEbeln = oItem.getBindingContext().getProperty("Ebeln");
      this._navToDetail(sEbeln);
    },

    _navToDetail: function (sEbeln) {
      this.getOwnerComponent().getRouter().navTo("ContratoItem", { Ebeln: sEbeln });
    },

    onReleaseSelected: function () {
      const oItem = this.byId("listContratos").getSelectedItem();
      if (!oItem) return MessageToast.show("Seleccioná un contrato");
      const oCtx = oItem.getBindingContext();
      const sEbeln = oCtx.getProperty("Ebeln");

      // Llamada básica al backend (suponiendo EntitySet ReleaseActionSet)
      const oModel = this.getView().getModel();
      const oPayload = { Ebeln: sEbeln /*, Frgco: 'XX' */ };

      oModel.create("/ReleaseActionSet", oPayload, {
        success: () => {
          MessageToast.show("Contrato liberado");
          this.onRefresh();
        },
        error: () => MessageToast.show("No se pudo liberar el contrato")
      });
    },

    // Formatters declarativos para estado
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
        default:          return "sap-icon://question-mark";
      }
    },
    formatEstadoAttr: function (s) {
      return [{ text: "Estado: " + (s || "-") }];
    }
  });
});