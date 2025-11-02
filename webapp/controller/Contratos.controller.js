sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  //"sap/ui/model/json/JSONModel"
  "aprobadores/project2/model/formatter"
],
function (Controller, MessageToast, formatter) {
    "use strict";

    return Controller.extend("aprobadores.project2.controller.Contratos", {
    formatter: formatter,
    onInit: function () {
    // Mejor: importá JSONModel en sap.ui.define; si no, esto funciona igual:
    var oHeader = new sap.ui.model.json.JSONModel({
      approverName: "Pedro Eroles",
      pendingCount: 0,
      GLiberacion: ""
    });

    this.getView().setModel(oHeader, "header");

    const oList = this.byId("listContratos");
    
    oList.attachUpdateFinished((oEvent) => {
      const oModelHeader = this.getView().getModel("header");

      // total viene del backend; si no está, usamos el length del binding
      const iTotal = oEvent.getParameter("total");

      //const iLen = oList.getBinding("items")?.getLength?.() ?? 0;

      //oModelHeader.setProperty("/pendingCount", Number.isInteger(iTotal) ? iTotal : iLen);
      const aItems = oList.getItems();
      if (aItems.length > 0) {
        const oContext = aItems[0].getBindingContext();
        const sGrupo = oContext.getProperty("GLiberacion"); // campo del OData
        oModelHeader.setProperty("/GLiberacion", sGrupo || "");
      }
    });
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
        case "PEND": return "Warning";
        case "LIB":  return "Success";
        case "ERROR": return "Error";
        case "PROC": return "En proceso";
        default: return sCode;
      }
    },
    formatEstadoIcon: function (s) {
      switch (s) {
        case "LIB": return "Success";
        case "ERROR": return "Error";
        case "PROC": return "Warning";
        default: return "Information";
      }
    },
    formatEstadoAttr: function (s) {
      return [{ text: "Estado: " + (s || "-") }];
    }
  });
});