import { Opciones } from './opciones';

export interface OpcionesPredeterminadas extends Opciones {
  urlApiPruebas?: string;
  urlApiProduccion?: string;
  urlRegistrarFactura?: string;
  urlRegistrarBoleta?: string;
}

const OpcionesPredeterminadas: OpcionesPredeterminadas = {
  monedaPredeterminada: 'PEN',
  porcentajeIgv: 18.0,
  cantidadDecimales: 10,
  aumentaValorPorcentaje: false,
  descuentoClientePorcentaje: false,
  redondeoCliente: false,
  descuentoUnitarioPorcentaje: false,
  descuentoGlobalPorcentaje: false,
  calculoSegunValorUnitario: false,
  cambiaCantidadSegunPrecio: false,
  valorIcbper: '0.50',
  entornoPruebas: true,
  urlApiPruebas: 'https://api.uat.emite.pe',
  urlApiProduccion: 'https://api.emite.pe',
  urlRegistrarFactura: '/factura/registrar',
  urlRegistrarBoleta: '/bolñeta/registrar',
};

export default OpcionesPredeterminadas;
