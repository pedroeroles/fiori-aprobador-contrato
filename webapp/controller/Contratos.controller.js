sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/ui/model/json/JSONModel"
],
function (Controller) {
    "use strict";

    return Controller.extend("aprobadores.project2.controller.Contratos", {
        onInit: function () {
            this.getContratos();
        },

    getContratos: function () {
      const oModel = this.getOwnerComponent().getModel();
      oModel.read("/ContratoSet", {
        assync: false,
        success: (oData) => {
          const oJSON = new JSONModel(oData.results || []);
          this.getView().setModel(oJSON, "ContratoSet");
        },
        error: () => MessageToast.show("Error al leer datos")
      });
    },

    onContratoPress: function (oEvent) {
      const oItem = oEvent.getSource(); // ColumnListItem
      const oCtx = oItem.getBindingContext(); // contexto del ítem
      if (!oCtx) {
        console.warn("Sin binding context en el item. ¿Evento en control equivocado?");
        return;
      }
      const sEbeln = oCtx.getProperty("Ebeln"); 
      this.getOwnerComponent().getRouter().navTo("ContratoItem", { Ebeln: sEbeln });
    }
    });
});

   