import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('validationUtils module', () => {
  it('should export validarDNI function', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.strictEqual(typeof module.validarDNI, 'function');
  });

  it('should export validarEmail function', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.strictEqual(typeof module.validarEmail, 'function');
  });

  it('should export validarTelefono function', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.strictEqual(typeof module.validarTelefono, 'function');
  });

  it('should export validarNombre function', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.strictEqual(typeof module.validarNombre, 'function');
  });
});

describe('RF-14: validaciones de formato según la spec y el backend', () => {
  it('validarDNI acepta el formato \\d{2}\\.\\d{3}\\.\\d{3} (caso límite de la spec)', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.deepStrictEqual(module.validarDNI('12.345.678'), { esValido: true, mensaje: 'DNI válido' });
  });

  it('validarDNI rechaza formatos incorrectos con el formato esperado en el mensaje', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    const casos = ['12345678Z', '12345678', '12.345.67', '12-345-678'];
    for (const caso of casos) {
      const resultado = module.validarDNI(caso);
      assert.strictEqual(resultado.esValido, false, `debía rechazar: "${caso}"`);
      assert.ok(
        resultado.mensaje.includes('12.345.678'),
        `el mensaje debía indicar el formato esperado: "${resultado.mensaje}"`
      );
    }
  });

  it('validarDNI marca el campo vacío como obligatorio (caso límite de la spec)', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.strictEqual(module.validarDNI('').esValido, false);
    assert.ok(module.validarDNI('').mensaje.includes('vacío'));
    assert.strictEqual(module.validarDNI('   ').esValido, false);
  });

  it('validarEmail acepta correos válidos y rechaza inválidos', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.strictEqual(module.validarEmail('juan.perez@ejemplo.com').esValido, true);
    assert.strictEqual(module.validarEmail('juan@ejemplo').esValido, false);
    assert.strictEqual(module.validarEmail('juan.ejemplo.com').esValido, false);
    assert.strictEqual(module.validarEmail('').esValido, false);
  });

  it('validarTelefono exige 9 dígitos (teléfono local)', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.strictEqual(module.validarTelefono('123456789').esValido, true);
    assert.strictEqual(module.validarTelefono('12345678').esValido, false);
    assert.strictEqual(module.validarTelefono('1234567890').esValido, false);
    assert.strictEqual(module.validarTelefono('12345678a').esValido, false);
  });

  it('validarNombre rechaza vacíos, solo espacios y caracteres no permitidos (caso límite)', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.strictEqual(module.validarNombre('   ').esValido, false);
    assert.strictEqual(module.validarNombre('').esValido, false);
    assert.strictEqual(module.validarNombre('Juan Pérez').esValido, true);
    assert.strictEqual(module.validarNombre('Ana-María').esValido, true);
    assert.strictEqual(module.validarNombre('Juan123').esValido, false);
  });

  it('validarCampoRequerido valida los subcampos de dirección (RF-2)', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.strictEqual(module.validarCampoRequerido('Calle 1', 'La calle').esValido, true);
    const resultado = module.validarCampoRequerido('  ', 'La calle');
    assert.strictEqual(resultado.esValido, false);
    assert.strictEqual(resultado.mensaje, 'La calle es obligatorio');
  });

  it('mapearErroresDelBackend convierte el array 400 en errores inline por campo', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    const err = {
      estado: 400,
      cuerpo: [
        { campo: 'dni', error: 'debe coincidir con \\d{2}\\.\\d{3}\\.\\d{3}' },
        { campo: 'direccion.calle', error: 'no debe estar en blanco' }
      ]
    };
    const errores = module.mapearErroresDelBackend(err);
    assert.strictEqual(errores.dni, 'debe coincidir con \\d{2}\\.\\d{3}\\.\\d{3}');
    // LOS CAMPOS ANIDADOS SE APLANAN: direccion.calle -> calle
    assert.strictEqual(errores.calle, 'no debe estar en blanco');
    // CUERPOS QUE NO SON LISTAS DEVUELVEN null
    assert.strictEqual(module.mapearErroresDelBackend({ estado: 409, cuerpo: { mensaje: 'duplicado' } }), null);
    assert.strictEqual(module.mapearErroresDelBackend(new Error('sin cuerpo')), null);
  });
});

describe('RF-15: detectarErroresUnicidad', () => {
  it('detecta un DNI duplicado por el estado 409', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    const err = Object.assign(new Error('El DNI ya está registrado en el sistema'), { estado: 409 });
    const errores = module.detectarErroresUnicidad(err);
    assert.strictEqual(errores.dni, 'Este DNI ya está registrado en el sistema');
    assert.strictEqual(errores.email, undefined);
  });

  it('detecta un email duplicado por el mensaje del servidor', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    const err = Object.assign(new Error('El email ya está registrado'), { estado: 409 });
    const errores = module.detectarErroresUnicidad(err);
    assert.strictEqual(errores.email, 'Este email ya está registrado en el sistema');
    assert.strictEqual(errores.dni, undefined);
  });

  it('detecta duplicados de DNI y email a la vez', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    const err = Object.assign(new Error('El DNI y el email ya existen'), { estado: 409 });
    const errores = module.detectarErroresUnicidad(err);
    assert.strictEqual(errores.dni, 'Este DNI ya está registrado en el sistema');
    assert.strictEqual(errores.email, 'Este email ya está registrado en el sistema');
  });

  it('devuelve null para errores que no son de unicidad', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    const errValidacion = Object.assign(new Error('El email no tiene un formato válido'), { estado: 400 });
    assert.strictEqual(module.detectarErroresUnicidad(errValidacion), null);
    const errConexion = new Error('Error de conexión: no se pudo contactar con el servidor');
    assert.strictEqual(module.detectarErroresUnicidad(errConexion), null);
  });

  it('devuelve null si el duplicado no indica el campo', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    const err = Object.assign(new Error('Registro duplicado'), { estado: 409 });
    assert.strictEqual(module.detectarErroresUnicidad(err), null);
  });
});

describe('RF-16: esErrorDeConexion', () => {
  it('reconoce los errores de pérdida de conexión', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.strictEqual(module.esErrorDeConexion(new Error('Error de conexión: no se pudo contactar con el servidor')), true);
    assert.strictEqual(module.esErrorDeConexion(new Error('Sin conexión: no se pueden realizar operaciones de escritura')), true);
  });

  it('no confunde un error de "no existe" con uno de conexión', async () => {
    const module = await import('../frontend/src/utils/validationUtils.js');
    assert.strictEqual(module.esErrorDeConexion(new Error('Error al obtener el paciente')), false);
    assert.strictEqual(module.esErrorDeConexion(new Error('El registro seleccionado no existe')), false);
  });
});
