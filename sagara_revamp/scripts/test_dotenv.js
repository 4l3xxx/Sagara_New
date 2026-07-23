require('dotenv').config();
console.log("PASS:", process.env.ADMIN_1_PASS);
const bcrypt = require('bcrypt');
bcrypt.compare("samuel123", process.env.ADMIN_1_PASS).then(res => {
    console.log("Match:", res);
});
