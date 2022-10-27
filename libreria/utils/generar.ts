import axios, { AxiosInstance } from 'axios';
import EmiteApi from '../../emite-api';
import { validarJson } from './funciones';
import { ApiError } from './types';

export class Generar {
  private axiosInstance?: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: EmiteApi.configuracion.urlApi,
      headers: {
        'Content-Type': 'application/json',
        emite_key: EmiteApi.configuracion.emiteKey!,
      },
    });
  }

  async generar(documento: any, json?: boolean): Promise<any> {
    let path: string = EmiteApi.configuracion.urlRegistrarFactura!;
    if (!json) {
      if (documento.cabecera?.tipoDocumento === '03') {
        path = EmiteApi.configuracion.urlRegistrarBoleta!;
      }
      if (documento.cabecera?.tipoDocumento === '07') {
        path = EmiteApi.configuracion.urlRegistrarNotaCredito!;
      }
      if (documento.cabecera?.tipoDocumento === '08') {
        path = EmiteApi.configuracion.urlRegistrarNotaDebito!;
      }
      if (
        documento.cabecera?.tipoDocumento === '03' ||
        ((documento.cabecera?.tipoDocumento === '07' || documento.cabecera?.tipoDocumento === '08') &&
          documento.cabecera?.documentosModificados[0]?.tipo === '03')
      ) {
        documento.cabecera?.adquiriente?.direccion
          ?.agregarDescripcion(
            documento.cabecera?.adquiriente?.direccion?.descripcion +
              (documento.cabecera?.adquiriente?.direccion?.distrito
                ? ' ' + documento.cabecera?.adquiriente?.direccion?.distrito
                : '') +
              (documento.cabecera?.adquiriente?.direccion?.provincia
                ? ' - ' + documento.cabecera?.adquiriente?.direccion?.provincia
                : '') +
              (documento.cabecera?.adquiriente?.direccion?.departamento
                ? ' - ' + documento.cabecera?.adquiriente?.direccion?.departamento
                : ''),
          )
          .agregarDistrito()
          .agregarProvincia()
          .agregarDepartamento();
      }
      documento = documento.toJSON();
    } else {
      const errores: string[] = [];
      if (!EmiteApi.configuracion.emiteKey) {
        errores.push('No tiene configurado el EMITE_KEY');
      }
      errores.push(...validarJson(documento));
      if (errores.length > 0) {
        throw new ApiError(400, errores);
      }
      if (documento.cabecera.tipoDocumento === '03') {
        path = EmiteApi.configuracion.urlRegistrarBoleta!;
      }
      if (documento.cabecera.tipoDocumento === '07') {
        path = EmiteApi.configuracion.urlRegistrarNotaCredito!;
      }
      if (documento.cabecera.tipoDocumento === '08') {
        path = EmiteApi.configuracion.urlRegistrarNotaDebito!;
      }
      if (
        documento.cabecera.tipoDocumento === '03' ||
        ((documento.cabecera.tipoDocumento === '07' || documento.cabecera.tipoDocumento === '08') &&
          documento.cabecera.documentosModificados[0].tipo === '03')
      ) {
        documento.cabecera.adquiriente.direccion.descripcion =
          documento.cabecera.adquiriente.direccion.descripcion +
          (documento.cabecera.adquiriente.direccion.distrito
            ? ' ' + documento.cabecera.adquiriente.direccion.distrito
            : '') +
          (documento.cabecera.adquiriente.direccion.provincia
            ? ' - ' + documento.cabecera.adquiriente.direccion.provincia
            : '') +
          (documento.cabecera.adquiriente.direccion.departamento
            ? ' - ' + documento.cabecera.adquiriente.direccion.departamento
            : '');
        delete documento.cabecera.adquiriente.direccion.distrito;
        delete documento.cabecera.adquiriente.direccion.provincia;
        delete documento.cabecera.adquiriente.direccion.departamento;
      }
    }
    delete documento.cabecera.adquiriente.id;
    delete documento.cabecera.tipoDocumento;
    documento.detalle.forEach((item: any) => {
      delete item.id;
    });
    const parametros = {
      documento,
      configuracion: {
        noRetornarXml: true,
        noRetornarCdr: true,
      },
    };
    return this.axiosInstance!.post(path, parametros)
      .then((response: any) => {
        return response.data;
      })
      .catch((error: any) => {
        throw new ApiError(error.response.status, error.response.data);
      });
  }
}
