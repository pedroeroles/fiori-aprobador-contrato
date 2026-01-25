sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox",  // <--- 1. AGREGAR AQUÍ
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "aprobadores/project2/model/formatter",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/TextArea",
  "sap/m/Text"
], function (Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator, formatter, Dialog, Button, TextArea, Text) {
  "use strict";

  return Controller.extend("aprobadores.project2.controller.ContratoItem", {
    formatter: formatter,
    onInit: function () {
      this.getOwnerComponent().getRouter()
        .getRoute("ContratoItem")
        .attachPatternMatched(this._onMatched, this);
    },

    _onMatched: function (oEvent) {
      const Ebeln = oEvent.getParameter("arguments").Ebeln;
      const oView = this.getView();

      oView.bindElement(`/ContratoSet(Ebeln='${Ebeln}')`);

      // Tabla de ítems filtrada por contrato
      const oTable = this.byId("itemsList");
      oTable.unbindItems(); // por si venís de otro contrato
      oTable.bindItems({
        path: "/ContratoItemSet",
        filters: [new Filter("Ebeln", FilterOperator.EQ, Ebeln)],
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
      // 1. Crear datos simulados para Historial y Adjuntos
      var oAuxData = {
        Adjuntos: [
          { Nombre: "Contrato_Marco_Legal.pdf", Info: "2.4 MB - Firmado", Icon: "sap-icon://pdf-attachment" },
          { Nombre: "Especificaciones_Tecnicas.docx", Info: "500 KB - Versión 3", Icon: "sap-icon://doc-attachment" },
          { Nombre: "Anexo_Presupuesto.xlsx", Info: "120 KB", Icon: "sap-icon://excel-attachment" }
        ],
        Historial: [
          { Autor: "Sistema SAP", Texto: "Contrato creado automáticamente (MRP)", Fecha: "20/01/2026", Icon: "sap-icon://it-system" },
          { Autor: "Pedro Eroles", Texto: "Verificación de precios completada.", Fecha: "21/01/2026", Icon: "sap-icon://employee" },
          { Autor: "Gerente Compras", Texto: "Solicitud de revisión de proveedores.", Fecha: "22/01/2026", Icon: "sap-icon://manager" }
        ]
      };

      // 2. Crear un modelo JSON y asignarlo a la vista con nombre "aux"
      var oAuxModel = new sap.ui.model.json.JSONModel(oAuxData);
      this.getView().setModel(oAuxModel, "aux");
    },

    // -----------------------------------------------------------
    // Lógica del Botón "Aprobar" (Aprueba Contrato)
    // -----------------------------------------------------------
    onRelease: function () {
      const oModel = this.getView().getModel(); // Modelo OData
      const oView = this.getView();

      // Obtener el contrato actual
      const oContext = oView.getBindingContext();
      const sEbeln = oContext.getProperty("Ebeln");

      // Crear la operación
      const oEntry = {
        Ebeln: sEbeln,
        Accion: "LIBERAR"
      };

      sap.ui.core.BusyIndicator.show(0); // Mostrar loading

      oModel.create("/OperacionSet", oEntry, {
        success: function (oData) {
          sap.ui.core.BusyIndicator.hide();
          sap.m.MessageToast.show(oData.Resultado || "Contrato liberado con éxito");

          // Refrescar lista y contador
          oModel.refresh(true);

          // Leer cantidad de contratos pendientes correctamente
          oModel.read("/ContratoSet/$count", {
            success: function (oData2, oResponse) {
              // Volver a la vista principal
              const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
              oRouter.navTo("Contratos", {}, true);
            }.bind(this),
            error: function () {
              oRouter.navTo("Contratos", {}, true);
            }
          });
        }.bind(this),

        error: function (oError) {
          sap.ui.core.BusyIndicator.hide();
          sap.m.MessageBox.error("Error al liberar el contrato");
        }
      });
    },

    onGoToList: function () {
      const oRouter = sap.ui.core.UIComponent.getRouterFor(this);

      // Si querés ir a la lista "limpia" siempre:
      oRouter.navTo("Contratos", {}, true); // true = reemplaza historial
    },

    formatEstadoColor: function (s) {
      switch (s) {
        case "Pendiente": return "Warning";
        case "Liberado": return "Success";
        case "Rechazado": return "Error";
        default: return "None";
      }
    },
    formatEstadoIcon: function (s) {
      switch (s) {
        case "Pendiente": return "sap-icon://pending";
        case "Liberado": return "sap-icon://accept";
        case "Rechazado": return "sap-icon://decline";
        default: return "sap-icon://document-text";
      }
    },

    // -----------------------------------------------------------
    // Lógica del Botón "Rechazar" (Abre Pop-up)
    // -----------------------------------------------------------
    onReject: function () {
      var that = this;

      // Si no existe el diálogo, lo creamos
      if (!this.oRejectDialog) {
        this.oRejectDialog = new Dialog({
          title: "Rechazar Contrato",
          type: "Message",
          content: [
            new Text({ text: "Por favor, indique el motivo del rechazo:" }),
            new TextArea("rejectReason", {
              width: "100%",
              placeholder: "Ej: Precio incorrecto..."
            })
          ],
          beginButton: new Button({
            text: "Confirmar Rechazo",
            type: "Reject",
            press: function () {
              var sReason = sap.ui.getCore().byId("rejectReason").getValue();

              // Obtener el ID del contrato actual (desde la ruta o el modelo)
              // Asumo que lo tienes en el BindingContext, si no, úsalo desde la vista.
              var sContractID = that.getView().getBindingContext().getProperty("Ebeln");

              // Payload: Los datos que coinciden con tu entidad "Operacion"
              var oPayload = {
                Ebeln: sContractID,
                Accion: "RECHAZAR",
                Comentario: sReason
              };

              var oModel = that.getView().getModel();

              // Llamada OData CREATE (POST)
              oModel.create("/OperacionSet", oPayload, {
                success: function () {
                  that.oRejectDialog.close();
                  MessageBox.success("El contrato ha sido rechazado correctamente.");
                  // Opcional: Navegar atrás
                },
                error: function (oError) {
                  that.oRejectDialog.close(); // Cerramos el diálogo de motivo

                  var sMensajeError = "Ocurrió un error desconocido.";

                  // Intentamos leer el mensaje que viene desde SAP (JSON)
                  try {
                    var oBody = JSON.parse(oError.responseText);
                    sMensajeError = oBody.error.message.value;
                  } catch (e) {
                    // Si falla el parseo, usamos el mensaje genérico
                    if (oError.message) {
                      sMensajeError = oError.message;
                    }
                  }

                  // Mostramos el mensaje real de la BAPI al usuario
                  MessageBox.error(sMensajeError, {
                    title: "Error de Backend"
                  });
                }
              });
            }
          }),
          endButton: new Button({
            text: "Cancelar",
            press: function () {
              that.oRejectDialog.close();
            }
          }),
          afterClose: function () {
            that.oRejectDialog.destroy();
            that.oRejectDialog = null;
          }
        });
      }
      this.oRejectDialog.open();
    },

    // -----------------------------------------------------------
    // Función para descargar PDF
    // -----------------------------------------------------------
    onPressAttachment: function (oEvent) {
      var sTitle = oEvent.getSource().getTitle();
      MessageToast.show("Descargando: " + sTitle);
      // En un caso real: window.open(url_del_pdf);
    }

  });
});