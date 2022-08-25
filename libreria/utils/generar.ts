import axios, { AxiosInstance } from 'axios';
import EmiteApi from '../../emite-api';
import { validarJson } from './funciones';

export class Generar {
  private axiosInstance?: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: EmiteApi.configuracion.urlApi,
      headers: {
        'Content-Type': 'application/json',
        'api-key': EmiteApi.configuracion.emiteKey!,
      },
    });
  }

  async generar(documento: any, json?: boolean): Promise<{ codigo: number; respuesta: string }> {
    let path: string = EmiteApi.configuracion.urlRegistrarFactura!;
    if (!json) {
      if (documento.cabecera?.tipoDocumento === '03') {
        path = EmiteApi.configuracion.urlRegistrarBoleta!;
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
          .agregarDistrito('')
          .agregarProvincia('')
          .agregarDepartamento('');
      }
      documento = documento.toJSON();
    } else {
      const errores = validarJson(documento);
      if (errores && errores.length > 0) {
        return { codigo: 400, respuesta: JSON.stringify(errores) };
      }
      if (documento.cabecera.tipoDocumento === '03') {
        path = EmiteApi.configuracion.urlRegistrarBoleta!;
        documento.cabecera.adquiriente.direccion =
          documento.cabecera.adquiriente.direccion +
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
        delete documento.cabecera.adquiriente.direccion.distrito;
        delete documento.cabecera.adquiriente.direccion.distrito;
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
      .then((response: { data: any }) => {
        return { codigo: 200, respuesta: JSON.stringify(response.data) };
      })
      .catch((error: { response: { data: { error: any } } }) => {
        return { codigo: 400, respuesta: JSON.stringify(error.response.data.error) };
      });
  }
}
