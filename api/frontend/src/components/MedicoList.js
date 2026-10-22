import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as medicoService from '../services/medicoService.js';
import { ESPECIALIDADES } from '../services/medicoService.js';

// LISTA DE MEDICOS CON BUSQUEDA POR NOMBRE Y FILTRO POR ESPECIALIDAD.
// NO HAY BORRADO DESDE LA PANTALLA: SOLO ALTA Y EDICION.
export const MedicoList = () => {
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [especialidadFiltro, setEspecialidadFiltro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMedicos = async () => {
      try {
        setLoading(true);
        const data = await medicoService.getAll();
        setMedicos(data);
      } catch (err) {
        setError(err.message || 'Error al cargar los médicos');
        setMedicos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicos();
  }, []);

  const medicosFiltrados = medicos.filter((medico) => {
    const coincideNombre = (medico.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
    const coincideEspecialidad = !especialidadFiltro || medico.especialidad === especialidadFiltro;
    return coincideNombre && coincideEspecialidad;
  });

  return React.createElement('div', { className: 'medico-list' },
    React.createElement('h2', null, 'Lista de Médicos'),
    React.createElement('div', { className: 'search-box' },
      React.createElement('label', { htmlFor: 'buscar-medico', className: 'label-visualmente-oculta' }, 'Buscar por nombre'),
      React.createElement('input', {
        id: 'buscar-medico',
        type: 'search',
        className: 'input',
        placeholder: 'Buscar por nombre...',
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value),
        'aria-label': 'Buscar médico por nombre'
      }),
      React.createElement('label', { htmlFor: 'filtrar-especialidad', className: 'label-visualmente-oculta' }, 'Filtrar por especialidad'),
      React.createElement('select', {
        id: 'filtrar-especialidad',
        className: 'input',
        value: especialidadFiltro,
        onChange: (e) => setEspecialidadFiltro(e.target.value),
        'aria-label': 'Filtrar médicos por especialidad'
      },
        React.createElement('option', { value: '' }, 'Todas las especialidades'),
        ESPECIALIDADES.map((especialidad) =>
          React.createElement('option', { key: especialidad, value: especialidad }, especialidad)
        )
      )
    ),
    loading
      ? React.createElement('p', { role: 'status', 'aria-live': 'polite' }, 'Cargando...')
      : error
        ? React.createElement('p', { className: 'error', role: 'alert' }, error)
        : medicosFiltrados.length === 0
          ? React.createElement('p', { role: 'status', 'aria-live': 'polite' }, 'No se encontraron médicos')
          : React.createElement('div', { className: 'tabla-scroll', role: 'region', 'aria-label': 'Tabla de médicos', tabIndex: 0 },
              React.createElement('table', null,
                React.createElement('thead', null,
                  React.createElement('tr', null,
                    React.createElement('th', { scope: 'col' }, 'ID'),
                    React.createElement('th', { scope: 'col' }, 'Nombre'),
                    React.createElement('th', { scope: 'col' }, 'Especialidad'),
                    React.createElement('th', { scope: 'col' }, 'DNI'),
                    React.createElement('th', { scope: 'col' }, 'Email'),
                    React.createElement('th', { scope: 'col' }, 'Acciones')
                  )
                ),
                React.createElement('tbody', null,
                  medicosFiltrados.map((medico) =>
                    React.createElement('tr', { key: medico.id },
                      React.createElement('td', null, medico.id),
                      React.createElement('td', null, medico.nombre),
                      React.createElement('td', null, medico.especialidad || ''),
                      React.createElement('td', null, medico.dni || ''),
                      React.createElement('td', null, medico.email || ''),
                      React.createElement('td', null,
                        React.createElement('button', {
                          className: 'button button-pequeno',
                          onClick: () => navigate(`/medicos/${medico.id}/editar`),
                          'aria-label': `Editar médico ${medico.nombre}`
                        }, 'Editar')
                      )
                    )
                  )
                )
              )
            ),
    React.createElement('div', { className: 'form-group' },
      React.createElement('button', {
        className: 'button',
        onClick: () => navigate('/medicos/nuevo'),
        'aria-label': 'Registrar nuevo médico'
      }, 'Registrar nuevo médico')
    )
  );
};

export default MedicoList;
