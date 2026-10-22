import React, { useState, useEffect, useCallback } from 'react';
import * as consultaService from '../services/consultaService.js';
import * as medicoService from '../services/medicoService.js';
import { conectarWebSocket, suscribirActualizaciones, estaConectado } from '../utils/websocket.js';
import { aCadenaLocal } from '../utils/dateUtils.js';

// AGENDA DE CONSULTAS (RF-6/RF-7). MUESTRA LAS CONSULTAS ACTIVAS DE UN MEDICO Y
// UNA FECHA, CON ACTUALIZACION EN TIEMPO REAL: EL WEBSOCKET AVISA CUANDO OTRO
// USUARIO CREA O CANCELE UNA CONSULTA Y SE REFRESCA AL INSTANTE (RNF-3: <2 S);
// SI EL WEBSOCKET NO ESTA CONECTADO, HAY POLLING DE RESPALDO CADA 30 S (RF-8).
export const ConsultaList = ({ medicoId: medicoIdInicial, fecha: fechaInicial }) => {
  const [medicos, setMedicos] = useState([]);
  const [selectedMedicoId, setSelectedMedicoId] = useState(medicoIdInicial || '');
  const [fecha, setFecha] = useState(fechaInicial || aCadenaLocal());
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMedicos, setLoadingMedicos] = useState(true);
  const [error, setError] = useState('');
  const [errorMedicos, setErrorMedicos] = useState('');

  useEffect(() => {
    const fetchMedicos = async () => {
      try {
        const data = await medicoService.getAll();
        setMedicos(data);
      } catch (err) {
        setErrorMedicos(err.message || 'Error al cargar médicos');
      } finally {
        setLoadingMedicos(false);
      }
    };
    fetchMedicos();
  }, []);

  const cargarConsultas = useCallback(async (medicoId, fechaStr) => {
    if (!fechaStr) {
      setConsultas([]);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = medicoId
        ? await consultaService.getByFechaMedico(medicoId, fechaStr)
        : await consultaService.getAll(fechaStr);
      setConsultas(data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar la agenda');
      setConsultas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarConsultas(selectedMedicoId, fecha);
  }, [selectedMedicoId, fecha, cargarConsultas]);

  useEffect(() => {
    // TIEMPO REAL: SUSCRIPCION AL WEBSOCKET + POLLING DE RESPALDO CADA 30 S
    conectarWebSocket();
    const cancelarSuscripcion = suscribirActualizaciones(() => {
      cargarConsultas(selectedMedicoId, fecha);
    });
    const intervalo = setInterval(() => {
      if (!estaConectado()) {
        cargarConsultas(selectedMedicoId, fecha);
      }
    }, 30000);
    return () => {
      cancelarSuscripcion();
      clearInterval(intervalo);
    };
  }, [selectedMedicoId, fecha, cargarConsultas]);

  const formatearHora = (fechaISO) => {
    const hora = String(fechaISO).split('T')[1] || '';
    return hora.substring(0, 5);
  };

  return React.createElement('div', { className: 'consulta-list' },
    React.createElement('h2', null, 'Agenda de Consultas'),
    React.createElement('div', { className: 'agenda-filtros' },
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { htmlFor: 'agenda-medico' }, 'Médico:'),
        React.createElement('select', {
          id: 'agenda-medico',
          className: 'input',
          value: selectedMedicoId,
          onChange: (e) => setSelectedMedicoId(e.target.value),
          disabled: loadingMedicos
        },
          loadingMedicos
            ? React.createElement('option', null, 'Cargando...')
            : React.createElement('option', { value: '' }, 'Todos los médicos'),
          medicos.map((medico) =>
            React.createElement('option', { key: medico.id, value: medico.id }, medico.nombre)
          )
        ),
        errorMedicos ? React.createElement('span', { className: 'error', role: 'alert' }, errorMedicos) : null
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { htmlFor: 'agenda-fecha' }, 'Fecha:'),
        React.createElement('input', {
          id: 'agenda-fecha',
          type: 'date',
          className: 'input',
          value: fecha,
          onChange: (e) => setFecha(e.target.value)
        })
      )
    ),
    loading
      ? React.createElement('p', { role: 'status', 'aria-live': 'polite' }, 'Cargando agenda...')
      : error
        ? React.createElement('p', { className: 'error', role: 'alert' }, error)
        : consultas.length === 0
          ? React.createElement('p', { role: 'status', 'aria-live': 'polite' }, 'No hay consultas para la selección')
          : React.createElement('div', { className: 'tabla-scroll', role: 'region', 'aria-label': 'Tabla de consultas', tabIndex: 0 },
              React.createElement('table', { className: 'tabla-agenda' },
                React.createElement('thead', null,
                  React.createElement('tr', null,
                    React.createElement('th', { scope: 'col' }, 'Hora'),
                    React.createElement('th', { scope: 'col' }, 'Paciente'),
                    React.createElement('th', { scope: 'col' }, 'Médico')
                  )
                ),
                React.createElement('tbody', null,
                  consultas.map((consulta) =>
                    React.createElement('tr', { key: consulta.id },
                      React.createElement('td', null, formatearHora(consulta.fecha)),
                      React.createElement('td', null, consulta.nombrePaciente || consulta.idPaciente),
                      React.createElement('td', null, consulta.nombreMedico || consulta.idMedico)
                    )
                  )
                )
              )
            ),
    React.createElement('p', { className: 'agenda-estado', role: 'status', 'aria-live': 'polite' },
      estaConectado() ? 'Actualización en tiempo real activa' : 'Sin conexión en tiempo real; refresco cada 30 s'
    )
  );
};

export default ConsultaList;
