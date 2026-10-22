import { useState, useEffect } from 'react';
import * as consultaService from '../services/consultaService.js';

export const useDisponibilidad = (medicoId, fecha) => {
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const refetch = () => {
    setLoading(true);
    setError('');
    // We'll rely on the useEffect to re-run when dependencies change,
    // but we can also trigger a re-fetch by changing a dummy state.
    // For simplicity, we'll just call the fetch function directly.
    fetchDisponibilidad();
  };

  return {
    disponibilidad,
    cargando: loading,
    error,
    refetch
  };
};

export default useDisponibilidad;