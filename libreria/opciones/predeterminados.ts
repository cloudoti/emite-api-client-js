import { Opciones } from './opciones';
import { Configuracion } from '../utils/configuracion';

export interface OpcionesPredeterminadas extends Configuracion {
  urlApiPruebas?: string;
  urlApiProduccion?: string;
}

const OpcionesPredeterminadas: OpcionesPredeterminadas = {
  monedaPredeterminada: 'PEN',
  porcentajeIgv: 18.0,
  porcentajeRetencionIgv: 3.0,
  cantidadDecimales: 10,
  aumentaValorPorcentaje: false,
  descuentoClientePorcentaje: false,
  redondeoCliente: false,
  descuentoUnitarioPorcentaje: false,
  calculoSegunValorUnitario: false,
  descuentoGlobalPorcentaje: false,
  calculaDescuentoGlobalSinIgv: false,
  cargoGlobalPorcentaje: false,
  calculaCargoGlobalSinIgv: false,
  cambiaCantidadSegunPrecio: false,
  valorIcbper: '0.50',
  entornoPruebas: true,
  urlApiPruebas: 'https://api.uat.emite.pe',
  urlApiProduccion: 'https://api.emite.pe',
  urlRegistrarFactura: '/factura/registrar',
  urlRegistrarBoleta: '/boleta/registrar',
  adicionalCodigoDescuentoUnitario: 'DESCUENTO_UNITARIO',
  adicionalCodigoFormaPago: 'TIPO_PAGO',
  adicionalValorFormaPagoContado: 'CONTADO',
  adicionalValorFormaPagoCredito: 'CRÉDITO',
};

export default OpcionesPredeterminadas;
