import React, { useState } from 'react';
import * as validationUtils from '../utils/validationUtils.js';
import * as pacienteService from '../services/pacienteService.js';

// FORMULARIO DE ALTA Y EDICION DE PACIENTES (RF-2/RF-3/RF-4/RF-14/RF-15).
// LOS CAMPOS DE DIRECCION SON PLANOS EN EL ESTADO Y SE ANIDAN AL ENVIAR.
// EN EDICION, EL DNI ES SOLO LECTURA (EL PUT DEL BACKEND NO LO ACEPTA); EL EMAIL SI SE EDITA.
export const PacienteForm = ({ pacienteId }) => {
  const [form, setForm] = useState({
    dni: '',
    nombre: '',
    email: '',
    telefono: '',
    calle: '',
    distrito: '',
    ciudad: '',
    numero: '',
    complemento: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // EN MODO EDICION SE CARGAN LOS DATOS COMPLETOS CON EL ENDPOINT DETALLE
  React.useEffect(() => {
    if (pacienteId) {
      const loadPaciente = async () => {
        try {
          const data = await pacienteService.getById(pacienteId);
          setForm((prev) => ({
            ...prev,
            dni: data.dni || '',
            nombre: data.nombre || '',
            email: data.email || '',
            telefono: data.telefono || '',
            calle: data.direccion ? (data.direccion.calle || '') : '',
            distrito: data.direccion ? (data.direccion.distrito || '') : '',
            ciudad: data.direccion ? (data.direccion.ciudad || '') : '',
            numero: data.direccion ? (data.direccion.numero || '') : '',
            complemento: data.direccion ? (data.direccion.complemento || '') : ''
          }));
        } catch (err) {
          setMessage(err.message || 'Error al cargar el paciente');
        }
      };
      loadPaciente();
    }
  }, [pacienteId]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'dni':
        return validationUtils.validarDNI(value);
      case 'nombre':
        return validationUtils.validarNombre(value);
      case 'email':
        return validationUtils.validarEmail(value);
      case 'telefono':
        return validationUtils.validarTelefono(value);
      case 'calle':
        return validationUtils.validarCampoRequerido(value, 'La calle');
      case 'ciudad':
        return validationUtils.validarCampoRequerido(value, 'La ciudad');
      case 'numero':
        return validationUtils.validarCampoRequerido(value, 'El número');
      case 'distrito':
      case 'complemento':
        // OPCIONALES: SE PERMITE DEJARLOS EN BLANCO (NO SE VALIDAN)
        return { esValido: true, mensaje: '' };
      default:
        return { esValido: true, mensaje: '' };
    }
  };

  const handleBlur = (field) => (e) => {
    const validation = validateField(field, e.target.value);
    setErrors((prev) => ({ ...prev, [field]: validation.esValido ? '' : validation.mensaje }));
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;
    for (const field of Object.keys(form)) {
      // EN EDICION NO SE VALIDA EL DNI: VA DESHABILITADO Y NO SE EDITA (EL EMAIL SI SE VALIDA)
      if (pacienteId && field === 'dni') {
        continue;
      }
      const validation = validateField(field, form[field]);
      if (!validation.esValido) {
        isValid = false;
        newErrors[field] = validation.mensaje;
      }
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    // RF-4: CON CAMPOS INVALIDOS NO SE ENVIA NADA AL SERVIDOR
    if (!validateAll()) {
      return;
    }
    setLoading(true);
    try {
      if (pacienteId) {
        await pacienteService.update(pacienteId, form);
        setMessage('Paciente actualizado correctamente');
      } else {
        await pacienteService.create(form);
        setMessage('Paciente creado correctamente');
        setForm({
          dni: '',
          nombre: '',
          email: '',
          telefono: '',
          calle: '',
          distrito: '',
          ciudad: '',
          numero: '',
          complemento: ''
        });
      }
    } catch (err) {
      // RF-15: DUPLICADO (DNI/EMAIL/TELEFONO YA REGISTRADO) -> ERROR INLINE JUNTO AL CAMPO
      const erroresUnicidad = validationUtils.detectarErroresUnicidad(err);
      if (erroresUnicidad) {
        setErrors((prev) => ({ ...prev, ...erroresUnicidad }));
        return;
      }
      // ERRORES 400 DEL BACKEND: ARRAY {campo, error} -> TAMBIEN INLINE
      const erroresBackend = validationUtils.mapearErroresDelBackend(err);
      if (erroresBackend) {
        setErrors((prev) => ({ ...prev, ...erroresBackend }));
        return;
      }
      setMessage(err.message || 'Error al guardar el paciente');
    } finally {
      setLoading(false);
    }
  };

  // FABRICA DE CAMPOS DE TEXTO PARA NO REPETIR ATRIBUTOS ARIA (RF-12)
  const campo = (field, tipo, etiqueta, opciones = {}) => {
    const idsDescritos = [
      opciones.descripcion ? `${field}-ayuda` : null,
      errors[field] ? `${field}-error` : null
    ].filter(Boolean).join(' ');
    return React.createElement('div', { className: 'form-group', key: field },
      React.createElement('label', { htmlFor: field }, `${etiqueta}:`),
      React.createElement('input', {
        id: field,
        type: tipo,
        className: 'input',
        value: form[field],
        onChange: handleChange(field),
        onBlur: handleBlur(field),
        disabled: opciones.deshabilitado || false,
        required: !opciones.opcional,
        'aria-required': !opciones.opcional,
        'aria-invalid': Boolean(errors[field]),
        'aria-describedby': idsDescritos || undefined,
        ...(opciones.autoComplete ? { autoComplete: opciones.autoComplete } : {})
      }),
      opciones.descripcion
        ? React.createElement('p', { id: `${field}-ayuda`, className: 'ayuda' }, opciones.descripcion)
        : null,
      errors[field]
        ? React.createElement('span', { id: `${field}-error`, className: 'error', role: 'alert' }, errors[field])
        : null
    );
  };

  return React.createElement('div', { className: 'paciente-form' },
    React.createElement('h2', null, pacienteId ? 'Editar Paciente' : 'Registrar Nuevo Paciente'),
    React.createElement('form', { onSubmit: handleSubmit, noValidate: true },
      campo('nombre', 'text', 'Nombre', { autoComplete: 'name' }),
      campo('dni', 'text', 'DNI (formato 12.345.678)', {
        deshabilitado: Boolean(pacienteId),
        // AVISO EN EL ALTA: EL DNI NO SE PODRA CAMBIAR DESPUES
        descripcion: pacienteId ? null : 'El DNI no se podrá editar después de guardar.'
      }),
      campo('email', 'email', 'Email', { autoComplete: 'email' }),
      campo('telefono', 'tel', 'Teléfono (9 dígitos)', { autoComplete: 'tel' }),
      React.createElement('fieldset', { className: 'form-fieldset' },
        React.createElement('legend', null, 'Dirección'),
        campo('calle', 'text', 'Calle'),
        campo('numero', 'text', 'Número'),
        campo('complemento', 'text', 'Complemento (opcional)', { opcional: true }),
        campo('distrito', 'text', 'Distrito (opcional)', { opcional: true }),
        campo('ciudad', 'text', 'Ciudad')
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('button', {
          type: 'submit',
          className: 'button',
          disabled: loading,
          'aria-label': 'Guardar paciente'
        }, loading ? 'Guardando...' : 'Guardar')
      ),
      message
        ? React.createElement('div', {
            className: `message ${message.toLowerCase().includes('error') ? 'error' : 'success'}`,
            role: 'status',
            'aria-live': 'polite'
          }, message)
        : null
    )
  );
};

export default PacienteForm;
