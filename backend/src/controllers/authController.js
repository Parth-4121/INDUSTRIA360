const bcrypt = require("bcrypt");
const pool = require("../config/db");

const register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // 1. Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required",
      });
    }

    // 2. Basic password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // 3. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // 5. Get Entrepreneur role
    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = $1",
      ["ENTREPRENEUR"]
    );

    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Entrepreneur role is not configured",
      });
    }

    const entrepreneurRoleId = roleResult.rows[0].id;

    // 6. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 7. Create user
    const result = await pool.query(
      `
      INSERT INTO users
      (
        role_id,
        department_id,
        full_name,
        email,
        password_hash,
        phone
      )
      VALUES ($1, NULL, $2, $3, $4, $5)
      RETURNING
        id,
        full_name,
        email,
        phone,
        is_active,
        created_at
      `,
      [
        entrepreneurRoleId,
        fullName.trim(),
        normalizedEmail,
        passwordHash,
        phone ? phone.trim() : null,
      ]
    );

    // 8. Send safe response
    res.status(201).json({
      success: true,
      message: "Entrepreneur registration successful",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    

    // 3. Find user with role and department information
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.password_hash,
        u.phone,
        u.is_active,
        r.name AS role,
        r.id AS role_id,
        d.name AS department,
        d.code AS department_code
      FROM users u
      JOIN roles r
        ON r.id = u.role_id
      LEFT JOIN departments d
        ON d.id = u.department_id
      WHERE u.email = $1
      `,
      [normalizedEmail]
    );

    // 4. Check user exists
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // 5. Check account status
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // 6. Verify password
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 7. Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // 8. Remove password hash before response
    delete user.password_hash;

    // 9. Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

module.exports = {
  register,
  login,
};

