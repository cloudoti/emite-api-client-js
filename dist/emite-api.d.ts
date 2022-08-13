import { Opciones } from './libreria/opciones/opciones';
import { Configuracion } from './libreria/utils/configuracion';
declare class EmiteAPI {
    configuracion: Configuracion;
    constructor(opciones?: Opciones);
    agregarConfiguracion(opciones: Opciones): void;
}
declare const _default: EmiteAPI;
export default _default;
