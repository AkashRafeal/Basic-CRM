import java.sql.*;
import java.util.*;

public class MigrateLocalDataToSupabase {

    private static final String LOCAL_URL = "jdbc:postgresql://localhost:5432/crm_db";
    private static final String LOCAL_USER = "postgres";
    private static final String LOCAL_PASS = "postgres";

    private static final String SUPABASE_URL = "jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
    private static final String SUPABASE_USER = "postgres.vqoxdxudsoaisqpltxuv";
    private static final String SUPABASE_PASS = "Basic CRM@123";

    private static final String[] ORDERED_TABLES = {
        "crm_departments",
        "crm_users",
        "crm_product_categories",
        "crm_products",
        "crm_leads",
        "crm_lead_products",
        "crm_deals",
        "crm_deal_products",
        "crm_customers",
        "crm_customer_products",
        "crm_contacts",
        "crm_tasks",
        "crm_followups",
        "crm_followup_cadence_configs",
        "crm_pipeline_stage_configs",
        "crm_communication_gateway_configs",
        "crm_communication_logs",
        "crm_call_logs",
        "crm_stakeholder_tags",
        "appointments",
        "appointment_integrations",
        "notes",
        "notifications",
        "activity_logs"
    };

    public static void main(String[] args) {
        try {
            Class.forName("org.postgresql.Driver");

            Properties localProps = new Properties();
            localProps.setProperty("user", LOCAL_USER);
            localProps.setProperty("password", LOCAL_PASS);

            Properties supaProps = new Properties();
            supaProps.setProperty("user", SUPABASE_USER);
            supaProps.setProperty("password", SUPABASE_PASS);
            supaProps.setProperty("ssl", "true");
            supaProps.setProperty("sslmode", "require");
            supaProps.setProperty("prepareThreshold", "0");

            try (Connection localConn = DriverManager.getConnection(LOCAL_URL, localProps);
                 Connection supaConn = DriverManager.getConnection(SUPABASE_URL, supaProps)) {

                System.out.println("Connected to both Local DB (crm_db) and Supabase!");

                for (String table : ORDERED_TABLES) {
                    migrateTable(localConn, supaConn, table);
                }

                System.out.println("\n--- Updating sequences in Supabase ---");
                for (String table : ORDERED_TABLES) {
                    try (Statement stmt = supaConn.createStatement()) {
                        String sql = "SELECT setval(pg_get_serial_sequence('" + table + "', 'id'), COALESCE(max(id), 1), max(id) IS NOT NULL) FROM \"" + table + "\";";
                        stmt.execute(sql);
                    } catch (Exception e) {
                        // ignore if table doesn't have an 'id' column sequence
                    }
                }

                System.out.println("\nALL DATA SUCCESSFULLY MIGRATED TO SUPABASE!");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void migrateTable(Connection localConn, Connection supaConn, String table) {
        System.out.println("\nMigrating table: " + table);
        try {
            // Check if table exists in local
            DatabaseMetaData localMeta = localConn.getMetaData();
            try (ResultSet rs = localMeta.getTables(null, "public", table, null)) {
                if (!rs.next()) {
                    System.out.println("  Table does not exist in local DB. Skipping.");
                    return;
                }
            }

            // Check if table exists in Supabase
            DatabaseMetaData supaMeta = supaConn.getMetaData();
            try (ResultSet rs = supaMeta.getTables(null, "public", table, null)) {
                if (!rs.next()) {
                    System.out.println("  Table does not exist in Supabase. Skipping.");
                    return;
                }
            }

            // Get Supabase columns
            Set<String> supaCols = new LinkedHashSet<>();
            try (ResultSet rs = supaMeta.getColumns(null, "public", table, null)) {
                while (rs.next()) {
                    supaCols.add(rs.getString("COLUMN_NAME").toLowerCase());
                }
            }

            // Read from local
            String selectSql = "SELECT * FROM \"" + table + "\"";
            try (Statement localStmt = localConn.createStatement();
                 ResultSet localRs = localStmt.executeQuery(selectSql)) {

                ResultSetMetaData rsmd = localRs.getMetaData();
                int colCount = rsmd.getColumnCount();

                List<String> matchingCols = new ArrayList<>();
                for (int i = 1; i <= colCount; i++) {
                    String colName = rsmd.getColumnName(i);
                    if (supaCols.contains(colName.toLowerCase())) {
                        matchingCols.add(colName);
                    }
                }

                if (matchingCols.isEmpty()) {
                    System.out.println("  No matching columns. Skipping.");
                    return;
                }

                StringBuilder insertSql = new StringBuilder("INSERT INTO \"").append(table).append("\" (");
                StringBuilder placeholders = new StringBuilder();
                for (int i = 0; i < matchingCols.size(); i++) {
                    if (i > 0) {
                        insertSql.append(", ");
                        placeholders.append(", ");
                    }
                    insertSql.append("\"").append(matchingCols.get(i)).append("\"");
                    placeholders.append("?");
                }
                insertSql.append(") VALUES (").append(placeholders).append(") ON CONFLICT DO NOTHING");

                int inserted = 0;
                try (PreparedStatement supaStmt = supaConn.prepareStatement(insertSql.toString())) {
                    while (localRs.next()) {
                        for (int i = 0; i < matchingCols.size(); i++) {
                            String colName = matchingCols.get(i);
                            Object val = localRs.getObject(colName);
                            supaStmt.setObject(i + 1, val);
                        }
                        try {
                            inserted += supaStmt.executeUpdate();
                        } catch (SQLException ex) {
                            System.err.println("    Error inserting row into " + table + ": " + ex.getMessage());
                        }
                    }
                }

                System.out.println("  -> Successfully migrated " + inserted + " rows into " + table);
            }

        } catch (Exception e) {
            System.err.println("  Error migrating table " + table + ": " + e.getMessage());
        }
    }
}
