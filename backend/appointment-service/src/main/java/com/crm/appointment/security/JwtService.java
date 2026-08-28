package com.crm.appointment.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class JwtService {

    @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String jwtSecret;

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.error("JWT validation error: {}", e.getMessage());
            return false;
        }
    }

    public UserPrincipal extractUserPrincipal(String token) {
        Claims claims = extractAllClaims(token);
        String email = claims.getSubject();
        Number userIdNum = (Number) claims.get("userId");
        Long userId = userIdNum != null ? userIdNum.longValue() : null;
        String role = (String) claims.get("role");
        String name = (String) claims.get("name");
        Number deptIdNum = (Number) claims.get("departmentId");
        Long departmentId = deptIdNum != null ? deptIdNum.longValue() : null;
        String departmentName = (String) claims.get("departmentName");
        Number mgrIdNum = (Number) claims.get("managerId");
        Long managerId = mgrIdNum != null ? mgrIdNum.longValue() : null;

        if (role != null && !role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        return UserPrincipal.builder()
                .id(userId)
                .email(email)
                .name(name != null ? name : email)
                .role(role != null ? role : "ROLE_EMPLOYEE")
                .departmentId(departmentId)
                .departmentName(departmentName)
                .managerId(managerId)
                .build();
    }
}
