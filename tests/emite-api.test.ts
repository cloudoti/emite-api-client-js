import EmiteAPI from "../emite-api";
import {Adquiriente, Cabecera, Cuota, Detalle, Documento, GuiaRemision} from "../libreria/utils/documento";

test("email luc@perdu.com valid", () => {
    // expect(isEmail("luc@perdu.com")).toBe(true)

    EmiteAPI.agregarConfiguracion({ cuentaDetracciones: "100-100-100", descuentoUnitarioPorcentaje: true });
    const documento = Documento.crear();

    documento
        .agregarCabecera(
            Cabecera.crear()
                .agregarTipoDocumento("01")
                .agregarTipoMoneda(EmiteAPI.configuracion.monedaPredeterminada!)
                .agregarTipoOperacion("01")
                .agregarSubTipoOperacion("01")
                .agregarAdquiriente(
                    Adquiriente.crear()
                        .agregarTipoIdentidad("6")
                        .agregarNumeroIdentidad("20600323751")
                        .agregarNombre("DOOUS TECHNOLOGIES E.I.R.L.")
                        .agregarDireccion("SANTA CATALINA")
                        .agregarDepartamento("LIMA")
                        .agregarProvincia("LIMA")
                        .agregarDistrito("LA VICTORIA")
                )
                .agregarCodigoEstablecimiento("0000")
                .agregarSerie("F001")
                .agregarCorrelativo(1)
                .agregarFechaEmision("2022-07-21")
                .agregarCodigoDetraccion("027")
                .agregarValorReferencialDetraccion("200.00")
                .agregarTipoFormaPago("2")
                .agregarCuotasPago(Cuota.crear().agregarMonto("81.24").agregarFechaVencimiento("2022-07-31"))
                .agregarGuiasRemision(GuiaRemision.crear().agregarNumero("T001-1").agregarTipo("09"))
                .agregarGuiasRemision(GuiaRemision.crear().agregarNumero("T001-2").agregarTipo("71"))
                .agregarRetencionIgv(true)
        )
        .agregarDetalle(
            Detalle.crear()
                .agregarCantidad("4")
                .agregarDescripcion("Producto para prueba número 1")
                .agregarDescripcion("Descripcion adicional 1")
                .agregarPrecioVentaUnitario("15.00")
                .agregarUnidadMedida("NIU")
                .agregarCodigoProducto("TEST-0001")
                .agregarCodigoTipoAfectacionIgv("10")
                .agregarIcbp(true)
        )
        .agregarDetalle(
            Detalle.crear()
                .agregarCantidad("8")
                .agregarDescripcion("Producto para prueba número 2")
                .agregarDescripcion("Descripcion adicional 2")
                .agregarPrecioVentaUnitario("5.00")
                .agregarUnidadMedida("NIU")
                .agregarCodigoProducto("TEST-0002")
                .agregarCodigoTipoAfectacionIgv("10")
                .agregarDescuento("25")
        )
        .build();

    console.log(documento.validar());

    console.log(documento.toJSON());
    console.log(JSON.stringify(documento.toJSON()));
});
