export interface Opciones {
  monedaPredeterminada?: string;
  porcentajeIgv?: number;
  cantidadDecimales?: number;
  aumentaValorPorcentaje?: boolean;
  descuentoClientePorcentaje?: boolean;
  redondeoCliente?: boolean;
  descuentoUnitarioPorcentaje?: boolean;
  descuentoGlobalPorcentaje?: boolean;
  calculoSegunValorUnitario?: boolean;
  cambiaCantidadSegunPrecio?: boolean;
  cuentaDetracciones?: string;
  valorIcbper?: string;
  entornoPruebas?: boolean;
}
