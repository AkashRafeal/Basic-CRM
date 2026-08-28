import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Properties;

public class CheckSupabaseTables {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require";
        String user = "postgres.vqoxdxudsoaisqpltxuv";
        String password = "Basic CRM@123";

        try {
            Class.forName("org.postgresql.Driver");
            Properties props = new Properties();
            props.setProperty("user", user);
            props.setProperty("password", password);
            props.setProperty("ssl", "true");
            props.setProperty("sslmode", "require");

            try (Connection conn = DriverManager.getConnection(url, props);
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                     "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")) {
                System.out.println("Tables in public schema:");
                int count = 0;
                while (rs.next()) {
                    System.out.println(" - " + rs.getString(1));
                    count++;
                }
                if (count == 0) {
                    System.out.println("(No tables in public schema yet)");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
