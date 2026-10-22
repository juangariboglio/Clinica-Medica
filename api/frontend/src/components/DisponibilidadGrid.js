import React from 'react';

export const DisponibilidadGrid = ({ disponibilidad, onSelectSlot }) => {
  // HORARIO DE ATENCION DE LA CLINICA: LUNES A SABADO DE 7:00 A 19:00.
  // SE GENERAN FRANJAS DE 30 MIN: DE 07:00-07:30 HASTA 18:30-19:00.
  const slots = [];
  for (let hour = 7; hour < 19; hour++) {
    for (const minute of [0, 30]) {
      const start = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const endHour = minute === 30 ? hour + 1 : hour;
      const endMinute = minute === 30 ? 0 : 30;
      const end = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
      slots.push({ inicio: start, fin: end });
    }
  }

  // Helper to check if a slot is within any disponibilidad range
  const isSlotAvailable = (slot) => {
    return disponibilidad.some(avail => {
      // Convert times to minutes for easy comparison
      const slotStart = parseInt(slot.inicio.split(':')[0]) * 60 + parseInt(slot.inicio.split(':')[1]);
      const slotEnd = parseInt(slot.fin.split(':')[0]) * 60 + parseInt(slot.fin.split(':')[1]);
      const availStart = parseInt(avail.inicio.split(':')[0]) * 60 + parseInt(avail.inicio.split(':')[1]);
      const availEnd = parseInt(avail.fin.split(':')[0]) * 60 + parseInt(avail.fin.split(':')[1]);
      return slotStart >= availStart && slotEnd <= availEnd;
    });
  };

  return React.createElement('div', { className: 'disponibilidad-grid' },
    React.createElement('h2', null, 'Horarios Disponibles'),
    React.createElement('table', { className: 'grid-table' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', null, 'Hora'),
          React.createElement('th', null, 'Disponible')
        )
      ),
      React.createElement('tbody', null,
        slots.map((slot, index) =>
          React.createElement('tr', { key: index },
            React.createElement('td', null,
              React.createElement('strong', null, `${slot.inicio} - ${slot.fin}`)
            ),
            React.createElement('td', null,
              isSlotAvailable(slot) ? (
                React.createElement('button', {
                  onClick: () => onSelectSlot && onSelectSlot(slot),
                  disabled: !onSelectSlot,
                  'aria-label': `Seleccionar horario de ${slot.inicio} a ${slot.fin}, disponible`
                }, 'Seleccionar')
              ) : React.createElement('span', {
                'aria-label': `Horario de ${slot.inicio} a ${slot.fin}, no disponible`
              }, 'No disponible')
            )
          )
        )
      )
    )
  );
};

export default DisponibilidadGrid;