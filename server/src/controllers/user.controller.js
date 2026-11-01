import * as userService from "../services/user.services.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Cookie HTTP ka kaam hai, isliye controller mein rahi
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: SEVEN_DAYS_MS,
});

const setAuthCookie = (res, token) => res.cookie("token", token, cookieOptions());

// ---------- Register ----------
export const register = async (req, res) => {
  try {
    const result = await userService.registerUser(req.body);

    if (result.status === "invalid") {
      return res.status(400).json({ error: result.error });
    }
    if (result.status === "email_taken") {
      return res.status(400).json({ error: "Email already in use." });
    }

    setAuthCookie(res, result.token);
    return res
      .status(201)
      .json({ message: "User registered successfully", user: result.user });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Server error during registration." });
  }
};

// ---------- Login ----------
export const login = async (req, res) => {
  try {
    const result = await userService.loginUser(req.body);

    if (result.status === "invalid") {
      return res.status(400).json({ error: result.error });
    }
    if (result.status === "invalid_credentials") {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    setAuthCookie(res, result.token);
    return res.json({ message: "Logged in successfully", user: result.user });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error during login." });
  }
};

// ---------- Logout ----------
export const logout = (req, res) => {
  // Same options (minus maxAge), warna kuch browsers cookie clear nahi karte
  const { maxAge, ...clearOptions } = cookieOptions();
  res.clearCookie("token", clearOptions);
  return res.json({ message: "Logged out successfully" });
};

// ---------- Get current user ----------
export const getMe = async (req, res) => {
  try {
    const result = await userService.getCurrentUser({ userId: req.userId });

    if (result.status === "not_found") {
      return res.status(404).json({ error: "User not found." });
    }

    res.setHeader("X-Cache", result.source);
    return res.json(result.user);
  } catch (err) {
    console.error("Get me error:", err);
    return res.status(500).json({ error: "Server error." });
  }
};

// ---------- Update profile ----------
export const updateProfile = async (req, res) => {
  try {
    const result = await userService.updateUserProfile({
      userId: req.userId,
      data: req.body,
    });

    return res.json({
      message: "Profile updated successfully",
      user: result.user,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res
      .status(500)
      .json({ error: "Server error while updating profile" });
  }
};

// ---------- Toggle subscription ----------
export const toggleSubscription = async (req, res) => {
  try {
    const result = await userService.toggleSubscription({
      subscriberId: req.userId,
      channelId: req.params.channelId,
    });

    if (result.status === "self_subscribe") {
      return res
        .status(400)
        .json({ error: "Aap apne channel ko subscribe nahi kar sakte." });
    }
    if (result.status === "not_found") {
      return res.status(404).json({ error: "Channel not found." });
    }

    return res.status(200).json({
      success: true,
      isSubscribed: result.isSubscribed,
      subscriberCount: result.subscriberCount,
    });
  } catch (err) {
    console.error("Subscription error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ---------- Get all subscriptions ----------
export const getAllSubscriptions = async (req, res) => {
  try {
    const result = await userService.getUserSubscriptions({
      userId: req.userId,
    });
    return res.status(200).json({ success: true, subscriptions: result.channels });
  } catch (err) {
    console.error("Error fetching subscriptions:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};