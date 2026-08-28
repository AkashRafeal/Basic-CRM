package com.crm.product.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secretKey;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public UserPrincipal extractUserPrincipal(String token) {
        Claims claims = extractAllClaims(token);
        String role = claims.get("role", String.class);
        if (role != null && !role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        Long userId = null;
        Object idClaim = claims.get("userId");
        if (idClaim instanceof Number) {
            userId = ((Number) idClaim).longValue();
        } else if (idClaim instanceof String) {
            try {
                userId = Long.parseLong((String) idClaim);
            } catch (NumberFormatException ignored) {}
        }

        Long deptId = null;
        Object dId = claims.get("departmentId");
        if (dId instanceof Number) deptId = ((Number) dId).longValue();

        Long mgrId = null;
        Object mId = claims.get("managerId");
        if (mId instanceof Number) mgrId = ((Number) mId).longValue();

        return UserPrincipal.builder()
                .id(userId)
                .email(claims.getSubject())
                .name(claims.get("name", String.class))
                .role(role)
                .departmentId(deptId)
                .departmentName(claims.get("departmentName", String.class))
                .managerId(mgrId)
                .build();
    }

    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = secretKey.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
