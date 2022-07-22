import { Decimal } from "decimal.js";
import { Igv } from "./documento";
import EmiteApi from "../../emite-api";

export function obtenerValorPorcentaje(porcentaje: string): Decimal {
  return new Decimal(porcentaje).div(new Decimal(100));
}

export function obterMontoConIgv(
  montoSinIgv: string,
  afectacion: string
): string {
  if (afectacion === "10") {
    let valorIgv = new Decimal(1).add(EmiteApi.configuracion.valorIgv!);
    return new Decimal(montoSinIgv).mul(valorIgv).toFixed(2);
  } else {
    return new Decimal(montoSinIgv).toFixed(2);
  }
}

export function obtenerMontoSinIgv(
  montoConIgv: string,
  afectacion: string
): string {
  if (afectacion === "10") {
    let valorIgv = new Decimal(1).add(EmiteApi.configuracion.valorIgv!);
    return new Decimal(montoConIgv)
      .div(valorIgv)
      .toFixed(EmiteApi.configuracion.cantidadDecimales);
  } else {
    return new Decimal(montoConIgv).toFixed(
      EmiteApi.configuracion.cantidadDecimales
    );
  }
}

export function obtenerPorcentajeDetraccion(
  codigo: string
): string | undefined {
  const detracciones = [
    { codigo: "001", porcentaje: "10" },
    { codigo: "002", porcentaje: "100" },
    { codigo: "003", porcentaje: "100" },
    { codigo: "007", porcentaje: "100" },
    { codigo: "008", porcentaje: "4" },
    { codigo: "009", porcentaje: "10" },
    { codigo: "010", porcentaje: "100" },
    { codigo: "012", porcentaje: "12" },
    { codigo: "013", porcentaje: "100" },
    { codigo: "014", porcentaje: "4" },
    { codigo: "015", porcentaje: "100" },
    { codigo: "016", porcentaje: "100" },
    { codigo: "017", porcentaje: "100" },
    { codigo: "020", porcentaje: "12" },
    { codigo: "021", porcentaje: "10" },
    { codigo: "022", porcentaje: "12" },
    { codigo: "023", porcentaje: "12" },
    { codigo: "025", porcentaje: "10" },
    { codigo: "026", porcentaje: "100" },
    { codigo: "027", porcentaje: "4" },
    { codigo: "028", porcentaje: "100" },
    { codigo: "030", porcentaje: "4" },
    { codigo: "036", porcentaje: "100" },
    { codigo: "037", porcentaje: "12" },
    { codigo: "039", porcentaje: "100" },
    { codigo: "040", porcentaje: "4" },
    { codigo: "019", porcentaje: "10" },
    { codigo: "099", porcentaje: "1.5" },
    { codigo: "005", porcentaje: "1.5" },
    { codigo: "024", porcentaje: "10" },
    { codigo: "011", porcentaje: "10" },
    { codigo: "004", porcentaje: "1.5" },
    { codigo: "035", porcentaje: "1.5" },
    { codigo: "031", porcentaje: "10" },
    { codigo: "034", porcentaje: "10" },
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
  if (afectacion === "10") {
    return Igv.crear()
      .agregarMonto(
        new Decimal(montoConIgv)
          .sub(new Decimal(obtenerMontoSinIgv(montoConIgv, afectacion)))
          .toFixed(2)
      )
      .agregarCodigoTipoAfectacionIgv(afectacion);
  } else if (
    afectacion !== "10" &&
    afectacion !== "20" &&
    afectacion !== "30" &&
    afectacion !== "40"
  ) {
    if (parseInt(afectacion) > 10 && parseInt(afectacion) < 20) {
      return Igv.crear()
        .agregarMontoGratuito(
          new Decimal(montoConIgv)
            .sub(new Decimal(obtenerMontoSinIgv(montoConIgv, afectacion)))
            .toFixed(2)
        )
        .agregarCodigoTipoAfectacionIgv(afectacion);
    } else {
      return Igv.crear()
        .agregarMontoGratuito(new Decimal(0.0).toFixed(2))
        .agregarCodigoTipoAfectacionIgv(afectacion);
    }
  } else {
    return Igv.crear()
      .agregarMonto(new Decimal(0.0).toFixed(2))
      .agregarCodigoTipoAfectacionIgv(afectacion);
  }
}
