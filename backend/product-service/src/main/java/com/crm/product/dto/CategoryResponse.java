package com.crm.product.dto;

import com.crm.product.model.ProductCategoryEntity;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private String code;
    private String description;
    private Boolean isSystemDefault;
    private LocalDateTime createdAt;

    public static CategoryResponse fromEntity(ProductCategoryEntity entity) {
        if (entity == null) return null;
        return CategoryResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .description(entity.getDescription())
                .isSystemDefault(entity.getIsSystemDefault())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
