const bcrypt = require('bcrypt');
const saltRounds = 10;

// Function hashPassword
export const hashPasswordHelper = async (password: string) => {
    return await bcrypt.hash(password, saltRounds)
}

// Function compare password
export const comparePasswordHelper = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
}

//Function generate random code
export const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

//Function create expire codeId
export const getExpirationTime = (minutes: number = 10) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  };
