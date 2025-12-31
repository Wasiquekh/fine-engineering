import StorageManager from "./StorageManager";
import AxiosProvider from "./AxiosProvider";

const storage = new StorageManager();
const axiosProvider = new AxiosProvider();

const userId = storage.getUserId();
const userName = storage.getUserName();

class UserActivityLogger {
  // constructor(axiosProvider, storage) {
  //     this.axiosProvider = axiosProvider;
  //     this.userId = storage.getUserId();
  //     this.userName = storage.getUserName();
  //   }

  async log(activity, module, type) {
    try {
      await axiosProvider.post("/loguseractivity", {
        userId: userId,
        userActivity: `#${userId} ${activity}`,
        module: module,
        type: type,
      });
      // console.log("User activity logged successfully");
    } catch (error) {
      console.error("Failed to log user activity:", error);
      throw error; // Re-throw if needed
    }
  }

  async userLogin() {
    await this.log("Login", "System", "Login");
  }
  async crmAdd(userId, activity, module, type) {
    await this.log(`${activity} #${userId}`, module, type);
  }
  async crmUpdate(userId, activity, module, type) {
    await this.log(`${activity} #${userId}`, module, type);
  }
  async crmDelete(userId, activity, module, type) {
    await this.log(`${activity} #${userId}`, module, type);
  }
  async userRegister(userId) {
    await this.log(
      `Registered a user #${userId}`,
      "User Management",
      "Register"
    );
  }
  async userUpdate(userId) {
    await this.log(`Updated user #${userId}`, "User Management", "Update");
  }
  async userDelete(userId) {
    await this.log(`Deleted user #${userId}`, "User Management", "Delete");
  }
  async approvedUser(userId, verification) {
    await this.log(
      `Approved User #${verification} #${userId}`,
      "Customer",
      "Approved"
    );
  }
  async rejectedUser(userId, verification) {
    await this.log(
      `Rejected User #${verification} #${userId}`,
      "Customer",
      "Rejected"
    );
  }
}

export default UserActivityLogger;
