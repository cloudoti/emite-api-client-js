import { Opciones } from './libreria/opciones/opciones';
import {
  Configuracion,
  obtenerConfiguracion,
} from './libreria/utils/configuracion';

class EmiteAPI {
  public configuracion: Configuracion;

  constructor(opciones?: Opciones) {
    this.configuracion = obtenerConfiguracion({});
  }

  agregarConfiguracion(opciones: Opciones) {
    this.configuracion = obtenerConfiguracion(opciones);
  }
}

export default new EmiteAPI();
