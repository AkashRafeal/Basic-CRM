package com.crm.user;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ClearAllDataExceptUsers {

    @Test
    public void executeWipeExceptUsers() throws Exception {
        String url = "jdbc:postgresql://localhost:5432/crm_db";
        String user = "postgres";
        String pass = "postgres";

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("========================================================================");
            System.out.println("🧹 CRM DATABASE RESET: WIPING ALL TRANSACTIONAL & DEMO DATA");
            System.out.println("========================================================================\n");

            // 1. Discover all tables
            DatabaseMetaData meta = conn.getMetaData();
            List<String> allTables = new ArrayList<>();
            try (ResultSet rs = meta.getTables("crm_db", "public", "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    allTables.add(rs.getString("TABLE_NAME"));
                }
            }

            // 2. WIPE all transactional / operational data
            List<String> tablesToWipe = List.of(
                    "crm_leads",
                    "crm_customers",
                    "crm_contacts",
                    "crm_deals",
                    "crm_tasks",
                    "crm_followups",
                    "crm_products",
                    "crm_call_logs",
                    "crm_communication_logs",
                    "activity_logs",
                    "notes",
                    "appointments",
                    "notifications",
                    "crm_stakeholder_tags"
            );

            try (Statement stmt = conn.createStatement()) {
                for (String t : tablesToWipe) {
                    if (allTables.contains(t)) {
                        stmt.executeUpdate("TRUNCATE TABLE \"" + t + "\" RESTART IDENTITY CASCADE");
                        System.out.println("  ✅ Cleaned table: " + t);
                    }
                }
            }

            // 3. Ensure Standard Departments exist
            try (Statement stmt = conn.createStatement()) {
                stmt.executeUpdate("INSERT INTO crm_departments (id, name, code, description) VALUES " +
                        "(1, 'Sales', 'SALES', 'Core B2B & B2C Revenue Generation Team'), " +
                        "(2, 'Customer Support', 'SUPPORT', 'Customer Service and Ticket Resolution'), " +
                        "(3, 'Marketing', 'MARKETING', 'Inbound & Outbound Campaigns'), " +
                        "(4, 'Executive', 'EXECUTIVE', 'Leadership & Operations Strategy') " +
                        "ON CONFLICT (id) DO NOTHING");
                System.out.println("  ✅ Verified default departments");
            }

            // 4. Ensure Users Table and Default User Accounts exist
            try (Statement stmt = conn.createStatement()) {
                stmt.executeUpdate("CREATE TABLE IF NOT EXISTS crm_users (" +
                        "id BIGSERIAL PRIMARY KEY, " +
                        "name VARCHAR(100) NOT NULL, " +
                        "email VARCHAR(100) NOT NULL UNIQUE, " +
                        "password VARCHAR(255) NOT NULL, " +
                        "role VARCHAR(50) NOT NULL, " +
                        "department VARCHAR(100), " +
                        "department_id BIGINT, " +
                        "team_name VARCHAR(100), " +
                        "manager_id BIGINT, " +
                        "phone_number VARCHAR(50), " +
                        "active BOOLEAN DEFAULT TRUE, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

                // Insert / Update standard user directory
                insertOrUpdateUser(conn, 1L, "KTM Admin", "ktm@gmail.com", encoder.encode("KTM@123"), "ROLE_ADMIN", "Executive", 4L, null, null, "9876543210");
                insertOrUpdateUser(conn, 2L, "Honda Manager", "honda@gmail.com", encoder.encode("Honda@123"), "ROLE_MANAGER", "Sales", 1L, "Superbike Sales", 1L, "9876543211");
                insertOrUpdateUser(conn, 3L, "ZX6R Employee", "zx6r@gmail.com", encoder.encode("ZX6R@123"), "ROLE_EMPLOYEE", "Sales", 1L, "Superbike Sales", 2L, "9876543212");
                insertOrUpdateUser(conn, 4L, "Yamaha Rep", "yamaha@gmail.com", encoder.encode("Yamaha@123"), "ROLE_EMPLOYEE", "Sales", 1L, "Superbike Sales", 2L, "9876543213");
                insertOrUpdateUser(conn, 5L, "Ducati Manager", "ducati@gmail.com", encoder.encode("Ducati@123"), "ROLE_MANAGER", "Customer Support", 2L, "Support Desk", 1L, "9876543214");
                insertOrUpdateUser(conn, 6L, "BMW Rep", "bmw@gmail.com", encoder.encode("BMW@123"), "ROLE_EMPLOYEE", "Customer Support", 2L, "Support Desk", 5L, "9876543215");
                insertOrUpdateUser(conn, 7L, "Sarah Admin", "admin@crm.com", encoder.encode("admin123"), "ROLE_ADMIN", "Executive", 4L, null, null, "9876543216");
                insertOrUpdateUser(conn, 8L, "Marcus Manager", "manager@crm.com", encoder.encode("manager123"), "ROLE_MANAGER", "Sales", 1L, "Enterprise Sales", 1L, "9876543217");
                insertOrUpdateUser(conn, 9L, "Elena Employee", "employee@crm.com", encoder.encode("employee123"), "ROLE_EMPLOYEE", "Sales", 1L, "Enterprise Sales", 8L, "9876543218");
                insertOrUpdateUser(conn, 10L, "Kawasaki Rep", "kawasaki@gmail.com", encoder.encode("Kawasaki@123"), "ROLE_EMPLOYEE", "Sales", 1L, "Superbike Sales", 2L, "9876543219");
                insertOrUpdateUser(conn, 11L, "Suzuki Rep", "suzuki@gmail.com", encoder.encode("Suzuki@123"), "ROLE_EMPLOYEE", "Sales", 1L, "Superbike Sales", 2L, "9876543220");
                insertOrUpdateUser(conn, 12L, "TVS Rep", "tvs@gmail.com", encoder.encode("TVS@123"), "ROLE_EMPLOYEE", "Customer Support", 2L, "Support Desk", 5L, "9876543221");
                insertOrUpdateUser(conn, 13L, "Bajaj Rep", "bajaj@gmail.com", encoder.encode("Bajaj@123"), "ROLE_EMPLOYEE", "Marketing", 3L, "Outreach Team", 1L, "9876543222");
                insertOrUpdateUser(conn, 14L, "Royal Enfield", "royalenfield@gmail.com", encoder.encode("Royal@123"), "ROLE_EMPLOYEE", "Marketing", 3L, "Outreach Team", 1L, "9876543223");
                insertOrUpdateUser(conn, 15L, "Hero Rep", "hero@gmail.com", encoder.encode("Hero@123"), "ROLE_EMPLOYEE", "Customer Support", 2L, "Support Desk", 5L, "9876543224");

                // Sync Sequences
                stmt.execute("SELECT setval('crm_departments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM crm_departments) + 1, false)");
                stmt.execute("SELECT setval('crm_users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM crm_users) + 1, false)");

                System.out.println("  ✅ Verified 15 default users across Admin, Manager, and Employee roles");
            }

            // 5. Print State Verification
            System.out.println("\n========================================================================");
            System.out.println("📊 FINAL DATABASE POST-CLEANUP AUDIT:");
            System.out.println("========================================================================");
            try (Statement stmt = conn.createStatement()) {
                try (ResultSet rs = stmt.executeQuery("SELECT count(*) FROM crm_users")) {
                    if (rs.next()) System.out.println("  👤 crm_users: " + rs.getInt(1) + " (PRESERVED)");
                }
                try (ResultSet rs = stmt.executeQuery("SELECT count(*) FROM crm_departments")) {
                    if (rs.next()) System.out.println("  🏢 crm_departments: " + rs.getInt(1) + " (PRESERVED)");
                }
                for (String t : tablesToWipe) {
                    if (allTables.contains(t)) {
                        try (ResultSet rs = stmt.executeQuery("SELECT count(*) FROM \"" + t + "\"")) {
                            if (rs.next()) System.out.println("  🧹 " + t + ": " + rs.getInt(1) + " rows (WIPED)");
                        } catch (Exception ignored) {}
                    }
                }
            }

            System.out.println("\n🎯 SUCCESS: All CRM operational and test data successfully deleted! User accounts are intact and ready.");
        }
    }

    private void insertOrUpdateUser(Connection conn, Long id, String name, String email, String password, String role,
                                    String department, Long departmentId, String teamName, Long managerId, String phone) throws SQLException {
        String sql = "INSERT INTO crm_users (id, name, email, password, role, department, department_id, team_name, manager_id, phone_number, active, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW()) " +
                "ON CONFLICT (email) DO UPDATE SET " +
                "name = EXCLUDED.name, " +
                "password = EXCLUDED.password, " +
                "role = EXCLUDED.role, " +
                "department = EXCLUDED.department, " +
                "department_id = EXCLUDED.department_id, " +
                "team_name = EXCLUDED.team_name, " +
                "manager_id = EXCLUDED.manager_id, " +
                "phone_number = EXCLUDED.phone_number, " +
                "active = true, " +
                "updated_at = NOW()";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.setString(2, name);
            ps.setString(3, email);
            ps.setString(4, password);
            ps.setString(5, role);
            ps.setString(6, department);
            if (departmentId != null) ps.setLong(7, departmentId); else ps.setNull(7, Types.BIGINT);
            if (teamName != null) ps.setString(8, teamName); else ps.setNull(8, Types.VARCHAR);
            if (managerId != null) ps.setLong(9, managerId); else ps.setNull(9, Types.BIGINT);
            ps.setString(10, phone);
            ps.executeUpdate();
        }
    }
}
