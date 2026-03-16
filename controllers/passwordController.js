import Email from '../utils/emailService.js';
import bcrypt from 'bcrypt';
import  Staff  from '../models/staffModel.js'; 
import  Student  from '../models/studentModel.js';

export const resetPassword = async (req, res) => {
  
    try {
        const {resetCode, newPassword} = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log("Reset Code:", resetCode);
        const staff = await Staff.findByResetCode(parseInt(resetCode));
        if (!staff) {
            const student = await Student.findByResetCode(parseInt(resetCode));
            console.log("Student found with reset code:", student);
            if (!student) {
                return res.status(400).json({ message: 'Invalid or expired reset code.' });
            }
            if (student.resetExpires < Date.now()) {
                return res.status(400).json({ message: 'Reset code has expired.' });
            }
            
            student.password = hashedPassword;
            await Student.changePassword(student.id, hashedPassword);
             return res.status(200).json({ message: 'Password has been reset successfully!' });

        }
        else {
            if (staff.resetExpires < Date.now()) {
                return res.status(400).json({ message: 'Reset code has expired.' });
            }   
            await Staff.updatePassword(staff.id, hashedPassword);
            return res.status(200).json({ message: 'Password has been reset successfully!' });
        }
        
    } catch (error) {
        console.log(error);
      res.status(500).json({ message: 'There was an error resetting the password. Try again later.' });
    }

};

export const changePassword = async (req, res) => {
  // Implementation for change password
};

export const forgotPassword = async (req, res) => {
  
  try {
    const { username } = req.body;
    console.log("Username:", username);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = Date.now() + 10 * 60 * 1000;
    const staff = await Staff.findByUsername( username );
    if (!staff) {
         const student = await Student.findByUsername( username );
         if (student) {
            console.log("Student Email", student.email)
            await Student.resetPassword(student.id, code, resetExpires);
            const emailInstance = new Email(student, code);
            await emailInstance.sendReset();
         } else {
            return res.status(404).json({ message: 'No user found with that username or email.' });
         }   
      return res.status(201).json({ message: 'User found. Reset code sent to email.' });
    } else {
        console.log("Staff Email",staff.email)
            await Staff.resetPassword(staff.id, code, resetExpires);
            const emailInstance = new Email(staff, code);
            await emailInstance.sendReset();
            res.status(200).json({ message: 'Password reset code sent to email!' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'There was an error sending the email. Try again later.' });
  }
};