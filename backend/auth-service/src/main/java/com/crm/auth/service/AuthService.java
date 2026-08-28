package com.crm.auth.service;

import com.crm.auth.dto.*;
import com.crm.auth.model.Role;
import com.crm.auth.model.UserAuth;
import com.crm.auth.repository.UserAuthRepository;
import com.crm.auth.security.JwtService;
import com.crm.auth.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAuthRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        Role role = request.getRole() != null ? request.getRole() : Role.ROLE_EMPLOYEE;

        UserAuth user = UserAuth.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .department(request.getDepartment())
                .phoneNumber(request.getPhoneNumber())
                .active(true)
                .build();

        UserAuth savedUser = userRepository.save(user);
        UserPrincipal userPrincipal = UserPrincipal.create(savedUser);
        String token = jwtService.generateToken(userPrincipal);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserResponse.fromEntity(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtService.generateToken(userPrincipal);

        UserAuth user = userRepository.findByEmail(userPrincipal.getEmail())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserResponse.fromEntity(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String token) {
        String email = jwtService.extractUsername(token);
        UserAuth user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found with email: " + email));
        return UserResponse.fromEntity(user);
    }
}
