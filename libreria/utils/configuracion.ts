import { Decimal } from 'decimal.js';
import { Opciones } from '../opciones/opciones';
import OpcionesPredeterminadas from '../opciones/predeterminados';

export interface Configuracion extends Opciones {
  valorIgv?: Decimal;
  valorRetencionIgv?: Decimal;
  urlApi?: string;
  urlRegistrarFactura?: string;
  urlRegistrarBoleta?: string;
  adicionalCodigoDescuentoUnitario: string;
  adicionalCodigoFormaPago: string;
  adicionalValorFormaPagoContado: string;
  adicionalValorFormaPagoCredito: string;
}

export function obtenerConfiguracion(opciones: Opciones): Configuracion {
  const configuracion: Configuracion = {
    emiteKey: opciones.emiteKey,
    monedaPredeterminada: opciones.monedaPredeterminada || OpcionesPredeterminadas.monedaPredeterminada,
    porcentajeIgv: opciones.porcentajeIgv || OpcionesPredeterminadas.porcentajeIgv,
    porcentajeRetencionIgv: opciones.porcentajeRetencionIgv || OpcionesPredeterminadas.porcentajeRetencionIgv,
    cantidadDecimales: opciones.cantidadDecimales || OpcionesPredeterminadas.cantidadDecimales,
    aumentaValorPorcentaje: opciones.aumentaValorPorcentaje || OpcionesPredeterminadas.aumentaValorPorcentaje,
    descuentoClientePorcentaje:
      opciones.descuentoClientePorcentaje || OpcionesPredeterminadas.descuentoClientePorcentaje,
    redondeoCliente: opciones.redondeoCliente || OpcionesPredeterminadas.redondeoCliente,
    descuentoUnitarioPorcentaje:
      opciones.descuentoUnitarioPorcentaje || OpcionesPredeterminadas.descuentoUnitarioPorcentaje,
    calculoSegunValorUnitario: opciones.calculoSegunValorUnitario || OpcionesPredeterminadas.calculoSegunValorUnitario,
    descuentoGlobalPorcentaje: opciones.descuentoGlobalPorcentaje || OpcionesPredeterminadas.descuentoGlobalPorcentaje,
    calculaDescuentoGlobalSinIgv:
      opciones.calculaDescuentoGlobalSinIgv || OpcionesPredeterminadas.calculaDescuentoGlobalSinIgv,
    cargoGlobalPorcentaje: opciones.cargoGlobalPorcentaje || OpcionesPredeterminadas.cargoGlobalPorcentaje,
    calculaCargoGlobalSinIgv: opciones.calculaCargoGlobalSinIgv || OpcionesPredeterminadas.calculaCargoGlobalSinIgv,
    cambiaCantidadSegunPrecio: opciones.cambiaCantidadSegunPrecio || OpcionesPredeterminadas.cambiaCantidadSegunPrecio,
    cuentaDetracciones: opciones.cuentaDetracciones,
    valorIcbper: opciones.valorIcbper || OpcionesPredeterminadas.valorIcbper,
    montoMinimoBoleta: opciones.montoMinimoBoleta || OpcionesPredeterminadas.montoMinimoBoleta,
    entornoPruebas: opciones.entornoPruebas || OpcionesPredeterminadas.entornoPruebas,
    urlRegistrarFactura: OpcionesPredeterminadas.urlRegistrarFactura,
    urlRegistrarBoleta: OpcionesPredeterminadas.urlRegistrarBoleta,
    adicionalCodigoDescuentoUnitario: OpcionesPredeterminadas.adicionalCodigoDescuentoUnitario,
    adicionalCodigoFormaPago: OpcionesPredeterminadas.adicionalCodigoFormaPago,
    adicionalValorFormaPagoContado: OpcionesPredeterminadas.adicionalValorFormaPagoContado,
    adicionalValorFormaPagoCredito: OpcionesPredeterminadas.adicionalValorFormaPagoCredito,
  };
  configuracion.valorIgv = new Decimal(configuracion.porcentajeIgv!).div(new Decimal(100));
  configuracion.valorRetencionIgv = new Decimal(configuracion.porcentajeRetencionIgv!).div(new Decimal(100));
  configuracion.urlApi = configuracion.entornoPruebas
    ? OpcionesPredeterminadas.urlApiPruebas
    : OpcionesPredeterminadas.urlApiProduccion;
  return configuracion;
}
