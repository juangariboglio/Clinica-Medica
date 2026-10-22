import React, { useState, useEffect } from 'react';
import * as consultaService from '../services/consultaService.js';
import DisponibilidadGrid from './DisponibilidadGrid.js';
import DisponibilidadList from './DisponibilidadList.js';

export const Disponibilidad = ({ medicoId, fecha }) => {
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      if (!medicoId || !fecha) {
        setDisponibilidad([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const data = await consultaService.getDisponibilidad(medicoId, fecha);
        setDisponibilidad(data);
      } catch (err) {
        setError(err.message || 'Error al obtener la disponibilidad');
        setDisponibilidad([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDisponibilidad();
  }, [medicoId, fecha]);

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    // Here we could trigger a callback to continue with cita creation
    alert(`Has seleccionado el horario: ${slot.inicio} - ${slot.fin}`);
  };

  return React.createElement('div', { className: 'disponibilidad-container' },
    React.createElement('h2', null, 'Disponibilidad de Turnos'),
    medicoId && fecha ? React.createElement('div', null,
      React.createElement('p', null, `Médico ID: ${medicoId}, Fecha: ${fecha instanceof Date ? fecha.toISOString().split('T')[0] : fecha}`)
    ) : null,
    loading ? React.createElement('p', null, 'Cargando disponibilidad...') :
    error ? React.createElement('p', { className: 'error' }, error) :
    React.createElement('div', null,
      React.createElement(DisponibilidadGrid, { disponibilidad: disponibilidad, onSelectSlot: handleSelectSlot }),
      React.createElement(DisponibilidadList, { disponibilidad: disponibilidad, onSelectSlot: handleSelectSlot }),
      selectedSlot ? React.createElement('p', null, `Horario seleccionado: ${selectedSlot.inicio} - ${selectedSlot.fin}`) : null
    )
  );
};

export default Disponibilidad;