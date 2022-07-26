export type CodigoTipoAfectacionIgv =
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17'
  | '20'
  | '21'
  | '30'
  | '31'
  | '32'
  | '33'
  | '34'
  | '35'
  | '36'
  | '37'
  | '40';

export type CodigoDetraccion =
  | '001'
  | '002'
  | '003'
  | '007'
  | '008'
  | '009'
  | '010'
  | '012'
  | '013'
  | '014'
  | '015'
  | '016'
  | '017'
  | '020'
  | '021'
  | '022'
  | '023'
  | '025'
  | '026'
  | '027'
  | '028'
  | '030'
  | '036'
  | '037'
  | '039'
  | '040'
  | '019'
  | '099'
  | '005'
  | '024'
  | '011'
  | '004'
  | '035'
  | '031'
  | '034';

export class ApiError extends Error {
  public status: number;
  public data: any;
  constructor(status: number, data: any) {
    super(`Response status: ${status}`);
    this.status = status;
    this.data = data;
  }
}
