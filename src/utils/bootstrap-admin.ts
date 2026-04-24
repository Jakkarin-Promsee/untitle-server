import { User } from "../models/user.model";

export const ensureEnvAdminAccount = async (): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const adminName = process.env.ADMIN_NAME?.trim() || "System Admin";

  if (!adminEmail || !adminPassword) {
    return;
  }

  const existingUser = await User.findOne({ email: adminEmail });

  if (!existingUser) {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      status: "active",
    });
    console.log(`✅ Env admin account created: ${adminEmail}`);
    return;
  }

  if (existingUser.role !== "admin") {
    existingUser.role = "admin";
    await existingUser.save();
    console.log(`✅ Existing account promoted to admin: ${adminEmail}`);
  }
};
