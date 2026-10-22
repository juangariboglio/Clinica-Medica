import React, { useState, useEffect } from 'react';
import * as pacienteService from '../services/pacienteService.js';
import * as medicoService from '../services/medicoService.js';
import * as consultaService from '../services/consultaService.js';
import { esErrorDeConexion } from '../utils/validationUtils.js';
import { aCadenaLocal } from '../utils/dateUtils.js';
import { conectarWebSocket, suscribirActualizaciones, estaConectado } from '../utils/websocket.js';

// FORMULARIO DE CREACION DE CITAS (RF-5/RF-6/RF-16). FLUJO: PACIENTE + MEDICO +
// FECHA -> SE MUESTRAN LOS HORARIOS LIBRES DEL MEDICO ESA FECHA -> HORA ->
// SE VERIFICA QUE PACIENTE Y MEDICO EXISTAN (RF-16) -> SE CREA LA CONSULTA.
export const ConsultaForm = () => {
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState('');
  const [selectedMedicoId, setSelectedMedicoId] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [loadingMedicos, setLoadingMedicos] = useState(true);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);
  const [errorPacientes, setErrorPacientes] = useState('');
  const [errorMedicos, setErrorMedicos] = useState('');
  const [errorDisponibilidad, setErrorDisponibilidad] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  // RF-16: ERRORES INLINE CUANDO EL PACIENTE O MEDICO SELECCIONADO NO EXISTE
  const [erroresExistencia, setErroresExistencia] = useState({});
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        setLoadingPacientes(true);
        const data = await pacienteService.getAll();
        setPacientes(data);
      } catch (err) {
        setErrorPacientes(err.message || 'Error al cargar pacientes');
      } finally {
        setLoadingPacientes(false);
      }
    };
    const fetchMedicos = async () => {
      try {
        setLoadingMedicos(true);
        const data = await medicoService.getAll();
        setMedicos(data);
      } catch (err) {
        setErrorMedicos(err.message || 'Error al cargar médicos');
      } finally {
        setLoadingMedicos(false);
      }
    };
    fetchPacientes();
    fetchMedicos();
    // EL WEBSOCKET AVISA SI OTRO USUARIO CREA/CANCELA CONSULTAS: SE REFRESCA LA
    // DISPONIBILIDAD PARA NO OFRECER UN HORARIO RECIEN OCUPADO
    conectarWebSocket();
    const cancelarSuscripcion = suscribirActualizaciones(() => {
      if (selectedMedicoId && selectedFecha) {
        cargarDisponibilidad(selectedMedicoId, selectedFecha);
      }
    });
    return cancelarSuscripcion;
  }, []);

  const cargarDisponibilidad = async (medicoId, fecha) => {
    try {
      setLoadingDisponibilidad(true);
      setErrorDisponibilidad('');
      const data = await consultaService.getDisponibilidad(medicoId, fecha);
      setDisponibilidad(data);
    } catch (err) {
      setErrorDisponibilidad(err.message || 'Error al obtener disponibilidad');
      setDisponibilidad([]);
    } finally {
      setLoadingDisponibilidad(false);
    }
  };

  useEffect(() => {
    setSelectedHora('');
    if (!selectedMedicoId || !selectedFecha) {
      setDisponibilidad([]);
      return;
    }
    cargarDisponibilidad(selectedMedicoId, selectedFecha);
  }, [selectedMedicoId, selectedFecha]);

  const handleChangePaciente = (e) => {
    setSelectedPacienteId(e.target.value);
    setErroresExistencia((prev) => ({ ...prev, paciente: '' }));
  };

  const handleChangeMedico = (e) => {
    setSelectedMedicoId(e.target.value);
    setErroresExistencia((prev) => ({ ...prev, medico: '' }));
  };

  // RF-16: ANTES DE CREAR LA CITA SE COMPRUEBA EN EL BACKEND QUE EL PACIENTE Y EL
  // MEDICO EXISTEN. UN FALLO DE RED NO SE CONFUNDE CON "NO EXISTE".
  const verificarExistencia = async () => {
    setErroresExistencia({});
    const [resultadoPaciente, resultadoMedico] = await Promise.allSettled([
      pacienteService.getById(selectedPacienteId),
      medicoService.getById(selectedMedicoId)
    ]);

    const nuevosErrores = {};
    let hayErrorDeConexion = false;

    if (resultadoPaciente.status === 'rejected') {
      if (esErrorDeConexion(resultadoPaciente.reason)) {
        hayErrorDeConexion = true;
      } else {
        nuevosErrores.paciente = 'El paciente seleccionado no existe en el sistema';
      }
    }
    if (resultadoMedico.status === 'rejected') {
      if (esErrorDeConexion(resultadoMedico.reason)) {
        hayErrorDeConexion = true;
      } else {
        nuevosErrores.medico = 'El médico seleccionado no existe en el sistema';
      }
    }

    if (hayErrorDeConexion) {
      setSubmitError('Error de conexión: no se pudo verificar la información. Intente de nuevo en unos segundos.');
      return false;
    }
    if (Object.keys(nuevosErrores).length > 0) {
      setErroresExistencia(nuevosErrores);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (!selectedPacienteId) {
      setSubmitError('Debe seleccionar un paciente');
      return;
    }
    if (!selectedMedicoId) {
      setSubmitError('Debe seleccionar un médico');
      return;
    }
    if (!selectedFecha) {
      setSubmitError('Debe seleccionar una fecha');
      return;
    }
    if (!selectedHora) {
      setSubmitError('Debe seleccionar un horario disponible');
      return;
    }

    try {
      setVerificando(true);
      const existen = await verificarExistencia();
      if (!existen) {
        return;
      }
      await consultaService.create({
        pacienteId: selectedPacienteId,
        medicoId: selectedMedicoId,
        fecha: selectedFecha,
        hora: selectedHora
      });
      setSuccessMessage('Cita creada exitosamente');
      setSelectedHora('');
      // SE RECARGA LA DISPONIBILIDAD: EL HORARIO ELEGIDO YA ESTA OCUPADO
      if (selectedMedicoId && selectedFecha) {
        await cargarDisponibilidad(selectedMedicoId, selectedFecha);
      }
    } catch (err) {
      // LOS MENSAJES DE VALIDACION DEL BACKEND (PACIENTE CON CONSULTA EL MISMO DIA,
      // HORARIO FUERA DE ATENCION, ANTICIPACION INSUFICIENTE...) SE MUESTRAN AQUI
      setSubmitError(err.message || 'Error al crear la cita');
      if (selectedMedicoId && selectedFecha) {
        await cargarDisponibilidad(selectedMedicoId, selectedFecha);
      }
    } finally {
      setVerificando(false);
    }
  };

  const errorPacienteInline = erroresExistencia.paciente || (errorPacientes && !loadingPacientes ? errorPacientes : '');
  const errorMedicoInline = erroresExistencia.medico || (errorMedicos && !loadingMedicos ? errorMedicos : '');
  const hoy = aCadenaLocal();

  const opcionesPacientes = loadingPacientes
    ? React.createElement('option', null, 'Cargando...')
    : errorPacientes
      ? React.createElement('option', null, 'Error al cargar pacientes')
      : React.createElement('option', { value: '' }, 'Seleccione un paciente');

  const opcionesMedicos = loadingMedicos
    ? React.createElement('option', null, 'Cargando...')
    : errorMedicos
      ? React.createElement('option', null, 'Error al cargar médicos')
      : React.createElement('option', { value: '' }, 'Seleccione un médico');

  return React.createElement('div', { className: 'consulta-form' },
    React.createElement('h2', null, 'Crear Nueva Consulta'),
    React.createElement('form', { onSubmit: handleSubmit, noValidate: true },
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { htmlFor: 'paciente' }, 'Paciente:'),
        React.createElement('select', {
          id: 'paciente',
          className: 'input',
          value: selectedPacienteId,
          onChange: handleChangePaciente,
          disabled: loadingPacientes,
          'aria-required': true,
          'aria-invalid': Boolean(errorPacienteInline),
          'aria-describedby': errorPacienteInline ? 'paciente-error' : undefined
        },
          opcionesPacientes,
          pacientes.map((paciente) =>
            React.createElement('option', { key: paciente.id, value: paciente.id }, paciente.nombre)
          )
        ),
        errorPacienteInline
          ? React.createElement('span', { id: 'paciente-error', className: 'error', role: 'alert' }, errorPacienteInline)
          : null
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { htmlFor: 'medico' }, 'Médico:'),
        React.createElement('select', {
          id: 'medico',
          className: 'input',
          value: selectedMedicoId,
          onChange: handleChangeMedico,
          disabled: loadingMedicos,
          'aria-required': true,
          'aria-invalid': Boolean(errorMedicoInline),
          'aria-describedby': errorMedicoInline ? 'medico-error' : undefined
        },
          opcionesMedicos,
          medicos.map((medico) =>
            React.createElement('option', { key: medico.id, value: medico.id }, `${medico.nombre} (${medico.especialidad || ''})`)
          )
        ),
        errorMedicoInline
          ? React.createElement('span', { id: 'medico-error', className: 'error', role: 'alert' }, errorMedicoInline)
          : null
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { htmlFor: 'fecha' }, 'Fecha:'),
        React.createElement('input', {
          id: 'fecha',
          type: 'date',
          className: 'input',
          value: selectedFecha,
          onChange: (e) => setSelectedFecha(e.target.value),
          min: hoy,
          'aria-required': true,
          'aria-invalid': Boolean(submitError),
          'aria-describedby': submitError ? 'consulta-error' : undefined
        })
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('span', { className: 'label-bloque', id: 'label-horarios' }, 'Horario disponible:'),
        loadingDisponibilidad
          ? React.createElement('p', { role: 'status', 'aria-live': 'polite' }, 'Cargando horarios...')
          : errorDisponibilidad
            ? React.createElement('p', { className: 'error', role: 'alert' }, errorDisponibilidad)
            : disponibilidad.length === 0
              ? React.createElement('p', { role: 'status', 'aria-live': 'polite' }, 'No hay horarios disponibles para la selección')
              : React.createElement('div', { role: 'radiogroup', 'aria-labelledby': 'label-horarios', className: 'radiogroup' },
                  disponibilidad.map((slot, index) =>
                    React.createElement('label', { key: index, className: 'radio-opcion' },
                      React.createElement('input', {
                        type: 'radio',
                        name: 'hora',
                        value: slot.inicio,
                        checked: selectedHora === slot.inicio,
                        onChange: () => setSelectedHora(slot.inicio),
                        'aria-label': `Horario de ${slot.inicio} a ${slot.fin}`
                      }),
                      React.createElement('span', null, `${slot.inicio} - ${slot.fin}`)
                    )
                  )
                )
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('button', {
          type: 'submit',
          className: 'button',
          disabled: loadingPacientes || loadingMedicos || verificando,
          'aria-label': 'Crear consulta'
        }, verificando ? 'Creando...' : 'Crear Consulta')
      ),
      submitError
        ? React.createElement('p', { id: 'consulta-error', className: 'error', role: 'alert', 'aria-live': 'polite' }, submitError)
        : null,
      successMessage
        ? React.createElement('p', { className: 'success', role: 'status', 'aria-live': 'polite' }, successMessage)
        : null
    )
  );
};

export default ConsultaForm;
