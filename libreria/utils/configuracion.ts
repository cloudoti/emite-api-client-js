import { Decimal } from 'decimal.js';
import { Opciones } from '../opciones/opciones';
import OpcionesPredeterminadas from '../opciones/predeterminados';

export interface Configuracion extends Opciones {
  valorIgv?: Decimal;
  urlApi?: string;
  urlRegistrarFactura?: string;
  urlRegistrarBoleta?: string;
}

export function obtenerConfiguracion(opciones: Opciones): Configuracion {
  const configuracion: Configuracion = {
    monedaPredeterminada: opciones.monedaPredeterminada || OpcionesPredeterminadas.monedaPredeterminada,
    porcentajeIgv: opciones.porcentajeIgv || OpcionesPredeterminadas.porcentajeIgv,
    cantidadDecimales: opciones.cantidadDecimales || OpcionesPredeterminadas.cantidadDecimales,
    aumentaValorPorcentaje: opciones.aumentaValorPorcentaje || OpcionesPredeterminadas.aumentaValorPorcentaje,
    descuentoClientePorcentaje:
      opciones.descuentoClientePorcentaje || OpcionesPredeterminadas.descuentoClientePorcentaje,
    redondeoCliente: opciones.redondeoCliente || OpcionesPredeterminadas.redondeoCliente,
    descuentoUnitarioPorcentaje:
      opciones.descuentoUnitarioPorcentaje || OpcionesPredeterminadas.descuentoUnitarioPorcentaje,
    descuentoGlobalPorcentaje: opciones.descuentoGlobalPorcentaje || OpcionesPredeterminadas.descuentoGlobalPorcentaje,
    calculoSegunValorUnitario: opciones.calculoSegunValorUnitario || OpcionesPredeterminadas.calculoSegunValorUnitario,
    cambiaCantidadSegunPrecio: opciones.cambiaCantidadSegunPrecio || OpcionesPredeterminadas.cambiaCantidadSegunPrecio,
    cuentaDetracciones: opciones.cuentaDetracciones,
    valorIcbper: opciones.valorIcbper || OpcionesPredeterminadas.valorIcbper,
    entornoPruebas: opciones.entornoPruebas || OpcionesPredeterminadas.entornoPruebas,
    urlRegistrarFactura: OpcionesPredeterminadas.urlRegistrarFactura,
    urlRegistrarBoleta: OpcionesPredeterminadas.urlRegistrarBoleta,
  };
  configuracion.valorIgv = new Decimal(configuracion.porcentajeIgv!).div(new Decimal(100));
  configuracion.urlApi = configuracion.entornoPruebas
    ? OpcionesPredeterminadas.urlApiPruebas
    : OpcionesPredeterminadas.urlApiProduccion;
  return configuracion;
}
