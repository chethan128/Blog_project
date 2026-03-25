const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Access denied. Admin resources only.' });
        }
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
