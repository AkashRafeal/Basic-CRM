package com.crm.product.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Also check for Gateway propagated headers
            String userIdHeader = request.getHeader("X-User-Id");
            String userRoleHeader = request.getHeader("X-User-Role");
            String userNameHeader = request.getHeader("X-User-Name");

            if (userIdHeader != null && userRoleHeader != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String role = userRoleHeader.startsWith("ROLE_") ? userRoleHeader : "ROLE_" + userRoleHeader;
                List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));

                UserPrincipal principal = UserPrincipal.builder()
                        .id(Long.parseLong(userIdHeader))
                        .name(userNameHeader)
                        .role(role)
                        .build();

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        principal, null, authorities
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }

            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        try {
            if (jwtService.isTokenValid(jwt) && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserPrincipal principal = jwtService.extractUserPrincipal(jwt);
                String rawRole = principal.getRole() != null ? principal.getRole() : "EMPLOYEE";
                String roleWithPrefix = rawRole.startsWith("ROLE_") ? rawRole : "ROLE_" + rawRole;
                String roleWithoutPrefix = rawRole.startsWith("ROLE_") ? rawRole.substring(5) : rawRole;

                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority(roleWithPrefix),
                        new SimpleGrantedAuthority(roleWithoutPrefix)
                );

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        principal, null, authorities
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
