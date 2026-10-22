package med.voll.api.infra.security;

import med.voll.api.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service//IMPORTANTE ANOTACION
//IMPLEMENTAR UserDetailsService, CUANDO LA LINEA DE ABAJO ESTE EN ROJO, IMPLEMENTAR LOS METODOS (Implement methods)
//E IMPLEMENTARA EL METODO UserDetails loadUserByUsername
public class AutenticacionService implements UserDetailsService {
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        //COLOCAR EN EL RETURN usuarioRepository.findByUserName(username)
        //CUANDO ESTE EN ROJO findByUserName, CREAMOS EL METODO
        return usuarioRepository.findByLogin(username);
    }
}
