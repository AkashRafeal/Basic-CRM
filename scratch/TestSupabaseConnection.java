import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Properties;

public class TestSupabaseConnection {
    public static void main(String[] args) {
        String[] urls = {
            "jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require",
            "jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require",
            "jdbc:postgresql://db.vqoxdxudsoaisqpltxuv.supabase.co:5432/postgres?sslmode=require"
        };
        String user = "postgres.vqoxdxudsoaisqpltxuv";
        String password = "Basic CRM@123";

        for (String url : urls) {
            System.out.println("\nTesting connection to: " + url);
            try {
                Class.forName("org.postgresql.Driver");
                Properties props = new Properties();
                props.setProperty("user", user);
                props.setProperty("password", password);
                props.setProperty("ssl", "true");
                props.setProperty("sslmode", "require");

                try (Connection conn = DriverManager.getConnection(url, props);
                     Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT version();")) {
                    if (rs.next()) {
                        System.out.println("✅ Connection successful!");
                        System.out.println("PostgreSQL Version: " + rs.getString(1));
                        return;
                    }
                }
            } catch (Exception e) {
                System.out.println("❌ Failed with error: " + e.getMessage());
            }
        }
    }
}
