import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pacienteService from '../services/pacienteService.js';

// LISTA DE PACIENTES CON BUSQUEDA POR NOMBRE, EDICION Y BORRADO LOGICO.
// EL LISTADO SOLO SE REFRESCA AL RECARGAR LA PAGINA (RF-8: LOS CAMBIOS DE
// MEDICOS/PACIENTES HECHOS POR OTROS NO SE AVISAN EN TIEMPO REAL).
export const PacienteList = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensajeAccion, setMensajeAccion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        setLoading(true);
        const data = await pacienteService.getAll();
        setPacientes(data);
      } catch (err) {
        setError(err.message || 'Error al cargar los pacientes');
        setPacientes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPacientes();
  }, []);

  const handleEliminar = async (paciente) => {
    setMensajeAccion('');
    const confirmado = window.confirm(`¿Eliminar al paciente ${paciente.nombre}?`);
    if (!confirmado) {
      return;
    }
    try {
      await pacienteService.remove(paciente.id);
      setPacientes((prev) => prev.filter((p) => p.id !== paciente.id));
      setMensajeAccion(`Paciente ${paciente.nombre} eliminado`);
    } catch (err) {
      // CASO LIMITE: SI EL BACKEND LO RECHAZA (P. EJ. CONSULTAS ASOCIADAS), SE MUESTRA EL MOTIVO
      setError(err.message || 'Error al eliminar el paciente');
    }
  };

  const filteredPatients = pacientes.filter((paciente) =>
    (paciente.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return React.createElement('div', { className: 'paciente-list' },
    React.createElement('h2', null, 'Lista de Pacientes'),
    React.createElement('div', { className: 'search-box' },
      React.createElement('label', { htmlFor: 'buscar-paciente', className: 'label-visualmente-oculta' }, 'Buscar por nombre'),
      React.createElement('input', {
        id: 'buscar-paciente',
        type: 'search',
        className: 'input',
        placeholder: 'Buscar por nombre...',
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value),
        'aria-label': 'Buscar paciente por nombre'
      })
    ),
    mensajeAccion
      ? React.createElement('p', { className: 'success', role: 'status', 'aria-live': 'polite' }, mensajeAccion)
      : null,
    loading
      ? React.createElement('p', { role: 'status', 'aria-live': 'polite' }, 'Cargando...')
      : error
        ? React.createElement('p', { className: 'error', role: 'alert' }, error)
        : filteredPatients.length === 0
          ? React.createElement('p', { role: 'status', 'aria-live': 'polite' }, 'No se encontraron pacientes')
          : React.createElement('div', { className: 'tabla-scroll', role: 'region', 'aria-label': 'Tabla de pacientes', tabIndex: 0 },
              React.createElement('table', null,
                React.createElement('thead', null,
                  React.createElement('tr', null,
                    React.createElement('th', { scope: 'col' }, 'ID'),
                    React.createElement('th', { scope: 'col' }, 'Nombre'),
                    React.createElement('th', { scope: 'col' }, 'Email'),
                    React.createElement('th', { scope: 'col' }, 'DNI'),
                    React.createElement('th', { scope: 'col' }, 'Acciones')
                  )
                ),
                React.createElement('tbody', null,
                  filteredPatients.map((paciente) =>
                    React.createElement('tr', { key: paciente.id },
                      React.createElement('td', null, paciente.id),
                      React.createElement('td', null, paciente.nombre),
                      React.createElement('td', null, paciente.email || ''),
                      React.createElement('td', null, paciente.dni || ''),
                      React.createElement('td', null,
                        React.createElement('button', {
                          className: 'button button-pequeno',
                          onClick: () => navigate(`/pacientes/${paciente.id}/editar`),
                          'aria-label': `Editar paciente ${paciente.nombre}`
                        }, 'Editar'),
                        React.createElement('button', {
                          className: 'button button-pequeno button-peligro',
                          onClick: () => handleEliminar(paciente),
                          'aria-label': `Eliminar paciente ${paciente.nombre}`
                        }, 'Eliminar')
                      )
                    )
                  )
                )
              )
            ),
    React.createElement('div', { className: 'form-group' },
      React.createElement('button', {
        className: 'button',
        onClick: () => navigate('/pacientes/nuevo'),
        'aria-label': 'Registrar nuevo paciente'
      }, 'Registrar nuevo paciente')
    )
  );
};

export default PacienteList;
