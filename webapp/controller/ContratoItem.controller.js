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
      // ⬅️ modelo local para el total
      this.getView().setModel(new JSONModel({ total: 0 }), "local");

      this.getOwnerComponent()
        .getRouter()
        .getRoute("ContratoItem")
        .attachPatternMatched(this._onMatched, this);
    },

    _onMatched: function (oEvent) {
      const Ebeln = oEvent.getParameter("arguments").Ebeln;
      const oView = this.getView();

      // Header del contrato (traé también WAERS si lo tenés)
      oView.bindElement(`/ContratoSet(Ebeln='${Ebeln}')`);

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

      // ⬅️ recalcular total cuando cargue la tabla
      oTable.attachUpdateFinished(this._calcTotal, this);
    },

    _calcTotal: function () {
      const oTable = this.byId("itemsList");
      let total = 0;

      oTable.getItems().forEach((oItem) => {
        const ctx = oItem.getBindingContext();
        // Si tenés importe por posición, usalo:
        let pos = Number(ctx.getProperty("Netwrpos"));
        if (isNaN(pos)) {
          // fallback: Netpr * Menge / Peinh
          const netpr = Number(ctx.getProperty("Netpr"))  || 0;
          const menge = Number(ctx.getProperty("Menge"))  || 0;
          const peinh = Number(ctx.getProperty("Peinh"))  || 1;
          pos = (netpr * menge) / (peinh || 1);
        }
        total += pos;
      });

      this.getView().getModel("local").setProperty("/total", total);
    },

    // Opcional: formateo 2 decimales + moneda
    formatTotal: function (total, waers) {
      if (total == null) return "";
      const n = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total);
      return waers ? `${n} ${waers}` : n;
    }
  });
});