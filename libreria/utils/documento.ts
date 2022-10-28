import { Decimal } from 'decimal.js';
import { numeroALetras } from './monto-letras';
import EmiteApi from '../../emite-api';
import {
  validarNumero,
  obtenerIgv,
  obtenerMontoSinIgv,
  obtenerPorcentajeDetraccion,
  obtenerValorPorcentaje,
  obterMontoConIgv,
} from './funciones';
import { Generar } from './generar';
import { ApiError, CodigoDetraccion, CodigoTipoAfectacionIgv } from './types';
import OpcionesPredeterminadas from '../opciones/predeterminados';

export class Documento {
  private _cabecera?: Cabecera;
  public get cabecera(): Cabecera | undefined {
    return this._cabecera;
  }
  public agregarCabecera(cabecera: Cabecera): Documento {
    this._cabecera = cabecera;
    return this;
  }

  private _detalle: Detalle[] = [];
  public get detalle(): Detalle[] {
    return this._detalle;
  }
  public agregarDetalle(detalle: Detalle): Documento {
    this._detalle.push(detalle);
    return this;
  }

  public build(): Documento {
    this.detalle.forEach((item: Detalle, index) => {
      item.agregarOrden(index + 1);
      item.build();
    });
    this.cabecera?.build(this.detalle);

    return this;
  }

  public validar(): string[] {
    const errores: string[] = [];
    if (!this.cabecera?.tipoDocumento) {
      errores.push('Debe agregar el tipo de documento a generar');
    }
    if (
      (this.cabecera?.tipoDocumento === '01' || this.cabecera?.tipoDocumento === '03') &&
      !this.cabecera?.tipoOperacion
    ) {
      errores.push('Debe agregar el tipo de operación');
    }
    if (!this.cabecera?.tipoMoneda) {
      errores.push('Debe agregar el tipo de moneda');
    }
    if (
      (this.cabecera?.tipoDocumento === '01' || this.cabecera?.tipoDocumento === '03') &&
      this.cabecera?.tipoMoneda !== 'PEN' &&
      !this.cabecera?.tipoCambio
    ) {
      errores.push('Debe agregar el tipo de cambio');
    }
    if ((this.cabecera?.tipoDocumento === '07' || this.cabecera?.tipoDocumento === '08') && !this.cabecera?.tipoNota) {
      errores.push('Debe agregar el tipo de nota');
    }
    if (this.cabecera?.tipoDocumento === '07' && this.cabecera?.tipoNota !== '01') {
      errores.push('El tipo de nota no es válido o no se encuentra disponible');
    }
    if (this.cabecera?.tipoDocumento === '08') {
      errores.push('La nota de débito aún no no se encuentra disponible');
    }
    if ((this.cabecera?.tipoDocumento === '07' || this.cabecera?.tipoDocumento === '08') && !this.cabecera?.motivo) {
      errores.push('Debe agregar el motivo o sustento de la nota');
    }
    if (
      (this.cabecera?.tipoDocumento === '07' || this.cabecera?.tipoDocumento === '08') &&
      this.cabecera?.documentosModificados?.length === 0
    ) {
      errores.push('Debe agregar el documento a modificar');
    }
    if (!this.cabecera?.adquiriente) {
      errores.push('Debe agregar un cliente a la venta');
    }
    if (!this.cabecera?.adquiriente?.tipoIdentidad) {
      errores.push('Debe agregar el tipo de documento del cliente');
    }
    if (!this.cabecera?.adquiriente?.numeroIdentidad) {
      errores.push('Debe agregar el número de documento del cliente');
    }
    if (this.cabecera?.tipoDocumento === '03' && this.cabecera?.adquiriente?.tipoIdentidad === '6') {
      errores.push('El tipo de documento RUC es solo para facturas');
    }
    if (this.cabecera?.tipoDocumento === '01' && this.cabecera?.adquiriente?.tipoIdentidad !== '6') {
      errores.push('Las facturas deben estar dirigidas a un RUC');
    }
    if (this.detalle.length === 0) {
      errores.push('Debe tener al menos un producto agregado a la venta');
    }
    this.detalle.forEach((item: Detalle, index: number) => {
      if (
        (item.igv?.codigoTipoAfectacionIgv === '10' ||
          item.igv?.codigoTipoAfectacionIgv === '20' ||
          item.igv?.codigoTipoAfectacionIgv === '30' ||
          item.igv?.codigoTipoAfectacionIgv === '40') &&
        new Decimal(item.importeTotal ?? '0').lessThanOrEqualTo(new Decimal(0))
      ) {
        errores.push('Producto #' + (index + 1) + ', No puede costar 0.00');
      }
    });
    if (
      new Decimal(this.cabecera?.importes?.importeTotal ?? '0').lessThanOrEqualTo(new Decimal(0)) &&
      new Decimal(this.cabecera?.operacionGratuita ?? '0').lessThanOrEqualTo(new Decimal(0)) &&
      new Decimal(this.cabecera?.igv?.montoGratuito ?? '0').lessThanOrEqualTo(new Decimal(0))
    ) {
      errores.push('La venta no puede ser menor o igual a 0.00');
    }
    if (
      this.cabecera?.tipoDocumento === '03' &&
      this.cabecera?.adquiriente?.tipoIdentidad === '0' &&
      new Decimal(this.cabecera?.importes?.importeTotal ?? '0').greaterThanOrEqualTo(
        new Decimal(EmiteApi.configuracion.montoMinimoBoleta!),
      )
    ) {
      errores.push('Boletas de 700 S/ o mas no pueden ir a Público General');
    }
    return errores;
  }

  public static crear(): Documento {
    return new Documento();
  }

  public toJSON() {
    return {
      cabecera: this.cabecera,
      detalle: this.detalle,
    };
  }

  public async generar(): Promise<any> {
    const errores: string[] = [];
    if (!EmiteApi.configuracion.emiteKey) {
      errores.push('No tiene configurado el EMITE_KEY');
    }
    errores.push(...this.validar());
    if (errores.length > 0) {
      throw new ApiError(400, errores);
    }
    const servicio = new Generar();
    return servicio.generar(this);
  }
}

class Direccion {
  private _ubigeo?: string;
  public get ubigeo(): string | undefined {
    return this._ubigeo;
  }
  public agregarUbigeo(ubigeo?: string): Direccion {
    this._ubigeo = ubigeo;
    return this;
  }

  private _descripcion?: string;
  public get descripcion(): string | undefined {
    return this._descripcion;
  }
  public agregarDescripcion(descripcion?: string): Direccion {
    this._descripcion = descripcion;
    return this;
  }

  private _urbanizacion?: string;
  public get urbanizacion(): string | undefined {
    return this._urbanizacion;
  }
  public agregarUrbanizacion(urbanizacion?: string): Direccion {
    this._urbanizacion = urbanizacion;
    return this;
  }

  private _provincia?: string;
  public get provincia(): string | undefined {
    return this._provincia;
  }
  public agregarProvincia(provincia?: string): Direccion {
    this._provincia = provincia;
    return this;
  }

  private _departamento?: string;
  public get departamento(): string | undefined {
    return this._departamento;
  }
  public agregarDepartamento(departamento?: string): Direccion {
    this._departamento = departamento;
    return this;
  }

  private _distrito?: string;
  public get distrito(): string | undefined {
    return this._distrito;
  }
  public agregarDistrito(distrito?: string): Direccion {
    this._distrito = distrito;
    return this;
  }

  private _codigoPais?: string;
  public get codigoPais(): string | undefined {
    return this._codigoPais;
  }
  public agregarCodigoPais(codigoPais?: string): Direccion {
    this._codigoPais = codigoPais;
    return this;
  }

  public static crear(): Direccion {
    return new Direccion();
  }

  public toJSON() {
    return {
      ubigeo: this._ubigeo,
      descripcion: this._descripcion,
      urbanizacion: this._urbanizacion,
      provincia: this._provincia,
      departamento: this._departamento,
      distrito: this._distrito,
      codigoPais: this._codigoPais,
    };
  }
}

export class Adquiriente {
  private _id?: string;
  public get id(): string | undefined {
    return this._id;
  }
  public agregarId(id: string): Adquiriente {
    this._id = id;
    return this;
  }

  private _numeroIdentidad?: string;
  public get numeroIdentidad(): string | undefined {
    return this._numeroIdentidad;
  }
  public agregarNumeroIdentidad(numeroIdentidad: string): Adquiriente {
    this._numeroIdentidad = numeroIdentidad;
    return this;
  }

  private _tipoIdentidad?: string;
  public get tipoIdentidad(): string | undefined {
    return this._tipoIdentidad;
  }
  public agregarTipoIdentidad(tipoIdentidad: '0' | '1' | '4' | '6' | '7' | 'A'): Adquiriente {
    this._tipoIdentidad = tipoIdentidad;
    return this;
  }

  private _nombre?: string;
  public get nombre(): string | undefined {
    return this._nombre;
  }
  public agregarNombre(nombre: string): Adquiriente {
    this._nombre = nombre;
    return this;
  }

  private _nombreComercial?: string;
  public get nombreComercial(): string | undefined {
    return this._nombreComercial;
  }
  public agregarNombreComercial(nombreComercial?: string): Adquiriente {
    this._nombreComercial = nombreComercial;
    return this;
  }

  private _placaVehiculo?: string;
  public get placaVehiculo(): string | undefined {
    return this._placaVehiculo;
  }
  public agregarPlacaVehiculo(placaVehiculo?: string): Adquiriente {
    this._placaVehiculo = placaVehiculo;
    return this;
  }

  private _email?: string;
  public get email(): string | undefined {
    return this._email;
  }
  public agregarEmail(email?: string): Adquiriente {
    this._email = email;
    return this;
  }

  private _direccion?: Direccion;
  public get direccion(): Direccion | undefined {
    return this._direccion;
  }
  private agregarObjetoDireccion(direccion?: Direccion): Adquiriente {
    this._direccion = direccion;
    return this;
  }

  public static crear(): Adquiriente {
    return new Adquiriente();
  }

  public toJSON() {
    return {
      id: this._id,
      numeroIdentidad: this._numeroIdentidad,
      tipoIdentidad: this._tipoIdentidad,
      nombre: this._nombre,
      nombreComercial: this._nombreComercial,
      placaVehiculo: this._placaVehiculo,
      email: this._email,
      direccion: this.direccion,
    };
  }

  public agregarDireccion(direccion?: string): Adquiriente {
    if (!this._direccion) {
      this.agregarObjetoDireccion(Direccion.crear());
    }
    this._direccion?.agregarDescripcion(direccion);
    return this;
  }

  public agregarUbigeo(ubigeo?: string): Adquiriente {
    if (!this._direccion) {
      this.agregarObjetoDireccion(Direccion.crear());
    }
    this._direccion?.agregarUbigeo(ubigeo);
    return this;
  }

  public agregarUrbanizacion(urbanizacion?: string): Adquiriente {
    if (!this._direccion) {
      this.agregarObjetoDireccion(Direccion.crear());
    }
    this._direccion?.agregarUrbanizacion(urbanizacion);
    return this;
  }

  public agregarProvincia(provincia?: string): Adquiriente {
    if (!this._direccion) {
      this.agregarObjetoDireccion(Direccion.crear());
    }
    this._direccion?.agregarProvincia(provincia);
    return this;
  }

  public agregarDepartamento(departamento?: string): Adquiriente {
    if (!this._direccion) {
      this.agregarObjetoDireccion(Direccion.crear());
    }
    this._direccion?.agregarDepartamento(departamento);
    return this;
  }

  public agregarDistrito(distrito?: string): Adquiriente {
    if (!this._direccion) {
      this.agregarObjetoDireccion(Direccion.crear());
    }
    this._direccion?.agregarDistrito(distrito);
    return this;
  }

  public agregarCodigoPais(codigoPais?: string): Adquiriente {
    if (!this._direccion) {
      this.agregarObjetoDireccion(Direccion.crear());
    }
    this._direccion?.agregarCodigoPais(codigoPais);
    return this;
  }
}

class DetraccionTransporte {
  private _valorReferencial?: string;
  public get valorReferencial(): string | undefined {
    return this._valorReferencial;
  }
  public agregarValorReferencial(valorReferencial?: string): DetraccionTransporte {
    this._valorReferencial = new Decimal(validarNumero(valorReferencial)).toFixed(2);
    return this;
  }

  private _valorReferencialCargaEfectiva?: string;
  public get valorReferencialCargaEfectiva(): string | undefined {
    return this._valorReferencialCargaEfectiva;
  }
  public agregarValorReferencialCargaEfectiva(valorReferencialCargaEfectiva?: string): DetraccionTransporte {
    this._valorReferencialCargaEfectiva = new Decimal(validarNumero(valorReferencialCargaEfectiva)).toFixed(2);
    return this;
  }

  private _valorReferencialCargaUtil?: string;
  public get valorReferencialCargaUtil(): string | undefined {
    return this._valorReferencialCargaUtil;
  }
  public agregarValorReferencialCargaUtil(valorReferencialCargaUtil?: string): DetraccionTransporte {
    this._valorReferencialCargaUtil = new Decimal(validarNumero(valorReferencialCargaUtil)).toFixed(2);
    return this;
  }

  private _ubigeoOrigen?: string; // codigo ubigeo 6 caracteres
  public get ubigeoOrigen(): string | undefined {
    return this._ubigeoOrigen;
  }
  public agregarUbigeoOrigen(ubigeoOrigen?: string): DetraccionTransporte {
    this._ubigeoOrigen = ubigeoOrigen;
    return this;
  }

  private _puntoOrigen?: string;
  public get puntoOrigen(): string | undefined {
    return this._puntoOrigen;
  }
  public agregarPuntoOrigen(puntoOrigen?: string): DetraccionTransporte {
    this._puntoOrigen = puntoOrigen;
    return this;
  }

  private _ubigeoDestino?: string; // codigo ubigeo 6 caracteres
  public get ubigeoDestino(): string | undefined {
    return this._ubigeoDestino;
  }
  public agregarUbigeoDestino(ubigeoDestino?: string): DetraccionTransporte {
    this._ubigeoDestino = ubigeoDestino;
    return this;
  }

  private _puntoDestino?: string;
  public get puntoDestino(): string | undefined {
    return this._puntoDestino;
  }
  public agregarPuntoDestino(puntoDestino?: string): DetraccionTransporte {
    this._puntoDestino = puntoDestino;
    return this;
  }

  private _tramoViaje?: string;
  public get tramoViaje(): string | undefined {
    return this._tramoViaje;
  }
  public agregarTramoViaje(tramoViaje?: string): DetraccionTransporte {
    this._tramoViaje = tramoViaje;
    return this;
  }

  public static crear(): DetraccionTransporte {
    return new DetraccionTransporte();
  }

  public toJSON() {
    return {
      valorReferencial: this._valorReferencial,
      valorReferencialCargaEfectiva: this._valorReferencialCargaEfectiva,
      valorReferencialCargaUtil: this._valorReferencialCargaUtil,
      ubigeoOrigen: this._ubigeoOrigen,
      puntoOrigen: this._puntoOrigen,
      ubigeoDestino: this._ubigeoDestino,
      puntoDestino: this._puntoDestino,
      tramoViaje: this._tramoViaje,
    };
  }
}

export class Detraccion {
  private _codigo?: string;
  public get codigo(): string | undefined {
    return this._codigo;
  }
  public agregarCodigo(codigo?: string): Detraccion {
    this._codigo = codigo;
    return this;
  }

  private _porcentaje?: string;
  public get porcentaje(): string | undefined {
    return this._porcentaje;
  }
  public agregarPorcentaje(porcentaje?: string): Detraccion {
    this._porcentaje = porcentaje;
    return this;
  }

  private _cuenta?: string;
  public get cuenta(): string | undefined {
    return this._cuenta;
  }
  public agregarCuenta(cuenta?: string): Detraccion {
    this._cuenta = cuenta;
    return this;
  }

  private _monto?: string;
  public get monto(): string | undefined {
    return this._monto;
  }
  public agregarMonto(monto?: string): Detraccion {
    this._monto = monto;
    return this;
  }

  private _tipoMoneda?: string;
  public get tipoMoneda(): string | undefined {
    return this._tipoMoneda;
  }
  public agregarTipoMoneda(tipoMoneda?: string): Detraccion {
    this._tipoMoneda = tipoMoneda;
    return this;
  }

  private _transporte?: DetraccionTransporte;
  public get transporte(): DetraccionTransporte | undefined {
    return this._transporte;
  }
  public agregarTransporte(transporte?: DetraccionTransporte): Detraccion {
    this._transporte = transporte;
    return this;
  }

  public static crear(): Detraccion {
    return new Detraccion();
  }

  public toJSON() {
    return {
      codigo: this._codigo,
      cuenta: this._cuenta,
      porcentaje: this._porcentaje,
      monto: this._monto,
      tipoMoneda: this._tipoMoneda,
      transporte: this.transporte,
    };
  }
}

export class RetencionIgv {
  private _monto?: string;
  public get monto(): string | undefined {
    return this._monto;
  }
  public agregarMonto(monto?: string): RetencionIgv {
    this._monto = monto;
    return this;
  }

  private _porcentaje?: string;
  public get porcentaje(): string | undefined {
    return this._porcentaje;
  }
  public agregarPorcentaje(porcentaje?: string): RetencionIgv {
    this._porcentaje = porcentaje;
    return this;
  }

  public static crear(): RetencionIgv {
    return new RetencionIgv();
  }

  public toJSON() {
    return {
      monto: this._monto,
      porcentaje: this._porcentaje,
    };
  }
}

export class Huesped {
  private _tipoDocumento?: string;
  public get tipoDocumento(): string | undefined {
    return this._tipoDocumento;
  }
  public agregarTipoDocumento(tipoDocumento?: string): Huesped {
    this._tipoDocumento = tipoDocumento;
    return this;
  }

  private _numeroDocumento?: string;
  public get numeroDocumento(): string | undefined {
    return this._numeroDocumento;
  }
  public agregarNumeroDocumento(numeroDocumento?: string): Huesped {
    this._numeroDocumento = numeroDocumento;
    return this;
  }

  private _nombres?: string;
  public get nombres(): string | undefined {
    return this._nombres;
  }
  public agregarNombres(nombres?: string): Huesped {
    this._nombres = nombres;
    return this;
  }

  private _paisEmisionPasaporte?: string;
  public get paisEmisionPasaporte(): string | undefined {
    return this._paisEmisionPasaporte;
  }
  public agregarPaisEmisionPasaporte(paisEmisionPasaporte?: string): Huesped {
    this._paisEmisionPasaporte = paisEmisionPasaporte;
    return this;
  }

  private _paisResidencia?: string;
  public get paisResidencia(): string | undefined {
    return this._paisResidencia;
  }
  public agregarPaisResidencia(paisResidencia?: string): Huesped {
    this._paisResidencia = paisResidencia;
    return this;
  }

  private _fechaArrivo?: string; // YYYY-MM-DD
  public get fechaArrivo(): string | undefined {
    return this._fechaArrivo;
  }
  public agregarFechaArrivo(fechaArrivo?: string): Huesped {
    this._fechaArrivo = fechaArrivo;
    return this;
  }

  private _fechaIngreso?: string; // YYYY-MM-DD
  public get fechaIngreso(): string | undefined {
    return this._fechaIngreso;
  }
  public agregarFechaIngreso(fechaIngreso?: string): Huesped {
    this._fechaIngreso = fechaIngreso;
    return this;
  }

  private _fechaSalida?: string; // YYYY-MM-DD
  public get fechaSalida(): string | undefined {
    return this._fechaSalida;
  }
  public agregarFechaSalida(fechaSalida?: string): Huesped {
    this._fechaSalida = fechaSalida;
    return this;
  }

  private _fechaConsumo?: string; // YYYY-MM-DD
  public get fechaConsumo(): string | undefined {
    return this._fechaConsumo;
  }
  public agregarFechaConsumo(fechaConsumo?: string): Huesped {
    this._fechaConsumo = fechaConsumo;
    return this;
  }

  public static crear(): Huesped {
    return new Huesped();
  }

  public toJSON() {
    return {
      tipoDocumento: this._tipoDocumento,
      numeroDocumento: this._numeroDocumento,
      nombres: this._nombres,
      paisEmisionPasaporte: this._paisEmisionPasaporte,
      paisResidencia: this._paisResidencia,
      fechaArrivo: this._fechaArrivo,
      fechaIngreso: this._fechaIngreso,
      fechaSalida: this._fechaSalida,
      fechaConsumo: this._fechaConsumo,
    };
  }
}

export class Igv {
  private _monto?: string;
  public get monto(): string | undefined {
    return this._monto;
  }
  public agregarMonto(monto?: string): Igv {
    this._monto = monto;
    return this;
  }

  private _montoGratuito?: string;
  public get montoGratuito(): string | undefined {
    return this._montoGratuito;
  }
  public agregarMontoGratuito(montoGratuito?: string): Igv {
    this._montoGratuito = montoGratuito;
    return this;
  }

  private _codigoTipoAfectacionIgv?: string;
  public get codigoTipoAfectacionIgv(): string | undefined {
    return this._codigoTipoAfectacionIgv;
  }
  public agregarCodigoTipoAfectacionIgv(codigoTipoAfectacionIgv?: string): Igv {
    this._codigoTipoAfectacionIgv = codigoTipoAfectacionIgv;
    return this;
  }

  private _factorTributo?: string;
  public get factorTributo(): string | undefined {
    return this._factorTributo;
  }
  public agregarFactorTributo(factorTributo?: string): Igv {
    this._factorTributo = factorTributo;
    return this;
  }

  public static crear(): Igv {
    return new Igv();
  }

  public toJSON() {
    return {
      monto: this._monto,
      montoGratuito: this._montoGratuito,
      codigoTipoAfectacionIgv: this._codigoTipoAfectacionIgv,
      factorTributo: this._factorTributo,
    };
  }
}

class Importes {
  private _totalDescuentoNAB?: string;
  public get totalDescuentoNAB(): string | undefined {
    return this._totalDescuentoNAB;
  }
  public agregarTotalDescuentoNAB(totalDescuentoNAB?: string): Importes {
    this._totalDescuentoNAB = totalDescuentoNAB;
    return this;
  }

  private _valorAnticipado?: string;
  public get valorAnticipado(): string | undefined {
    return this._valorAnticipado;
  }
  public agregarValorAnticipado(valorAnticipado?: string): Importes {
    this._valorAnticipado = valorAnticipado;
    return this;
  }

  private _importeTotal?: string;
  public get importeTotal(): string | undefined {
    return this._importeTotal;
  }
  public agregarImporteTotal(importeTotal?: string): Importes {
    this._importeTotal = importeTotal;
    return this;
  }

  private _otrosCargos?: string;
  public get otrosCargos(): string | undefined {
    return this._otrosCargos;
  }
  public agregarOtrosCargos(otrosCargos?: string): Importes {
    this._otrosCargos = otrosCargos;
    return this;
  }

  private _cargoGlobalNAB?: string;
  public get cargoGlobalNAB(): string | undefined {
    return this._cargoGlobalNAB;
  }
  public agregarCargoGlobalNAB(cargoGlobalNAB?: string): Importes {
    this._cargoGlobalNAB = cargoGlobalNAB;
    return this;
  }

  public static crear(): Importes {
    return new Importes();
  }

  public toJSON() {
    return {
      totalDescuentoNAB: this._totalDescuentoNAB,
      valorAnticipado: this._valorAnticipado,
      importeTotal: this._importeTotal,
      otrosCargos: this._otrosCargos,
      cargoGlobalNAB: this._cargoGlobalNAB,
    };
  }
}

class Icbper {
  private _monto?: string;
  public get monto(): string | undefined {
    return this._monto;
  }
  public agregarMonto(monto?: string): Icbper {
    this._monto = monto;
    return this;
  }

  private _cantidad?: string;
  public get cantidad(): string | undefined {
    return this._cantidad;
  }
  public agregarCantidad(cantidad?: string): Icbper {
    this._cantidad = cantidad;
    return this;
  }

  public static crear(): Icbper {
    return new Icbper();
  }

  public toJSON() {
    return {
      monto: this._monto,
      cantidad: this._cantidad,
    };
  }
}

class Isc {
  monto?: string;
  codigoTipoSistemaIsc?: string;
}

class OtrosTributos {
  monto?: string;
}

export class GuiaRemision {
  private _numero?: string;
  public get numero(): string | undefined {
    return this._numero;
  }

  public agregarNumero(numero: string): GuiaRemision {
    this._numero = numero;
    return this;
  }

  private _tipo?: string;
  public get tipo(): string | undefined {
    return this._tipo;
  }

  public agregarTipo(tipo: '09' | '31' | '71' | '72'): GuiaRemision {
    this._tipo = tipo;
    return this;
  }

  public static crear(): GuiaRemision {
    return new GuiaRemision();
  }

  public toJSON() {
    return {
      numero: this._numero,
      tipo: this._tipo,
    };
  }
}

class FormaPago {
  private _tipo?: string;
  public get tipo(): string | undefined {
    return this._tipo;
  }

  public agregarTipo(tipo: '1' | '2'): FormaPago {
    this._tipo = tipo;
    return this;
  }

  private _monto?: string;
  public get monto(): string | undefined {
    return this._monto;
  }

  public agregarMonto(monto: string): FormaPago {
    this._monto = monto;
    return this;
  }

  public static crear(): FormaPago {
    return new FormaPago();
  }

  public toJSON() {
    return {
      tipo: this._tipo,
      monto: this._monto,
    };
  }
}

export class Cuota {
  private _monto?: string;
  public get monto(): string | undefined {
    return this._monto;
  }

  public agregarMonto(monto: string): Cuota {
    this._monto = monto;
    return this;
  }

  private _fechaVencimiento?: string; // YYYY-MM-DD
  public get fechaVencimiento(): string | undefined {
    return this._fechaVencimiento;
  }

  public agregarFechaVencimiento(fechaVencimiento: string): Cuota {
    this._fechaVencimiento = fechaVencimiento;
    return this;
  }

  public static crear(): Cuota {
    return new Cuota();
  }

  public toJSON() {
    return {
      monto: this._monto,
      fechaVencimiento: this._fechaVencimiento,
    };
  }
}

export class Adicional {
  private _codigo?: string;
  public get codigo(): string | undefined {
    return this._codigo;
  }
  public agregarCodigo(codigo: string): Adicional {
    this._codigo = codigo;
    return this;
  }

  private _valor?: string;
  public get valor(): string | undefined {
    return this._valor;
  }
  public agregarValor(valor: string): Adicional {
    this._valor = valor;
    return this;
  }

  public static crear(): Adicional {
    return new Adicional();
  }

  public toJSON() {
    return {
      codigo: this._codigo,
      valor: this._valor,
    };
  }
}

// Para notas de crédito
export class DocumentoModificado {
  private _numero?: string;
  public get numero(): string | undefined {
    return this._numero;
  }
  public agregarNumero(numero: string): DocumentoModificado {
    this._numero = numero;
    return this;
  }

  private _tipo?: '01' | '03' | undefined;
  public get tipo(): string | undefined {
    return this._tipo;
  }
  public agregarTipo(tipo: '01' | '03'): DocumentoModificado {
    this._tipo = tipo;
    return this;
  }

  public static crear(): DocumentoModificado {
    return new DocumentoModificado();
  }

  public toJSON() {
    return {
      numero: this._numero,
      tipo: this._tipo,
    };
  }
}
// Para notas de crédito

export class Cabecera {
  private _tipoDocumento?: string;
  public get tipoDocumento(): string | undefined {
    return this._tipoDocumento;
  }
  public agregarTipoDocumento(tipoDocumento: '01' | '03' | '07' | '08'): Cabecera {
    this._tipoDocumento = tipoDocumento;
    return this;
  }

  private _codigoEstablecimiento?: string;
  public get codigoEstablecimiento(): string | undefined {
    return this._codigoEstablecimiento;
  }
  public agregarCodigoEstablecimiento(codigoEstablecimiento: string): Cabecera {
    this._codigoEstablecimiento = codigoEstablecimiento;
    return this;
  }

  private _serie?: string;
  public get serie(): string | undefined {
    return this._serie;
  }
  public agregarSerie(serie: string): Cabecera {
    this._serie = serie;
    return this;
  }

  private _correlativo?: number;
  public get correlativo(): number | undefined {
    return this._correlativo;
  }
  public agregarCorrelativo(correlativo: number): Cabecera {
    this._correlativo = correlativo;
    return this;
  }

  private _fechaEmision?: string; // YYYY-MM-DD
  public get fechaEmision(): string | undefined {
    return this._fechaEmision;
  }
  public agregarFechaEmision(fechaEmision: string): Cabecera {
    this._fechaEmision = fechaEmision;
    return this;
  }

  private _horaEmision?: string; // HH:MM:SS
  public get horaEmision(): string | undefined {
    return this._horaEmision;
  }
  public agregarHoraEmision(horaEmision: string): Cabecera {
    this._horaEmision = horaEmision;
    return this;
  }

  // todo Opcional porque con las cuotas esto ya no vale (se deja ŕivado para revision)
  private _fechaVencimiento?: string;
  public get fechaVencimiento(): string | undefined {
    return this._fechaVencimiento;
  }
  private agregarFechaVencimiento(fechaVencimiento: string): Cabecera {
    this._fechaVencimiento = fechaVencimiento;
    return this;
  }

  private _tipoMoneda?: string;
  public get tipoMoneda(): string | undefined {
    return this._tipoMoneda;
  }
  private _simboloMoneda?: string;
  public get simboloMoneda(): string | undefined {
    return this._simboloMoneda;
  }
  public agregarTipoMoneda(tipoMoneda: 'PEN' | 'USD' | 'EUR'): Cabecera {
    this._tipoMoneda = tipoMoneda;
    if (tipoMoneda === 'USD') {
      this._simboloMoneda = '$';
    } else if (tipoMoneda === 'EUR') {
      this._simboloMoneda = '€';
    } else {
      this._simboloMoneda = 'S/';
    }
    return this;
  }

  private _tipoCambio?: string;
  public get tipoCambio(): string | undefined {
    return this._tipoCambio;
  }
  public agregarTipoCambio(tipoCambio: string): Cabecera {
    this._tipoCambio = tipoCambio;
    return this;
  }

  private _numeroOrden?: string;
  public get numeroOrden(): string | undefined {
    return this._numeroOrden;
  }
  public agregarNumeroOrden(numeroOrden: string): Cabecera {
    this._numeroOrden = numeroOrden;
    return this;
  }

  private _tipoOperacion?: string;
  public get tipoOperacion(): string | undefined {
    return this._tipoOperacion;
  }
  public agregarTipoOperacion(tipoOperacion: string): Cabecera {
    this._tipoOperacion = tipoOperacion;
    return this;
  }

  private _subTipoOperacion?: string;
  public get subTipoOperacion(): string | undefined {
    return this._subTipoOperacion;
  }
  public agregarSubTipoOperacion(subTipoOperacion: string): Cabecera {
    this._subTipoOperacion = subTipoOperacion;
    return this;
  }

  private _adquiriente?: Adquiriente;
  public get adquiriente(): Adquiriente | undefined {
    return this._adquiriente;
  }
  public agregarAdquiriente(adquiriente: Adquiriente): Cabecera {
    this._adquiriente = adquiriente;
    return this;
  }

  private _igv?: Igv;
  public get igv(): Igv | undefined {
    return this._igv;
  }
  private agregarIgv(igv: Igv): Cabecera {
    this._igv = igv;
    return this;
  }

  private _isc?: Isc;
  public get isc(): Isc | undefined {
    return this._isc;
  }
  private agregarIsc(isc: Isc): Cabecera {
    this._isc = isc;
    return this;
  }

  private _otrosTributos?: OtrosTributos;
  public get otrosTributos(): OtrosTributos | undefined {
    return this._otrosTributos;
  }
  private agregarOtrosTributos(otrosTributos: OtrosTributos): Cabecera {
    this._otrosTributos = otrosTributos;
    return this;
  }

  private _importes?: Importes;
  public get importes(): Importes | undefined {
    return this._importes;
  }
  private agregarImportes(importes: Importes): Cabecera {
    this._importes = importes;
    return this;
  }

  private _montoEnLetras?: string;
  public get montoEnLetras(): string | undefined {
    return this._montoEnLetras;
  }
  private agregarMontoEnLetras(montoEnLetras: string): Cabecera {
    this._montoEnLetras = montoEnLetras;
    return this;
  }

  private _guiasRemision: GuiaRemision[] = [];
  public get guiasRemision(): GuiaRemision[] {
    return this._guiasRemision;
  }
  public agregarGuiasRemision(guiaRemision: GuiaRemision): Cabecera {
    this._guiasRemision.push(guiaRemision);
    return this;
  }

  private _huesped?: Huesped;
  public get huesped(): Huesped | undefined {
    return this._huesped;
  }
  public agregarHuesped(huesped: Huesped): Cabecera {
    this._huesped = huesped;
    return this;
  }

  private _operacionGravada?: string;
  public get operacionGravada(): string | undefined {
    return this._operacionGravada;
  }
  private agregarOperacionGravada(operacionGravada: string): Cabecera {
    this._operacionGravada = operacionGravada;
    return this;
  }

  private _operacionInafecta?: string;
  public get operacionInafecta(): string | undefined {
    return this._operacionInafecta;
  }
  private agregarOperacionInafecta(operacionInafecta: string): Cabecera {
    this._operacionInafecta = operacionInafecta;
    return this;
  }

  private _operacionExonerada?: string;
  public get operacionExonerada(): string | undefined {
    return this._operacionExonerada;
  }
  private agregarOperacionExonerada(operacionExonerada: string): Cabecera {
    this._operacionExonerada = operacionExonerada;
    return this;
  }

  private _operacionGratuita?: string;
  public get operacionGratuita(): string | undefined {
    return this._operacionGratuita;
  }
  private agregarOperacionGratuita(operacionGratuita: string): Cabecera {
    this._operacionGratuita = operacionGratuita;
    return this;
  }

  private _operacionExportacion?: string;
  public get operacionExportacion(): string | undefined {
    return this._operacionExportacion;
  }
  private agregarOperacionExportacion(operacionExportacion: string): Cabecera {
    this._operacionExportacion = operacionExportacion;
    return this;
  }

  private _descuentoGlobal?: string;
  public get descuentoGlobal(): string | undefined {
    return this._descuentoGlobal;
  }
  private agregarDescuentoGlobal(descuentoGlobal: string): Cabecera {
    this._descuentoGlobal = descuentoGlobal;
    return this;
  }

  private _descuentoABaseImponible?: string;
  public get descuentoABaseImponible(): string | undefined {
    return this._descuentoABaseImponible;
  }
  public agregarDescuentoABaseImponible(descuentoABaseImponible: string): Cabecera {
    this._descuentoABaseImponible = validarNumero(descuentoABaseImponible);
    return this;
  }

  private _descuentoGlobalNAB?: string;
  public get descuentoGlobalNAB(): string | undefined {
    return this._descuentoGlobalNAB;
  }
  private agregarDescuentoGlobalNAB(descuentoGlobalNAB: string): Cabecera {
    this._descuentoGlobalNAB = descuentoGlobalNAB;
    return this;
  }

  private _descuentoAImporteTotal?: string;
  public get descuentoAImporteTotal(): string | undefined {
    return this._descuentoAImporteTotal;
  }
  public agregarDescuentoAImporteTotal(descuentoAImporteTotal: string): Cabecera {
    this._descuentoAImporteTotal = validarNumero(descuentoAImporteTotal);
    return this;
  }

  private _cargoABaseImponible?: string;
  public get cargoABaseImponible(): string | undefined {
    return this._cargoABaseImponible;
  }
  public agregarCargoABaseImponible(cargoABaseImponible: string): Cabecera {
    this._cargoABaseImponible = validarNumero(cargoABaseImponible);
    return this;
  }

  private _cargoAImporteTotal?: string;
  public get cargoAImporteTotal(): string | undefined {
    return this._cargoAImporteTotal;
  }
  public agregarCargoAImporteTotal(cargoAImporteTotal: string): Cabecera {
    this._cargoAImporteTotal = validarNumero(cargoAImporteTotal);
    return this;
  }

  private _detraccion?: Detraccion;
  public get detraccion(): Detraccion | undefined {
    return this._detraccion;
  }
  private agregarDetraccion(detraccion: Detraccion): Cabecera {
    this._detraccion = detraccion;
    return this;
  }

  private _codigoDetraccion?: string;
  public agregarCodigoDetraccion(codigoDetraccion?: CodigoDetraccion): Cabecera {
    this._codigoDetraccion = codigoDetraccion;
    return this;
  }

  private _porcentajeDetraccion?: string;
  public agregarPorcentajeDetraccion(porcentajeDetraccion?: string): Cabecera {
    this._porcentajeDetraccion = validarNumero(porcentajeDetraccion);
    return this;
  }

  private _valorReferencialDetraccion?: string;
  public agregarValorReferencialDetraccion(valorReferencialDetraccion?: string): Cabecera {
    this._valorReferencialDetraccion = validarNumero(valorReferencialDetraccion);
    return this;
  }

  private _valorReferencialCargaEfectivaDetraccion?: string;
  public agregarValorReferencialCargaEfectivaDetraccion(valorReferencialCargaEfectivaDetraccion?: string): Cabecera {
    this._valorReferencialCargaEfectivaDetraccion = validarNumero(valorReferencialCargaEfectivaDetraccion);
    return this;
  }

  private _valorReferencialCargaUtilDetraccion?: string;
  public agregarValorReferencialCargaUtilDetraccion(valorReferencialCargaUtilDetraccion?: string): Cabecera {
    this._valorReferencialCargaUtilDetraccion = validarNumero(valorReferencialCargaUtilDetraccion);
    return this;
  }

  private _ubigeoOrigenDetraccion?: string;
  public agregarUbigeoOrigenDetraccion(ubigeoOrigenDetraccion?: string): Cabecera {
    this._ubigeoOrigenDetraccion = ubigeoOrigenDetraccion;
    return this;
  }

  private _puntoOrigenDetraccion?: string;
  public agregarPuntoOrigenDetraccion(puntoOrigenDetraccion?: string): Cabecera {
    this._puntoOrigenDetraccion = puntoOrigenDetraccion;
    return this;
  }

  private _ubigeoDestinoDetraccion?: string;
  public agregarUbigeoDestinoDetraccion(ubigeoDestinoDetraccion?: string): Cabecera {
    this._ubigeoDestinoDetraccion = ubigeoDestinoDetraccion;
    return this;
  }

  private _puntoDestinoDetraccion?: string;
  public agregarPuntoDestinoDetraccion(puntoDestinoDetraccion?: string): Cabecera {
    this._puntoDestinoDetraccion = puntoDestinoDetraccion;
    return this;
  }

  private _tramoViajeDetraccion?: string;
  public agregarTramoViajeDetraccion(tramoViajeDetraccion?: string): Cabecera {
    this._tramoViajeDetraccion = tramoViajeDetraccion;
    return this;
  }

  private _formaPago?: FormaPago;
  public get formaPago(): FormaPago | undefined {
    return this._formaPago;
  }
  private agregarFormaPago(formaPago: FormaPago): Cabecera {
    this._formaPago = formaPago;
    return this;
  }

  private _tipoFormaPago?: string;
  public agregarTipoFormaPago(tipoFormaPago: '1' | '2'): Cabecera {
    this._tipoFormaPago = tipoFormaPago;
    return this;
  }

  private _cuotasPago: Cuota[] = [];
  public get cuotasPago(): Cuota[] {
    return this._cuotasPago;
  }
  public agregarCuotasPago(cuota: Cuota): Cabecera {
    this._cuotasPago.push(cuota);
    return this;
  }

  private _icbper?: Icbper;
  public get icbper(): Icbper | undefined {
    return this._icbper;
  }
  private agregarIcbper(icbper: Icbper): Cabecera {
    this._icbper = icbper;
    return this;
  }

  private _adicionales: Adicional[] = [];
  public get adicionales(): Adicional[] {
    return this._adicionales;
  }
  public agregarAdicionales(adicional: Adicional): Cabecera {
    let exists: boolean = false;
    this._adicionales.forEach((adi) => {
      if (adi.codigo === adicional.codigo) {
        exists = true;
      }
    });
    if (!exists) {
      this._adicionales?.push(adicional);
    }
    return this;
  }

  private _retencionesIgv?: RetencionIgv;
  public get retencionesIgv(): RetencionIgv | undefined {
    return this._retencionesIgv;
  }
  private agregarRetencionesIgv(retencionesIgv: RetencionIgv): Cabecera {
    this._retencionesIgv = retencionesIgv;
    return this;
  }

  private _retencionIgv?: boolean;
  public get retencionIgv(): boolean | undefined {
    return this._retencionIgv;
  }
  public agregarRetencionIgv(retencionIgv?: boolean): Cabecera {
    this._retencionIgv = retencionIgv;
    return this;
  }

  // Para notas de crédito
  private _tipoNota?: string;
  public get tipoNota(): string | undefined {
    return this._tipoNota;
  }
  public agregarTipoNota(tipoNota: string): Cabecera {
    this._tipoNota = tipoNota;
    return this;
  }

  private _motivo?: string;
  public get motivo(): string | undefined {
    return this._motivo;
  }
  public agregarMotivo(motivo: string): Cabecera {
    this._motivo = motivo;
    return this;
  }

  private _documentosModificados: DocumentoModificado[] = [];
  public get documentosModificados(): DocumentoModificado[] {
    return this._documentosModificados;
  }
  public agregarDocumentosModificados(documentoModificado: DocumentoModificado): Cabecera {
    let exists: boolean = false;
    this._documentosModificados.forEach((dm) => {
      if (dm.numero === documentoModificado.numero && dm.tipo === documentoModificado.tipo) {
        exists = true;
      }
    });
    if (!exists) {
      this._documentosModificados?.push(documentoModificado);
    }
    return this;
  }
  // Para notas de crédito

  public static crear(): Cabecera {
    return new Cabecera();
  }

  public toJSON() {
    return {
      tipoDocumento: this._tipoDocumento,
      codigoEstablecimiento: this._codigoEstablecimiento,
      fechaEmision: this._fechaEmision,
      horaEmision: this._horaEmision,
      tipoMoneda: this._tipoMoneda,
      tipoCambio: this._tipoCambio,
      serie: this._serie,
      correlativo: this._correlativo,
      tipoOperacion: this._tipoOperacion,
      subTipoOperacion: this._subTipoOperacion,
      adquiriente: this.adquiriente,
      operacionGravada: this._operacionGravada,
      operacionExonerada: this._operacionExonerada,
      operacionInafecta: this._operacionInafecta,
      operacionExportacion: this._operacionExportacion,
      operacionGratuita: this._operacionGratuita,
      igv: this.igv,
      importes: this.importes,
      montoEnLetras: this._montoEnLetras,
      descuentoGlobal: this._descuentoGlobal,
      detraccion: this.detraccion,
      retencionIgv: this.retencionesIgv,
      formaPago: this.formaPago,
      cuotas: this._cuotasPago.length > 0 ? this.cuotasPago : undefined,
      guiasRemision: this._guiasRemision.length > 0 ? this.guiasRemision : undefined,
      adicionales: this._adicionales.length > 0 ? this.adicionales : undefined,
      tipoNota: this._tipoNota,
      motivo: this._motivo,
      documentosModificados: this._documentosModificados.length > 0 ? this._documentosModificados : undefined,
    };
  }

  public build(detalle?: any[]): Cabecera {
    let totalGravado = new Decimal(0.0);
    let totalExonerado = new Decimal(0.0);
    let totalInafecto = new Decimal(0.0);
    let totalGratuito = new Decimal(0.0);
    let totalGratuitoGravado = new Decimal(0.0);
    let totalExportacion = new Decimal(0.0);
    let totalIcbper = new Decimal(0.0);
    let totalCantidadIcbper = new Decimal(0);

    const totalAnticipoGravado = new Decimal(0.0);
    const totalAnticipoExonerado = new Decimal(0.0);
    const totalAnticipoInafecto = new Decimal(0.0);

    this.agregarImportes(Importes.crear());

    detalle?.forEach((item: Detalle) => {
      if (item.cantidad && item.valorUnitario && item.precioVentaUnitario && item.igv) {
        let totalDetalleIcbper = new Decimal(0.0);
        if (item.icbp) {
          totalDetalleIcbper = totalDetalleIcbper.add(
            new Decimal(EmiteApi.configuracion.valorIcbper!).mul(new Decimal(item.cantidad)),
          );
          totalIcbper = totalIcbper.add(totalDetalleIcbper);
          totalCantidadIcbper = totalCantidadIcbper.add(new Decimal(item.cantidad));
        }

        switch (item.igv?.codigoTipoAfectacionIgv) {
          case '10':
            totalGravado = totalGravado.add(new Decimal(item.valorVenta!));
            break;
          case '20':
            totalExonerado = totalExonerado.add(new Decimal(item.valorVenta!));
            break;
          case '30':
            totalInafecto = totalInafecto.add(new Decimal(item.valorVenta!));
            break;
          case '40':
            totalExportacion = totalExportacion.add(new Decimal(item.valorVenta!));
            break;
          default:
            totalGratuito = totalGratuito.add(new Decimal(item.valorVenta!));
            if (Number(item.igv?.codigoTipoAfectacionIgv!) > 10 && Number(item.igv?.codigoTipoAfectacionIgv!) < 20) {
              totalGratuitoGravado = totalGratuitoGravado.add(new Decimal(item.valorVenta!));
            }
        }
      }
    });

    let descuentoABaseImponible = new Decimal(0.0);
    if (this._descuentoABaseImponible) {
      if (EmiteApi.configuracion.descuentoGlobalPorcentaje) {
        descuentoABaseImponible = totalGravado.mul(obtenerValorPorcentaje(this._descuentoABaseImponible));
      } else {
        if (EmiteApi.configuracion.calculaDescuentoGlobalSinIgv) {
          descuentoABaseImponible = new Decimal(this._descuentoABaseImponible);
        } else {
          descuentoABaseImponible = new Decimal(obtenerMontoSinIgv(this._descuentoABaseImponible, '10'));
        }
      }
      this.agregarDescuentoGlobal(descuentoABaseImponible.toFixed(2));
    }

    let cargoABaseImponible = new Decimal(0.0);
    if (this._cargoABaseImponible) {
      if (EmiteApi.configuracion.cargoGlobalPorcentaje) {
        cargoABaseImponible = totalGravado.mul(obtenerValorPorcentaje(this._cargoABaseImponible));
      } else {
        if (EmiteApi.configuracion.calculaCargoGlobalSinIgv) {
          cargoABaseImponible = new Decimal(this._cargoABaseImponible);
        } else {
          cargoABaseImponible = new Decimal(obtenerMontoSinIgv(this._cargoABaseImponible, '10'));
        }
      }
      this.importes?.agregarOtrosCargos(cargoABaseImponible.toFixed(2));
    }

    totalGravado = totalGravado.sub(totalAnticipoGravado).sub(descuentoABaseImponible).add(cargoABaseImponible);
    totalExonerado = totalExonerado.sub(totalAnticipoExonerado);
    totalInafecto = totalInafecto.sub(totalAnticipoInafecto);

    this.agregarOperacionGravada(totalGravado.toFixed(2));
    this.agregarOperacionExonerada(totalExonerado.toFixed(2));
    this.agregarOperacionInafecta(totalInafecto.toFixed(2));
    this.agregarOperacionGratuita(totalGratuito.toFixed(2));
    this.agregarOperacionExportacion(totalExportacion.toFixed(2));

    this.agregarIgv(
      Igv.crear()
        .agregarMonto(obtenerIgv(obterMontoConIgv(totalGravado.valueOf(), '10'), '10').monto)
        .agregarMontoGratuito(obtenerIgv(obterMontoConIgv(totalGratuitoGravado.valueOf(), '10'), '10').monto),
    );

    if (totalIcbper.greaterThan(0)) {
      this.agregarIcbper(
        Icbper.crear().agregarMonto(EmiteApi.configuracion.valorIcbper!).agregarCantidad(totalCantidadIcbper.valueOf()),
      );
    }

    let total = totalGravado
      .add(totalExonerado)
      .add(totalInafecto)
      .add(totalExportacion)
      .add(new Decimal(this.igv?.monto!))
      .add(totalIcbper);

    let descuentoAImporteTotal = new Decimal(0.0);
    if (this._descuentoAImporteTotal) {
      if (EmiteApi.configuracion.descuentoGlobalPorcentaje) {
        descuentoAImporteTotal = total.mul(obtenerValorPorcentaje(this._descuentoAImporteTotal));
      } else {
        descuentoAImporteTotal = new Decimal(this._descuentoAImporteTotal);
      }
      this.agregarDescuentoGlobalNAB(descuentoAImporteTotal.toFixed(2));
      this.importes?.agregarTotalDescuentoNAB(this.descuentoGlobalNAB);
    }

    let cargoAImporteTotal = new Decimal(0.0);
    if (this._cargoAImporteTotal) {
      if (EmiteApi.configuracion.cargoGlobalPorcentaje) {
        cargoAImporteTotal = total.mul(obtenerValorPorcentaje(this._cargoAImporteTotal));
      } else {
        cargoAImporteTotal = new Decimal(this._cargoAImporteTotal);
      }
      this.importes?.agregarCargoGlobalNAB(cargoAImporteTotal.toFixed(2));
    }

    total = total.sub(descuentoAImporteTotal).add(cargoAImporteTotal);
    this.importes?.agregarImporteTotal(total.toFixed(2));
    this.agregarMontoEnLetras(numeroALetras(this.importes?.importeTotal!, this.tipoMoneda!));

    let montoDetraccion = new Decimal(0.0);
    if (
      this._codigoDetraccion &&
      EmiteApi.configuracion.cuentaDetracciones &&
      this._tipoMoneda &&
      this.importes?.importeTotal
    ) {
      let porcentajeDetraccion;
      if (this._porcentajeDetraccion) {
        porcentajeDetraccion = this._porcentajeDetraccion;
      } else {
        porcentajeDetraccion = obtenerPorcentajeDetraccion(this._codigoDetraccion!);
      }
      if (porcentajeDetraccion) {
        montoDetraccion = total.mul(obtenerValorPorcentaje(porcentajeDetraccion));
        this.agregarDetraccion(
          Detraccion.crear()
            .agregarCodigo(this._codigoDetraccion)
            .agregarPorcentaje(porcentajeDetraccion)
            .agregarCuenta(EmiteApi.configuracion.cuentaDetracciones)
            .agregarTipoMoneda(this._tipoMoneda)
            .agregarMonto(montoDetraccion.toFixed(2)),
        );
        if (this._codigoDetraccion === '027') {
          this._detraccion?.agregarTransporte(
            DetraccionTransporte.crear()
              .agregarValorReferencial(this._valorReferencialDetraccion)
              .agregarValorReferencialCargaEfectiva(this._valorReferencialCargaEfectivaDetraccion)
              .agregarValorReferencialCargaUtil(this._valorReferencialCargaUtilDetraccion)
              .agregarUbigeoOrigen(this._ubigeoOrigenDetraccion)
              .agregarPuntoOrigen(this._puntoOrigenDetraccion)
              .agregarUbigeoDestino(this._ubigeoDestinoDetraccion)
              .agregarPuntoDestino(this._puntoDestinoDetraccion)
              .agregarTramoViaje(this._tramoViajeDetraccion),
          );
          if (this._valorReferencialDetraccion && new Decimal(this._valorReferencialDetraccion).greaterThan(total)) {
            montoDetraccion = new Decimal(this._valorReferencialDetraccion).mul(
              obtenerValorPorcentaje(porcentajeDetraccion),
            );
            this._detraccion?.agregarMonto(montoDetraccion.toFixed(2));
          }
        }
      }
    }

    let montoRetencionIgv = new Decimal(0.0);
    if (this.retencionIgv && this.importes?.importeTotal) {
      montoRetencionIgv = total.mul(EmiteApi.configuracion.valorRetencionIgv!);
      this.agregarRetencionesIgv(
        RetencionIgv.crear()
          .agregarPorcentaje(EmiteApi.configuracion.porcentajeRetencionIgv!.toString())
          .agregarMonto(montoRetencionIgv.toFixed(2)),
      );
    }

    this.agregarFormaPago(FormaPago.crear().agregarTipo('1'));
    if (this._tipoFormaPago === '2') {
      this.formaPago
        ?.agregarTipo(this._tipoFormaPago)
        .agregarMonto(total.sub(montoDetraccion).sub(montoRetencionIgv).toFixed(2));
    }
    if (this.formaPago?.tipo === '1') {
      this.agregarAdicionales(
        Adicional.crear()
          .agregarCodigo(EmiteApi.configuracion.adicionalCodigoFormaPago)
          .agregarValor(EmiteApi.configuracion.adicionalValorFormaPagoContado),
      );
    } else {
      this.agregarAdicionales(
        Adicional.crear()
          .agregarCodigo(EmiteApi.configuracion.adicionalCodigoFormaPago)
          .agregarValor(EmiteApi.configuracion.adicionalValorFormaPagoCredito),
      );
    }

    return this;
  }
}

export class Detalle {
  private _orden?: number;
  public get orden(): number | undefined {
    return this._orden;
  }
  public agregarOrden(orden: number): Detalle {
    this._orden = orden;
    return this;
  }

  private _id?: number;
  public get id(): number | undefined {
    return this._id;
  }
  public agregarId(id?: number): Detalle {
    this._id = id;
    return this;
  }

  private _descripcion?: string;
  public get descripcion(): string | undefined {
    return this._descripcion;
  }
  private _multiDescripcion: string[] = [];
  public get multiDescripcion(): string[] {
    return this._multiDescripcion;
  }
  public agregarDescripcion(descripcion: string): Detalle {
    if (!this._descripcion) {
      this._descripcion = descripcion;
      return this;
    }
    this._multiDescripcion?.push(descripcion);
    return this;
  }

  private _codigoProducto?: string;
  public get codigoProducto(): string | undefined {
    return this._codigoProducto;
  }
  public agregarCodigoProducto(codigoProducto?: string): Detalle {
    this._codigoProducto = codigoProducto;
    return this;
  }

  private _unidadMedida?: string;
  public get unidadMedida(): string | undefined {
    return this._unidadMedida;
  }
  public agregarUnidadMedida(unidadMedida: string): Detalle {
    this._unidadMedida = unidadMedida;
    return this;
  }

  private _cantidad?: string;
  public get cantidad(): string | undefined {
    return this._cantidad;
  }
  public agregarCantidad(cantidad: string): Detalle {
    this._cantidad = validarNumero(cantidad);
    return this;
  }

  private _igv?: Igv;
  public get igv(): Igv | undefined {
    return this._igv;
  }
  private agregarIgv(igv: Igv): Detalle {
    this._igv = igv;
    return this;
  }

  private _isc?: Isc;
  public get isc(): Isc | undefined {
    return this._isc;
  }
  private agregarIsc(isc: Isc): Detalle {
    this._isc = isc;
    return this;
  }

  private _valorUnitario?: string;
  public get valorUnitario(): string | undefined {
    return this._valorUnitario;
  }
  public agregarValorUnitario(valorUnitario?: string): Detalle {
    this._valorUnitario = validarNumero(valorUnitario);
    return this;
  }

  private _importeTotal?: string;
  public get importeTotal(): string | undefined {
    return this._importeTotal;
  }
  private agregarImporteTotal(importeTotal: string): Detalle {
    this._importeTotal = importeTotal;
    return this;
  }

  private _valorVenta?: string;
  public get valorVenta(): string | undefined {
    return this._valorVenta;
  }
  private agregarValorVenta(valorVenta: string): Detalle {
    this._valorVenta = valorVenta;
    return this;
  }

  private _montoDescuento?: string;
  public get montoDescuento(): string | undefined {
    return this._montoDescuento;
  }
  private agregarMontoDescuento(montoDescuento: string): Detalle {
    this._montoDescuento = montoDescuento;
    return this;
  }

  private _descuento?: string;
  public get descuento(): string | undefined {
    return this._descuento;
  }
  public agregarDescuento(descuento: string): Detalle {
    this._descuento = validarNumero(descuento);
    return this;
  }

  private _precioVentaUnitario?: string;
  public get precioVentaUnitario(): string | undefined {
    return this._precioVentaUnitario;
  }
  public agregarPrecioVentaUnitario(precioVentaUnitario?: string): Detalle {
    this._precioVentaUnitario = validarNumero(precioVentaUnitario);
    return this;
  }

  private _codigoSunat?: string;
  public get codigoSunat(): string | undefined {
    return this._codigoSunat;
  }
  public agregarCodigoSunat(codigoSunat: string): Detalle {
    this._codigoSunat = codigoSunat;
    return this;
  }

  private _icbper?: Icbper;
  public get icbper(): Icbper | undefined {
    return this._icbper;
  }
  private agregarIcbper(icbper: Icbper): Detalle {
    this._icbper = icbper;
    return this;
  }

  private _adicionales: Adicional[] = [];
  public get adicionales(): Adicional[] {
    return this._adicionales;
  }
  public agregarAdicionales(adicional: Adicional): Detalle {
    let exists: boolean = false;
    this._adicionales.forEach((adi) => {
      if (adi.codigo === adicional.codigo) {
        exists = true;
      }
    });
    if (!exists) {
      this._adicionales?.push(adicional);
    }
    return this;
  }

  private _codigoTipoAfectacionIgv?: string;
  public agregarCodigoTipoAfectacionIgv(codigoTipoAfectacionIgvOriginal: CodigoTipoAfectacionIgv): Detalle {
    this._codigoTipoAfectacionIgv = codigoTipoAfectacionIgvOriginal;
    return this;
  }

  private _icbp?: boolean;
  public get icbp(): boolean | undefined {
    return this._icbp;
  }
  public agregarIcbp(icbp?: boolean): Detalle {
    this._icbp = icbp;
    return this;
  }

  public static crear(): Detalle {
    return new Detalle();
  }

  public toJSON() {
    return {
      orden: this._orden,
      id: this._id,
      unidadMedida: this._unidadMedida,
      cantidad: this._cantidad,
      codigoProducto: this._codigoProducto,
      descripcion: this._descripcion,
      multiDescripcion: this._multiDescripcion,
      valorUnitario: this._valorUnitario,
      valorVenta: this._valorVenta,
      montoDescuento: this._montoDescuento,
      importeTotal: this._importeTotal,
      igv: this._igv,
      icbper: this._icbper,
      precioVentaUnitario: this._precioVentaUnitario,
      adicionales: this._adicionales.length > 0 ? this._adicionales : undefined,
    };
  }

  public build(): Detalle {
    if (
      this._cantidad &&
      this._codigoTipoAfectacionIgv &&
      ((EmiteApi.configuracion.calculoSegunValorUnitario && this._valorUnitario) ||
        (!EmiteApi.configuracion.calculoSegunValorUnitario && this._precioVentaUnitario))
    ) {
      let totalDetalleIcbper = new Decimal(0.0);

      if (EmiteApi.configuracion.calculoSegunValorUnitario) {
        this.agregarValorUnitario(new Decimal(this._valorUnitario!).toFixed(EmiteApi.configuracion.cantidadDecimales));
        this.agregarPrecioVentaUnitario(obterMontoConIgv(this._valorUnitario!, this._codigoTipoAfectacionIgv));
      } else {
        this.agregarPrecioVentaUnitario(new Decimal(this._precioVentaUnitario!).toFixed(2));
        this.agregarValorUnitario(obtenerMontoSinIgv(this._precioVentaUnitario!, this._codigoTipoAfectacionIgv));
      }

      let descuentoABI = new Decimal(0.0);
      if (this._descuento && this._codigoTipoAfectacionIgv === '10') {
        if (EmiteApi.configuracion.descuentoUnitarioPorcentaje) {
          descuentoABI = new Decimal(this._cantidad)
            .mul(this._valorUnitario!)
            .mul(obtenerValorPorcentaje(this._descuento));
          this.agregarMontoDescuento(descuentoABI.toFixed(EmiteApi.configuracion.cantidadDecimales));
        } else {
          if (EmiteApi.configuracion.calculoSegunValorUnitario) {
            descuentoABI = new Decimal(this._descuento);
            this.agregarMontoDescuento(descuentoABI.toFixed(EmiteApi.configuracion.cantidadDecimales));
          } else {
            descuentoABI = new Decimal(obtenerMontoSinIgv(this._descuento, this._codigoTipoAfectacionIgv));
            this.agregarMontoDescuento(descuentoABI.toFixed(EmiteApi.configuracion.cantidadDecimales));
          }
        }
        this.agregarAdicionales(
          Adicional.crear()
            .agregarCodigo(OpcionesPredeterminadas.adicionalCodigoDescuentoUnitario)
            .agregarValor(this._descuento),
        );
      }

      this.agregarValorVenta(new Decimal(this._cantidad).mul(this._valorUnitario!).sub(descuentoABI).toFixed(2));

      this.agregarImporteTotal(obterMontoConIgv(this._valorVenta!, this._codigoTipoAfectacionIgv));
      this.agregarIgv(obtenerIgv(this._importeTotal!, this._codigoTipoAfectacionIgv));

      if (this.icbp) {
        totalDetalleIcbper = totalDetalleIcbper.add(
          new Decimal(EmiteApi.configuracion.valorIcbper!).mul(new Decimal(this._cantidad)),
        );

        this.agregarIcbper(
          Icbper.crear().agregarMonto(EmiteApi.configuracion.valorIcbper!).agregarCantidad(this._cantidad!),
        );

        this.agregarImporteTotal(new Decimal(this._importeTotal!).add(totalDetalleIcbper).toFixed(2));
      }
    }

    return this;
  }
}
