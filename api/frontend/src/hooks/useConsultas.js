import { useState, useEffect } from 'react';
import * as consultaService from '../services/consultaService.js';
import { conectarWebSocket, suscribirActualizaciones, estaConectado } from '../utils/websocket.js';

// HOOK DE CONSULTAS CON ACTUALIZACION EN TIEMPO REAL (RF-7/RNF-3):
// EL WEBSOCKET AVISA DE CAMBIOS Y SE REFRESCA AL INSTANTE; SI NO ESTA CONECTADO,
// HAY POLLING DE RESPALDO CADA 30 SEGUNDOS (EL MECANISMO QUE ADMITE EL RF-8).
export const useConsultas = () => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    const fetchConsultas = async () => {
      try {
        setLoading(true);
        const data = await consultaService.getAll();
        if (activo) {
          setConsultas(data || []);
          setError('');
        }
      } catch (err) {
        if (activo) {
          setError(err.message || 'Error al cargar las consultas');
          setConsultas([]);
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    fetchConsultas();

    // TIEMPO REAL: SUSCRIPCION A LOS AVISOS DEL BACKEND
    conectarWebSocket();
    const cancelarSuscripcion = suscribirActualizaciones(() => {
      fetchConsultas();
    });

    // RESPALDO: POLLING CADA 30 S SOLO SI EL WEBSOCKET NO ESTA CONECTADO
    const intervalId = setInterval(() => {
      if (!estaConectado()) {
        fetchConsultas();
      }
    }, 30000);

    return () => {
      activo = false;
      cancelarSuscripcion();
      clearInterval(intervalId);
    };
  }, []);

  return { consultas, loading, error };
};

export default useConsultas;
