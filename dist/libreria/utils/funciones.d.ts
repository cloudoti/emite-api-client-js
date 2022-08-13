import { Decimal } from 'decimal.js';
import { Igv } from './documento';
export declare function validarNumero(numero?: string): string;
export declare function obtenerValorPorcentaje(porcentaje: string): Decimal;
export declare function obterMontoConIgv(montoSinIgv: string, afectacion: string): string;
export declare function obtenerMontoSinIgv(montoConIgv: string, afectacion: string): string;
export declare function obtenerPorcentajeDetraccion(codigo: string): string | undefined;
export declare function obtenerIgv(montoConIgv: string, afectacion: string): Igv;
