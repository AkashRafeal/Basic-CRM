package com.crm.product.service;

import com.crm.product.dto.CategoryResponse;
import com.crm.product.dto.CreateCategoryRequest;
import com.crm.product.exception.ResourceNotFoundException;
import com.crm.product.model.ProductCategoryEntity;
import com.crm.product.repository.ProductCategoryRepository;
import com.crm.product.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final ProductCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest req, UserPrincipal principal) {
        if (principal != null && !principal.isAdmin() && !principal.isManager()) {
            throw new AccessDeniedException("Only Administrators and Managers are permitted to create product categories.");
        }

        String name = req.getName().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("A category with name '" + name + "' already exists.");
        }

        String code = req.getCode() != null && !req.getCode().trim().isEmpty()
                ? req.getCode().trim().toUpperCase().replaceAll("[^A-Z0-9_]", "_")
                : name.toUpperCase().replaceAll("[^A-Z0-9_]", "_");

        if (categoryRepository.existsByCodeIgnoreCase(code)) {
            code = code + "_" + System.currentTimeMillis() % 1000;
        }

        ProductCategoryEntity entity = ProductCategoryEntity.builder()
                .name(name)
                .code(code)
                .description(req.getDescription() != null ? req.getDescription().trim() : null)
                .isSystemDefault(false)
                .build();

        ProductCategoryEntity saved = categoryRepository.save(entity);
        log.info("Category created '{}' ({}) by {}", saved.getName(), saved.getCode(), principal != null ? principal.getName() : "Admin");
        return CategoryResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteCategory(Long id, UserPrincipal principal) {
        if (principal == null || !principal.isAdmin()) {
            throw new AccessDeniedException("Only Administrators are permitted to delete product categories.");
        }

        ProductCategoryEntity entity = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        categoryRepository.delete(entity);
        log.info("Category '{}' deleted by {}", entity.getName(), principal.getName());
    }
}
