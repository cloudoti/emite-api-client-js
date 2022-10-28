import { Decimal } from 'decimal.js';
import { Detalle, Igv } from './documento';
import EmiteApi from '../../emite-api';

export function validarNumero(numero?: string): string {
  let numeroValido = new Decimal(0).valueOf();
  if (numero && !isNaN(Number(numero))) numeroValido = new Decimal(numero).valueOf();
  return numeroValido;
}

export function obtenerValorPorcentaje(porcentaje: string): Decimal {
  return new Decimal(porcentaje).div(new Decimal(100));
}

export function obterMontoConIgv(montoSinIgv: string, afectacion: string): string {
  if (afectacion === '10') {
    const valorIgv = new Decimal(1).add(EmiteApi.configuracion.valorIgv!);
    return new Decimal(montoSinIgv).mul(valorIgv).toFixed(2);
  } else {
    return new Decimal(montoSinIgv).toFixed(2);
  }
}

export function obtenerMontoSinIgv(montoConIgv: string, afectacion: string): string {
  if (afectacion === '10') {
    const valorIgv = new Decimal(1).add(EmiteApi.configuracion.valorIgv!);
    return new Decimal(montoConIgv).div(valorIgv).toFixed(EmiteApi.configuracion.cantidadDecimales);
  } else {
    return new Decimal(montoConIgv).toFixed(EmiteApi.configuracion.cantidadDecimales);
  }
}

export function obtenerPorcentajeDetraccion(codigo: string): string | undefined {
  const detracciones = [
    { codigo: '001', porcentaje: '10' },
    { codigo: '002', porcentaje: '100' },
    { codigo: '003', porcentaje: '100' },
    { codigo: '007', porcentaje: '100' },
    { codigo: '008', porcentaje: '4' },
    { codigo: '009', porcentaje: '10' },
    { codigo: '010', porcentaje: '100' },
    { codigo: '012', porcentaje: '12' },
    { codigo: '013', porcentaje: '100' },
    { codigo: '014', porcentaje: '4' },
    { codigo: '015', porcentaje: '100' },
    { codigo: '016', porcentaje: '100' },
    { codigo: '017', porcentaje: '100' },
    { codigo: '020', porcentaje: '12' },
    { codigo: '021', porcentaje: '10' },
    { codigo: '022', porcentaje: '12' },
    { codigo: '023', porcentaje: '12' },
    { codigo: '025', porcentaje: '10' },
    { codigo: '026', porcentaje: '100' },
    { codigo: '027', porcentaje: '4' },
    { codigo: '028', porcentaje: '100' },
    { codigo: '030', porcentaje: '4' },
    { codigo: '036', porcentaje: '100' },
    { codigo: '037', porcentaje: '12' },
    { codigo: '039', porcentaje: '100' },
    { codigo: '040', porcentaje: '4' },
    { codigo: '019', porcentaje: '10' },
    { codigo: '099', porcentaje: '1.5' },
    { codigo: '005', porcentaje: '1.5' },
    { codigo: '024', porcentaje: '10' },
    { codigo: '011', porcentaje: '10' },
    { codigo: '004', porcentaje: '1.5' },
    { codigo: '035', porcentaje: '1.5' },
    { codigo: '031', porcentaje: '10' },
    { codigo: '034', porcentaje: '10' },
  ];
  let porcentaje;
  detracciones.forEach((detraccion) => {
    if (detraccion.codigo === codigo) {
      porcentaje = detraccion.porcentaje;
    }
  });
  return porcentaje;
}

export function obtenerIgv(montoConIgv: string, afectacion: string): Igv {
  if (afectacion === '10') {
    return Igv.crear()
      .agregarMonto(new Decimal(montoConIgv).sub(new Decimal(obtenerMontoSinIgv(montoConIgv, afectacion))).toFixed(2))
      .agregarCodigoTipoAfectacionIgv(afectacion)
      .agregarFactorTributo(new Decimal(EmiteApi.configuracion.porcentajeIgv!).toFixed(2));
  } else if (afectacion !== '10' && afectacion !== '20' && afectacion !== '30' && afectacion !== '40') {
    if (Number(afectacion) > 10 && Number(afectacion) < 20) {
      return Igv.crear()
        .agregarMontoGratuito(
          new Decimal(montoConIgv).sub(new Decimal(obtenerMontoSinIgv(montoConIgv, afectacion))).toFixed(2),
        )
        .agregarCodigoTipoAfectacionIgv(afectacion)
        .agregarFactorTributo(new Decimal(EmiteApi.configuracion.porcentajeIgv!).toFixed(2));
    } else {
      return Igv.crear()
        .agregarMontoGratuito(new Decimal(0.0).toFixed(2))
        .agregarCodigoTipoAfectacionIgv(afectacion)
        .agregarFactorTributo(new Decimal(EmiteApi.configuracion.porcentajeIgv!).toFixed(2));
    }
  } else {
    return Igv.crear()
      .agregarMonto(new Decimal(0.0).toFixed(2))
      .agregarCodigoTipoAfectacionIgv(afectacion)
      .agregarFactorTributo(new Decimal(EmiteApi.configuracion.porcentajeIgv!).toFixed(2));
  }
}

export function validarJson(documento: any): string[] {
  const errores: string[] = [];
  if (!documento) {
    errores.push('El documento esta vacío');
    return errores;
  }
  if (!documento.cabecera) {
    errores.push('El documento no tiene cabecera');
    return errores;
  }
  if (!documento.detalle) {
    errores.push('El documento no tiene detalles');
    return errores;
  }
  if (!documento.cabecera.tipoDocumento) {
    errores.push('Debe agregar el tipo de documento a generar');
  }
  if (
    documento.cabecera.tipoDocumento &&
    (documento.cabecera.tipoDocumento === '01' || documento.cabecera.tipoDocumento === '03') &&
    !documento.cabecera.tipoOperacion
  ) {
    errores.push('Debe agregar el tipo de operación');
  }
  if (!documento.cabecera.tipoMoneda) {
    errores.push('Debe agregar el tipo de moneda');
  }
  if (
    documento.cabecera.tipoDocumento &&
    (documento.cabecera.tipoDocumento === '01' || documento.cabecera.tipoDocumento === '03') &&
    documento.cabecera.tipoMoneda &&
    documento.cabecera.tipoMoneda !== 'PEN' &&
    !documento.cabecera.tipoCambio
  ) {
    errores.push('Debe agregar el tipo de cambio');
  }
  if (
    documento.cabecera.tipoDocumento &&
    (documento.cabecera.tipoDocumento === '07' || documento.cabecera.tipoDocumento === '08') &&
    !documento.cabecera.tipoNota
  ) {
    errores.push('Debe agregar el tipo de nota');
  }
  if (
    documento.cabecera.tipoDocumento &&
    documento.cabecera.tipoDocumento === '07' &&
    documento.cabecera.tipoNota !== '01'
  ) {
    errores.push('El tipo de nota no es válido o no se encuentra disponible');
  }
  if (documento.cabecera.tipoDocumento && documento.cabecera.tipoDocumento === '08') {
    errores.push('La nota de débito aún no no se encuentra disponible');
  }
  if (
    documento.cabecera.tipoDocumento &&
    (documento.cabecera.tipoDocumento === '07' || documento.cabecera.tipoDocumento === '08') &&
    !documento.cabecera.motivo
  ) {
    errores.push('Debe agregar el motivo o sustento de la nota');
  }
  if (
    documento.cabecera.tipoDocumento &&
    (documento.cabecera.tipoDocumento === '07' || documento.cabecera.tipoDocumento === '08') &&
    (!documento.cabecera.documentosModificados ||
      (documento.cabecera.documentosModificados && documento.cabecera.documentosModificados.length === 0))
  ) {
    errores.push('Debe agregar el documento a modificar');
  }
  if (!documento.cabecera.adquiriente) {
    errores.push('Debe agregar un cliente a la venta');
  }
  if (documento.cabecera.adquiriente && !documento.cabecera.adquiriente.tipoIdentidad) {
    errores.push('Debe agregar el tipo de documento del cliente');
  }
  if (documento.cabecera.adquiriente && !documento.cabecera.adquiriente.numeroIdentidad) {
    errores.push('Debe agregar el número de documento del cliente');
  }
  if (!documento.cabecera.adquiriente && !documento.cabecera.adquiriente.direccion) {
    errores.push('Debe agregar la dirección del adquiriente');
  }
  if (
    documento.cabecera.tipoDocumento &&
    documento.cabecera.tipoDocumento === '03' &&
    documento.cabecera.adquiriente &&
    documento.cabecera.adquiriente.tipoIdentidad &&
    documento.cabecera.adquiriente.tipoIdentidad === '6'
  ) {
    errores.push('El tipo de documento RUC es solo para facturas o notas de facturas');
  }
  if (
    documento.cabecera.tipoDocumento &&
    documento.cabecera.tipoDocumento === '01' &&
    documento.cabecera.adquiriente &&
    documento.cabecera.adquiriente.tipoIdentidad &&
    documento.cabecera.adquiriente.tipoIdentidad !== '6'
  ) {
    errores.push('Las facturas o notas de facturas deben estar dirigidas a un RUC');
  }
  if (documento.detalle.length === 0) {
    errores.push('Debe tener al menos un producto agregado a la venta');
  }
  documento.detalle.forEach((item: any, index: number) => {
    if (!item.cantidad) {
      errores.push('Producto #' + (index + 1) + ', No tiene cantidad');
    }
    if (!item.unidadMedida) {
      errores.push('Producto #' + (index + 1) + ', No tiene unidad de medida');
    }
    if (!item.descripcion) {
      errores.push('Producto #' + (index + 1) + ', No tiene descripcion');
    }
    if (!item.valorUnitario) {
      errores.push('Producto #' + (index + 1) + ', No tiene valor unitario');
    }
    if (!item.valorVenta) {
      errores.push('Producto #' + (index + 1) + ', No tiene valor de venta');
    }
    if (!item.precioVentaUnitario) {
      errores.push('Producto #' + (index + 1) + ', No tiene precio de venta unitario');
    }
    if (!item.igv) {
      errores.push('Producto #' + (index + 1) + ', No tiene IGV');
    }
    if (item.igv && !item.igv.monto) {
      errores.push('Producto #' + (index + 1) + ', No tiene monto IGV');
    }
    if (item.igv && !item.igv.codigoTipoAfectacionIgv) {
      errores.push('Producto #' + (index + 1) + ', No tiene tipo de afectación de IGV');
    }
    if (!item.importeTotal) {
      errores.push('Producto #' + (index + 1) + ', No tiene importe total');
    }
    if (
      item.igv &&
      (item.igv.codigoTipoAfectacionIgv === '10' ||
        item.igv.codigoTipoAfectacionIgv === '20' ||
        item.igv.codigoTipoAfectacionIgv === '30' ||
        item.igv.codigoTipoAfectacionIgv === '40') &&
      new Decimal(item.importeTotal ?? '0').lessThanOrEqualTo(new Decimal(0))
    ) {
      errores.push('Producto #' + (index + 1) + ', No puede costar 0.00');
    }
  });
  if (!documento.cabecera.importes) {
    errores.push('El documento no tiene importes totales');
  }
  if (!documento.cabecera.igv) {
    errores.push('El documento no tiene IGV');
  }
  if (
    documento.cabecera.importes &&
    documento.cabecera.igv &&
    new Decimal(documento.cabecera.importes.importeTotal ?? '0').lessThanOrEqualTo(new Decimal(0)) &&
    new Decimal(documento.cabecera.operacionGratuita ?? '0').lessThanOrEqualTo(new Decimal(0)) &&
    new Decimal(documento.cabecera.igv.montoGratuito ?? '0').lessThanOrEqualTo(new Decimal(0))
  ) {
    errores.push('La venta no puede ser menor o igual a 0.00');
  }
  if (
    documento.cabecera.tipoDocumento &&
    documento.cabecera.tipoDocumento === '03' &&
    documento.cabecera.adquiriente &&
    documento.cabecera.adquiriente.tipoIdentidad === '0' &&
    documento.cabecera.importes &&
    new Decimal(documento.cabecera.importes.importeTotal ?? '0').greaterThanOrEqualTo(
      new Decimal(EmiteApi.configuracion.montoMinimoBoleta!),
    )
  ) {
    errores.push('Boletas de 700 S/ o mas no pueden ir a Público General');
  }
  return errores;
}
