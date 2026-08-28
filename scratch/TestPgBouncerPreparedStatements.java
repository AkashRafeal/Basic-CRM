import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Properties;

public class TestPgBouncerPreparedStatements {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
        String user = "postgres.vqoxdxudsoaisqpltxuv";
        String password = "Basic CRM@123";

        try {
            Class.forName("org.postgresql.Driver");
            Properties props = new Properties();
            props.setProperty("user", user);
            props.setProperty("password", password);
            props.setProperty("ssl", "true");
            props.setProperty("sslmode", "require");
            props.setProperty("prepareThreshold", "0");

            try (Connection conn = DriverManager.getConnection(url, props)) {
                for (int i = 0; i < 5; i++) {
                    try (PreparedStatement ps = conn.prepareStatement("SELECT count(*) FROM crm_users WHERE email = ?")) {
                        ps.setString(1, "test" + i + "@gmail.com");
                        try (ResultSet rs = ps.executeQuery()) {
                            if (rs.next()) {
                                System.out.println("Query " + i + " result: " + rs.getLong(1));
                            }
                        }
                    }
                }
                System.out.println("✅ All queries succeeded without prepared statement conflict!");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
