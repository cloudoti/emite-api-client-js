function unidades(num: number): string {
  switch (num) {
    case 1:
      return 'UN';
    case 2:
      return 'DOS';
    case 3:
      return 'TRES';
    case 4:
      return 'CUATRO';
    case 5:
      return 'CINCO';
    case 6:
      return 'SEIS';
    case 7:
      return 'SIETE';
    case 8:
      return 'OCHO';
    case 9:
      return 'NUEVE';
  }
  return '';
}

function decenasY(strSin: string, numUnidades: number) {
  if (numUnidades > 0) return strSin + ' Y ' + unidades(numUnidades);
  return strSin;
}

function decenas(num: number): string {
  const _decena = Math.floor(num / 10);
  const _unidad = num - _decena * 10;
  switch (_decena) {
    case 1:
      switch (_unidad) {
        case 0:
          return 'DIEZ';
        case 1:
          return 'ONCE';
        case 2:
          return 'DOCE';
        case 3:
          return 'TRECE';
        case 4:
          return 'CATORCE';
        case 5:
          return 'QUINCE';
        default:
          return 'DIECI' + unidades(_unidad);
      }
    case 2:
      switch (_unidad) {
        case 0:
          return 'VEINTE';
        default:
          return 'VEINTI' + unidades(_unidad);
      }
    case 3:
      return decenasY('TREINTA', _unidad);
    case 4:
      return decenasY('CUARENTA', _unidad);
    case 5:
      return decenasY('CINCUENTA', _unidad);
    case 6:
      return decenasY('SESENTA', _unidad);
    case 7:
      return decenasY('SETENTA', _unidad);
    case 8:
      return decenasY('OCHENTA', _unidad);
    case 9:
      return decenasY('NOVENTA', _unidad);
    case 0:
      return unidades(_unidad);
  }
  return '';
}

function centenas(num: number) {
  const _centenas = Math.floor(num / 100);
  const _decenas = num - _centenas * 100;
  switch (_centenas) {
    case 1:
      if (_decenas > 0) return 'CIENTO ' + decenas(_decenas);
      return 'CIEN';
    case 2:
      return 'DOSCIENTOS ' + decenas(_decenas);
    case 3:
      return 'TRESCIENTOS ' + decenas(_decenas);
    case 4:
      return 'CUATROCIENTOS ' + decenas(_decenas);
    case 5:
      return 'QUINIENTOS ' + decenas(_decenas);
    case 6:
      return 'SEISCIENTOS ' + decenas(_decenas);
    case 7:
      return 'SETECIENTOS ' + decenas(_decenas);
    case 8:
      return 'OCHOCIENTOS ' + decenas(_decenas);
    case 9:
      return 'NOVECIENTOS ' + decenas(_decenas);
  }

  return decenas(_decenas);
}

function seccion(num: number, divisor: number, strSingular: string, strPlural: string) {
  const _cientos = Math.floor(num / divisor);
  const _resto = num - _cientos * divisor;

  let letras = '';

  if (_cientos > 0)
    if (_cientos > 1) letras = centenas(_cientos) + ' ' + strPlural;
    else letras = strSingular;

  if (_resto > 0) letras += '';
  return letras;
}

function miles(num: number) {
  const _divisor = 1000;
  const _cientos = Math.floor(num / _divisor);
  const _resto = num - _cientos * _divisor;

  let strMiles = seccion(num, _divisor, 'UN MIL', 'MIL');
  let strCentenas = centenas(_resto);

  if (strMiles == '') return strCentenas;

  return strMiles + ' ' + strCentenas;
}

function millones(num: number) {
  const _divisor = 1000000;
  const _cientos = Math.floor(num / _divisor);
  const _resto = num - _cientos * _divisor;

  let strMillones = seccion(num, _divisor, 'UN MILLON DE', 'MILLONES DE');
  let strMiles = miles(_resto);

  if (strMillones == '') return strMiles;

  return strMillones + ' ' + strMiles;
}

export function numeroALetras(numString: string, tipoMoneda: string) {
  const _num = parseFloat(numString);
  let nombreMoneda = '';
  if (tipoMoneda === 'PEN') nombreMoneda = 'SOLES';
  if (tipoMoneda === 'USD') nombreMoneda = 'DÓLARES AMERICANOS';
  if (tipoMoneda === 'EUR') nombreMoneda = 'EUROS';
  let data = {
    numero: _num,
    enteros: Math.floor(_num),
    centavos: Math.round(_num * 100) - Math.floor(_num) * 100,
    letrasCentavos: '',
    letrasMoneda: nombreMoneda,
  };

  data.letrasCentavos = 'CON ' + (data.centavos < 10 ? '0' : '') + data.centavos.toString() + '/100';

  if (data.enteros == 0) return 'CERO' + ' ' + data.letrasCentavos + ' ' + data.letrasMoneda;
  if (data.enteros == 1) return millones(data.enteros) + ' ' + data.letrasCentavos + ' ' + data.letrasMoneda;
  else return millones(data.enteros) + ' ' + data.letrasCentavos + ' ' + data.letrasMoneda;
}
