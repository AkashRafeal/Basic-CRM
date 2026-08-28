import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TestLocalPostgres {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/";
        String user = "postgres";
        String pass = "postgres";

        try (Connection conn = DriverManager.getConnection(url + "postgres", user, pass);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT datname FROM pg_database WHERE datistemplate = false;")) {

            List<String> dbs = new ArrayList<>();
            while (rs.next()) {
                dbs.add(rs.getString(1));
            }
            System.out.println("Available local databases: " + dbs);

            for (String db : dbs) {
                System.out.println("\n--- Checking database: " + db + " ---");
                try (Connection dbConn = DriverManager.getConnection(url + db, user, pass);
                     Statement dbStmt = dbConn.createStatement();
                     ResultSet tableRs = dbStmt.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")) {
                    int count = 0;
                    while (tableRs.next()) {
                        String tbl = tableRs.getString(1);
                        try (Statement cntStmt = dbConn.createStatement();
                             ResultSet cntRs = cntStmt.executeQuery("SELECT count(*) FROM \"" + tbl + "\"")) {
                            if (cntRs.next()) {
                                long rows = cntRs.getLong(1);
                                if (rows > 0) {
                                    System.out.println("  * " + tbl + " -> " + rows + " rows");
                                } else {
                                    System.out.println("    " + tbl + " -> 0 rows");
                                }
                            }
                        } catch (Exception e) {
                            System.out.println("    " + tbl + " (error counting: " + e.getMessage() + ")");
                        }
                        count++;
                    }
                    if (count == 0) {
                        System.out.println("  (No public tables in " + db + ")");
                    }
                } catch (Exception e) {
                    System.out.println("  Failed to connect/inspect " + db + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
