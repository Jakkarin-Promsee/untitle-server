import { User } from "../models/user.model";

export const ensureEnvAdminAccount = async (): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const adminName = process.env.ADMIN_NAME?.trim() || "System Admin";
  const enforceSingleAdmin =
    process.env.ADMIN_ENFORCE_SINGLE_ADMIN === "true";

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
  } else {
    let hasChanged = false;

    if (existingUser.role !== "admin") {
      existingUser.role = "admin";
      hasChanged = true;
    }

    if (existingUser.name !== adminName) {
      existingUser.name = adminName;
      hasChanged = true;
    }

    // Keep env admin password in sync (hashed by pre-save hook).
    const isSamePassword = await existingUser.comparePassword(adminPassword);
    if (!isSamePassword) {
      existingUser.password = adminPassword;
      hasChanged = true;
    }

    if (hasChanged) {
      await existingUser.save();
      console.log(`✅ Env admin account synchronized: ${adminEmail}`);
    }
  }

  if (enforceSingleAdmin) {
    const demoted = await User.updateMany(
      { role: "admin", email: { $ne: adminEmail } },
      { $set: { role: "user" } },
    );

    if (demoted.modifiedCount > 0) {
      console.log(
        `✅ Demoted ${demoted.modifiedCount} legacy admin account(s) to user`,
      );
    }
  }
};
