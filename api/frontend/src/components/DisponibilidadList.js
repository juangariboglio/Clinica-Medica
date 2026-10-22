import React from 'react';

export const DisponibilidadList = ({ disponibilidad, onSelectSlot }) => {
  return React.createElement('div', { className: 'disponibilidad-list' },
    React.createElement('h2', null, 'Horarios Disponibles'),
    disponibilidad.length === 0 ? React.createElement('p', null, 'No hay horarios disponibles') :
    React.createElement('ul', null,
      disponibilidad.map((slot, index) =>
        React.createElement('li', { key: index, style: { marginBottom: '8px' } },
          React.createElement('span', null, `${slot.inicio} - ${slot.fin}: `),
          onSelectSlot ? React.createElement('button', {
            onClick: () => onSelectSlot(slot),
            style: { marginLeft: '8px' }
          }, 'Seleccionar') : null
        )
      )
    )
  );
};

export default DisponibilidadList;