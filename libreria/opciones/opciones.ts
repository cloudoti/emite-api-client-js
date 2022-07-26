export interface Opciones {
  emiteKey?: string;
  monedaPredeterminada?: 'PEN' | 'USD' | 'EUR';
  porcentajeIgv?: number;
  porcentajeRetencionIgv?: number;
  cantidadDecimales?: number;
  aumentaValorPorcentaje?: boolean;
  descuentoClientePorcentaje?: boolean;
  redondeoCliente?: boolean;
  descuentoUnitarioPorcentaje?: boolean;
  calculoSegunValorUnitario?: boolean;
  descuentoGlobalPorcentaje?: boolean;
  calculaDescuentoGlobalSinIgv?: boolean;
  cargoGlobalPorcentaje?: boolean;
  calculaCargoGlobalSinIgv?: boolean;
  cambiaCantidadSegunPrecio?: boolean;
  cuentaDetracciones?: string;
  valorIcbper?: string;
  montoMinimoBoleta?: string;
  entornoPruebas?: boolean;
}
