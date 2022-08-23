import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import axios from 'axios';
import EmiteApi from '../../emite-api';
import { Documento } from './documento';

const axiosInstance = axios.create({
  baseURL: '',
  headers: {},
});

@Injectable()
export class Generar {
  async generar(documento: Documento, path: string): Promise<string> {
    const configuracion = {
      baseURL: EmiteApi.configuracion.urlApi,
      headers: {
        'Content-Type': 'application/json',
        'api-key': EmiteApi.configuracion.emiteKey,
      },
    };
    const parametros = {
      documento,
      configuracion: {
        noRetornarXml: true,
        noRetornarCdr: true,
      },
    };
    return axiosInstance
      .post(path, parametros, configuracion)
      .then((response: { data: any }) => {
        return JSON.stringify(response.data);
      })
      .catch((error: { response: { data: { error: any } } }) => {
        throw new UnprocessableEntityException({
          error: [error.response.data.error],
        });
      });
  }
}
