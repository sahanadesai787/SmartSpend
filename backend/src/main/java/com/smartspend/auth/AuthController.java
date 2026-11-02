package com.smartspend.auth;

import com.smartspend.security.JwtService;
import com.smartspend.user.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(UserRepository users, PasswordEncoder encoder,
                          AuthenticationManager authenticationManager, JwtService jwtService) {
        this.users = users;
        this.encoder = encoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(min = 8, max = 72) String password) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record AuthResponse(String token, Long id, String fullName, String email) {}
    public record UserResponse(Long id, String fullName, String email) {}

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of("message", "An account with this email already exists."));
        }
        AppUser user = users.save(new AppUser(request.fullName().trim(), email, encoder.encode(request.password())));
        UserDetails details = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail()).password(user.getPassword()).authorities("ROLE_USER").build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response(user, jwtService.generateToken(details)));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password()));
        UserDetails details = (UserDetails) authentication.getPrincipal();
        AppUser user = users.findByEmailIgnoreCase(details.getUsername()).orElseThrow();
        return response(user, jwtService.generateToken(details));
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        AppUser user = users.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail());
    }

    private AuthResponse response(AppUser user, String token) {
        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail());
    }
}
