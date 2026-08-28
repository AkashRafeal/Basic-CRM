package com.crm.product.model;

public enum ProductStatus {
    ACTIVE("Active & Sellable"),
    DRAFT("Draft / Staging"),
    DISCONTINUED("Discontinued / Sunset"),
    OUT_OF_STOCK("Out of Stock");

    private final String displayName;

    ProductStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
