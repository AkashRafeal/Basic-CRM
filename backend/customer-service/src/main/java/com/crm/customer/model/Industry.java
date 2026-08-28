package com.crm.customer.model;

public enum Industry {
    TECHNOLOGY("Technology & Software"),
    FINANCE("Financial Services & Banking"),
    HEALTHCARE("Healthcare & Life Sciences"),
    MANUFACTURING("Manufacturing & Industrial"),
    RETAIL("Retail & E-Commerce"),
    EDUCATION("Education"),
    SERVICES("Professional Services"),
    OTHER("Other");

    private final String displayName;

    Industry(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
