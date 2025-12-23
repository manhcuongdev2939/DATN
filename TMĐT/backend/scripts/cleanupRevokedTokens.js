import pool from "../db.js";

async function cleanup() {
  try {
    const [result] = await pool.query(
      "DELETE FROM revoked_tokens WHERE expires_at < NOW()"
    );
    console.log("Cleanup complete. Rows deleted:", result.affectedRows || 0);
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

cleanup();
