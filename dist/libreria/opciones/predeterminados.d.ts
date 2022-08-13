import { Configuracion } from '../utils/configuracion';
export interface OpcionesPredeterminadas extends Configuracion {
    urlApiPruebas?: string;
    urlApiProduccion?: string;
}
declare const OpcionesPredeterminadas: OpcionesPredeterminadas;
export default OpcionesPredeterminadas;
