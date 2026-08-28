import java.sql.*;
import java.util.Properties;

public class CheckSupabaseRowCounts {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
        String user = "postgres.vqoxdxudsoaisqpltxuv";
        String pass = "Basic CRM@123";

        try {
            Class.forName("org.postgresql.Driver");
            Properties props = new Properties();
            props.setProperty("user", user);
            props.setProperty("password", pass);
            props.setProperty("ssl", "true");
            props.setProperty("sslmode", "require");
            props.setProperty("prepareThreshold", "0");

            try (Connection conn = DriverManager.getConnection(url, props);
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")) {

                System.out.println("Supabase Table Row Counts:");
                while (rs.next()) {
                    String tbl = rs.getString(1);
                    try (Statement cntStmt = conn.createStatement();
                         ResultSet cntRs = cntStmt.executeQuery("SELECT count(*) FROM \"" + tbl + "\"")) {
                        if (cntRs.next()) {
                            System.out.println("  - " + tbl + ": " + cntRs.getLong(1) + " rows");
                        }
                    } catch (Exception e) {
                        System.out.println("  - " + tbl + ": (error counting)");
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
