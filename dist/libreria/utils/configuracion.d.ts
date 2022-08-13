import { Decimal } from 'decimal.js';
import { Opciones } from '../opciones/opciones';
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
export declare function obtenerConfiguracion(opciones: Opciones): Configuracion;
