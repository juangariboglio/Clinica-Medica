import React, { useState } from 'react';
import * as validationUtils from '../utils/validationUtils.js';
import * as medicoService from '../services/medicoService.js';
import { ESPECIALIDADES } from '../services/medicoService.js';

// FORMULARIO DE ALTA Y EDICION DE MEDICOS. LOS CAMPOS DE DIRECCION SON PLANOS
// EN EL ESTADO Y SE ANIDAN AL ENVIAR. EN EDICION EL DNI ES SOLO LECTURA, PERO
// EMAIL, TELEFONO Y ESPECIALIDAD SI SE PUEDEN CAMBIAR.
const FORM_VACIO = {
  nombre: '',
  dni: '',
  email: '',
  telefono: '',
  especialidad: '',
  calle: '',
  numero: '',
  complemento: '',
  distrito: '',
  ciudad: ''
};

export const MedicoForm = ({ medicoId }) => {
  const [form, setForm] = useState(FORM_VACIO);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // EN MODO EDICION SE CARGAN LOS DATOS COMPLETOS CON EL ENDPOINT DETALLE
  React.useEffect(() => {
    if (medicoId) {
      const loadMedico = async () => {
        try {
          const data = await medicoService.getById(medicoId);
          setForm({
            nombre: data.nombre || '',
            dni: data.dni || '',
            email: data.email || '',
            telefono: data.telefono || '',
            especialidad: data.especialidad || '',
            calle: data.direccion ? (data.direccion.calle || '') : '',
            numero: data.direccion ? (data.direccion.numero || '') : '',
            complemento: data.direccion ? (data.direccion.complemento || '') : '',
            distrito: data.direccion ? (data.direccion.distrito || '') : '',
            ciudad: data.direccion ? (data.direccion.ciudad || '') : ''
          });
        } catch (err) {
          setMessage(err.message || 'Error al cargar el médico');
        }
      };
      loadMedico();
    }
  }, [medicoId]);

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
      case 'especialidad':
        return value
          ? { esValido: true, mensaje: '' }
          : { esValido: false, mensaje: 'La especialidad es obligatoria' };
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
      // EN EDICION NO SE VALIDA EL DNI: VA DESHABILITADO Y NO SE EDITA
      if (medicoId && field === 'dni') {
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
    // CON CAMPOS INVALIDOS NO SE ENVIA NADA AL SERVIDOR
    if (!validateAll()) {
      return;
    }
    setLoading(true);
    try {
      if (medicoId) {
        await medicoService.update(medicoId, form);
        setMessage('Médico actualizado correctamente');
      } else {
        await medicoService.create(form);
        setMessage('Médico creado correctamente');
        setForm(FORM_VACIO);
      }
    } catch (err) {
      // DUPLICADO (DNI/EMAIL/TELEFONO YA REGISTRADO) -> ERROR INLINE JUNTO AL CAMPO
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
      setMessage(err.message || 'Error al guardar el médico');
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

  const campoEspecialidad = () =>
    React.createElement('div', { className: 'form-group', key: 'especialidad' },
      React.createElement('label', { htmlFor: 'especialidad' }, 'Especialidad:'),
      React.createElement('select', {
        id: 'especialidad',
        className: 'input',
        value: form.especialidad,
        onChange: handleChange('especialidad'),
        onBlur: handleBlur('especialidad'),
        required: true,
        'aria-required': true,
        'aria-invalid': Boolean(errors.especialidad),
        'aria-describedby': errors.especialidad ? 'especialidad-error' : undefined
      },
        React.createElement('option', { value: '' }, 'Seleccione una especialidad'),
        ESPECIALIDADES.map((especialidad) =>
          React.createElement('option', { key: especialidad, value: especialidad }, especialidad)
        )
      ),
      errors.especialidad
        ? React.createElement('span', { id: 'especialidad-error', className: 'error', role: 'alert' }, errors.especialidad)
        : null
    );

  return React.createElement('div', { className: 'medico-form' },
    React.createElement('h2', null, medicoId ? 'Editar Médico' : 'Registrar Nuevo Médico'),
    React.createElement('form', { onSubmit: handleSubmit, noValidate: true },
      campo('nombre', 'text', 'Nombre', { autoComplete: 'name' }),
      campo('dni', 'text', 'DNI (formato 12.345.678)', {
        deshabilitado: Boolean(medicoId),
        // AVISO EN EL ALTA: EL DNI NO SE PODRA CAMBIAR DESPUES
        descripcion: medicoId ? null : 'El DNI no se podrá editar después de guardar.'
      }),
      campo('email', 'email', 'Email', { autoComplete: 'email' }),
      campo('telefono', 'tel', 'Teléfono (9 dígitos)', { autoComplete: 'tel' }),
      campoEspecialidad(),
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
          'aria-label': 'Guardar médico'
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

export default MedicoForm;
