package vasyl.karpliak.aiCRM.iam.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.dto.RegistrationDTO;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setLogin("testlogin");
        mockUser.setPassword("password123");
        mockUser.setName("Test User");
        mockUser.setEmail("test@example.com");
    }

    @Test
    void createUser_FromUserEntity_ShouldSaveAndReturnUser() {
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        User result = userService.createUser(new User());

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void createUser_FromRegistrationDTO_ShouldSaveAndReturnUser() {
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        RegistrationDTO regDTO = new RegistrationDTO();
        regDTO.setLogin("newlogin");
        regDTO.setName("New User");
        // Assuming role is handled appropriately, or left as null if not set
        
        User result = userService.createUser(regDTO);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void getUserById_WhenExists_ShouldReturnUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));

        Optional<User> result = userService.getUserById(1L);

        assertTrue(result.isPresent());
        assertEquals("testlogin", result.get().getLogin());
    }

    @Test
    void getAllUsers_ShouldReturnUserList() {
        when(userRepository.findAll()).thenReturn(List.of(mockUser));

        List<User> result = userService.getAllUsers();

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void updateUser_ShouldUpdateFieldsAndSave() {
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        User newUser = new User();
        newUser.setLogin("updatedlogin");
        newUser.setName("Updated Name");

        User result = userService.updateUser(mockUser, newUser);

        assertNotNull(result);
        assertEquals("updatedlogin", mockUser.getLogin());
        assertEquals("Updated Name", mockUser.getName());
        verify(userRepository, times(1)).save(mockUser);
    }

    @Test
    void deleteUser_ShouldCallRepositoryDelete() {
        doNothing().when(userRepository).deleteById(1L);

        userService.deleteUser(1L);

        verify(userRepository, times(1)).deleteById(1L);
    }

    @Test
    void getUserByLoginAndPassword_ShouldReturnUser() {
        when(userRepository.findByLoginAndPassword("testlogin", "password123"))
                .thenReturn(Optional.of(mockUser));

        Optional<User> result = userService.getUserByLoginAndPassword("testlogin", "password123");

        assertTrue(result.isPresent());
        assertEquals("Test User", result.get().getName());
    }
}
