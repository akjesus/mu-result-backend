// controllers/authController.js
const Staff = require("../models/staffModel");
const Student = require("../models/studentModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

let blacklistedTokens = new Set(); // Store invalid tokens (only works for in-memory)

const JWT_SECRET = process.env.JWT_SECRET; // Store in env file

exports.login = async (req, res) => {
  let user;
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, code: 400, message: "Email and password are required" });
      }
      user = await Staff.findByUsername(email) || await Student.findByUsername(email);
        if (!user) {
        return res.status(401).json({ success: false, code: 401, message: "Invalid Username" });
          }
          if (!user.password) {
          return res.status(500).json({ success: false, code: 500, message: "User record is corrupted. No password found." });
          }
      // Verify password against hashed password
          const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        const rawPassword = user.password === password? true : false;
        if (!rawPassword) {
        return res.status(401).json({ success: false, code: 401, message: "Invalid Password" });
        }}
      // Generate JWT token
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
      res.status(200).json({ 
        success: true,
        code: 200,
        role: user.role,
        message: "Login successful, navigating to Dashboard",
        token,
        user: {
          name: user.first_name,
          email: user.email,
          username: user.username,
        }
      });

    } catch (err) {
      console.log("Login error:", err);
      res.status(500).json({ success: false, code: 500, message: err.message });
    }
  };

  //create admin 
exports.createAdmin = async (req, res) => {
    try {
      const { first_name, last_name, email, username, password } = req.body;
      if (!first_name || !last_name || !email || !username || !password) {
        return res.status(400).json({ success: false, code: 400, message: "All fields are required" });
      }
      const existingUser = await Staff.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({ success: false, code: 409, message: "Username already exists" });
      }
      const newAdminId = await Staff.createStaff(first_name, last_name, email, username, password); 
      if (!newAdminId) {
        return res.status(500).json({ success: false, code: 500, message: "Failed to create admin" });
      }
      res.status(201).json({ success: true, code: 201, message: "Admin created successfully", adminId: newAdminId });
    } catch (err) {
      console.error("Error creating admin:", err);
      res.status(500).json({ success: false, code: 500, message: err.message });
    }
  };


exports.studentLogin = async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
  
      const student = await Student.findByUsername(username);
  
      if (!student) {
        return res.status(401).json({ error: "Invalid Username" });
      }
  
      // Ensure password from DB is not null
      if (!student.password) {
        return res.status(500).json({ error: "User record is corrupted. No password found." });
      }
      // Verify password against hashed password
      const passwordMatch = await bcrypt.compare(password, student.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid Password" });
      }
  
      // Generate JWT token
      const token = jwt.sign({ id: user.id, role: "Student" }, JWT_SECRET, { expiresIn: "24h" });
      res.status(200).json({ message: "Login successful", token });

    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: err.message });
    }
  };

exports.adminLogout = (req, res) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
          return res.status(400).json({ error: "No token provided" });
      }
      blacklistedTokens.add(token);
      res.cookie('jwt', 'Logged Out!', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
  });
      res.json({ message: "Logout successful" });
  };
  
exports.verifyToken = (req, res, next) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token || blacklistedTokens.has(token)) {
          return res.status(401).json({ success: false, code: 401, message: "Unauthorized please login!" });
      }
      jwt.verify(token, JWT_SECRET, (err, user) => {
          if (err) {
              return res.status(403).json({ success: false, code: 403, message: "Invalid token, please login again!" });
          }
          req.user = user;
          next();
      });
  };

exports.refreshToken = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, code: 401, message:"Unauthorized, please login!" });
    } 
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, code: 403, message:"Invalid token" });
        }
        const newToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
        res.status(200).json({ success: true, code: 400, message:"new token created",token: newToken });
    });
  };


exports.getMe = async (req, res) => {
  let user;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({success: false, code: 401, message: "Unauthorized" });
    } 
    const decoded = jwt.verify(token, JWT_SECRET)
    user = await Staff.findById(decoded.id) || await Student.findById(decoded.id);
    if (!user) {
        return res.status(404).json({ success: false, code: 404, message: "User not found" });
    }
   user.password = undefined; // Remove password from response
   return res.status(200).json({success: true, code: 200, user })
   }
   
  catch(err) {
    console.log(err)
    return res.status(500).json({ success: false, code: 500, message: err.message });
    }
    
  };  


exports.restrictTo =  (...roles) =>  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(401).json({ success: false, code: 401, message: "Unauthorised, please contact Super Admin!"});
    }
    next();
  };

exports.changeStudentPassword = async (req, res)=> {
  try {
    const student = await Student.findByIdPass(req.user.id);
    if(!student) {
      return res.status(404).json({success: false, code: 404, message: "No student found"});
    }
  
    const{old_password, new_password, new_password_confirm} = req.body;
    if(!old_password || !new_password || !new_password_confirm){
      return res.status(400).json({success: false, code: 400, message:"All password fields required"})
    }
    if(new_password !== new_password_confirm){
      return res.status(400).json({success: false, code: 500, message:"Passwords must match"})
    }
    //verify old password
    const passwordMatch = bcrypt.compare(old_password, student.password);
    if(!passwordMatch){
      return res.status(403).json({success: false, code: 403, message: "Old password is not correct!"});
    }
  const change =  await Student.changePassword(new_password, student.id)
    return res.status(201).json({success: true, code: 201, message: "password changed successfully", changed: change});
  }
  catch(error) {
    console.log(error.message);
    return res.status(500).json({success: false, code: 500, message:error.message})
  }
}

exports.resetPassword = async (req, res)=> {
  try {
      const {user} = req.body;
  if(!user) return res.status(400).json({success: false, code: 400, message: "No user in request!"});
  const userExists = await Student.findByUsername(user);

  const password = await bcrypt.hash("password", 10)
  if(!userExists) return res.status(404).json({success: false, code: 404, message: "User not found!"});
  const reset = await Student.resetPassword(userExists.id, password);
  if(!reset)  return res.status(500).json({success: false, code: 500, message: "Password not reset, try again!!"})
  return res.status(200).json({success: true, code: 200, message: "Password reset successfully!"})

  }
  catch(error) {
     return res.status(500).json({success: false, code: 500, message: error.message})
  }

}