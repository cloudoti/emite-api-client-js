import axios, { AxiosInstance } from 'axios';
import EmiteApi from '../../emite-api';
import { Documento } from './documento';

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

  async generar(documento: Documento, path: string): Promise<{ codigo: number; respuesta: string }> {
    const parametros = {
      documento: documento.toJSON(),
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
