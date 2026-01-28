sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "aprobadores/project2/model/formatter"
],
  function (Controller, MessageToast, MessageBox, formatter) {
    "use strict";

    return Controller.extend("aprobadores.project2.controller.Contratos", {
      formatter: formatter,
      onInit: function () {
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

          oModelHeader.setProperty("/pendingCount", Number.isInteger(iTotal) ? iTotal : iLen);
          const aItems = oList.getItems();
          if (aItems.length > 0) {
            const oContext = aItems[0].getBindingContext();
            const sGrupo = oContext.getProperty("GLiberacion");
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

      onRelease: function () {
        const oList = this.byId("listContratos");
        const aSelectedItems = oList.getSelectedItems(); // Importante: Requiere mode="MultiSelect" en XML

        if (aSelectedItems.length === 0) {
          MessageToast.show("Seleccione al menos un contrato para liberar");
          return;
        }

        const oModel = this.getView().getModel();
        sap.ui.core.BusyIndicator.show(0);

        // Mapeamos cada item seleccionado a una promesa de creación
        const aPromises = aSelectedItems.map(oItem => {
          const sEbeln = oItem.getBindingContext().getProperty("Ebeln");
          return new Promise((resolve, reject) => {
            oModel.create("/OperacionSet", { Ebeln: sEbeln, Accion: "LIBERAR" }, {
              success: (oData) => resolve(oData),
              error: (oError) => reject(oError)
            });
          });
        });

        Promise.all(aPromises)
          .then(() => {
            sap.ui.core.BusyIndicator.hide();
            MessageToast.show(aSelectedItems.length + " contrato(s) liberado(s) con éxito");

            // Refrescamos y limpiamos
            oModel.refresh(true);
            oList.removeSelections();
          })
          .catch(() => {
            sap.ui.core.BusyIndicator.hide();
            MessageBox.error("Error al procesar la liberación masiva");
          });
      },

      _actualizarUIYSubir: function (iRestar) {
        const oHeaderModel = this.getView().getModel("header");
        const iCurrentCount = oHeaderModel.getProperty("/pendingCount");

        // Restamos la cantidad real que se aprobó
        oHeaderModel.setProperty("/pendingCount", iCurrentCount - iRestar);

        // Si solo era uno, quizás quieras ir a la lista. 
        // Si ya estás en la lista, solo deseleccionamos todo.
        this.byId("listContratos").removeSelections();
      },

      // Formatters declarativos para estado
      formatEstadoColor: function (s) {
        switch (s) {
          case "PEND": return "Warning";
          case "LIB": return "Success";
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