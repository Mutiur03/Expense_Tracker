import { admin } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { uid } = req.body;

    if (!uid) return res.status(400).json({ error: "Missing UID" });

    await admin.auth().deleteUser(uid);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return res.status(500).json({ error: error.message });
  }
}
