const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ DATA STORAGE ============
const dataFilePath = path.join(__dirname, 'data', 'profiles.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize profiles file if it doesn't exist
if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([]));
}

// ============ HELPER FUNCTIONS ============
const readProfiles = () => {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading profiles:', error);
        return [];
    }
};

const writeProfiles = (profiles) => {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(profiles, null, 2));
    } catch (error) {
        console.error('Error writing profiles:', error);
    }
};

// ============ API ROUTES ============

// GET all profiles
app.get('/api/profiles', (req, res) => {
    try {
        const profiles = readProfiles();
        res.json({
            success: true,
            data: profiles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profiles',
            error: error.message
        });
    }
});

// GET single profile by ID
app.get('/api/profiles/:id', (req, res) => {
    try {
        const { id } = req.params;
        const profiles = readProfiles();
        const profile = profiles.find(p => p.id === id);
        
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        
        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

// POST create new profile
app.post('/api/profiles', (req, res) => {
    try {
        const { name, bio, skills, socialLinks, avatarColor } = req.body;
        
        console.log('Received data:', req.body); // Debug log
        
        // Validation
        if (!name || !bio) {
            return res.status(400).json({
                success: false,
                message: 'Name and Bio are required'
            });
        }

        // Generate avatar initials
        const initials = name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        // Process skills
        let skillsArray = [];
        if (skills) {
            skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
        }

        // Process social links
        let socialLinksArray = [];
        if (socialLinks) {
            const links = socialLinks.split(/[,\n]/).map(s => s.trim()).filter(s => s);
            socialLinksArray = links.map(link => {
                if (!link.startsWith('http://') && !link.startsWith('https://')) {
                    return 'https://' + link;
                }
                return link;
            });
        }

        const profiles = readProfiles();
        
        const newProfile = {
            id: uuidv4(),
            name: name.trim(),
            bio: bio.trim(),
            skills: skillsArray,
            socialLinks: socialLinksArray,
            avatarColor: avatarColor || '#6C63FF',
            initials: initials,
            createdAt: new Date().toISOString()
        };

        profiles.unshift(newProfile);
        writeProfiles(profiles);

        res.status(201).json({
            success: true,
            data: newProfile,
            message: 'Profile created successfully'
        });
    } catch (error) {
        console.error('Error creating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating profile',
            error: error.message
        });
    }
});

// DELETE profile
app.delete('/api/profiles/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        let profiles = readProfiles();
        const profileIndex = profiles.findIndex(p => p.id === id);
        
        if (profileIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        profiles.splice(profileIndex, 1);
        writeProfiles(profiles);

        res.json({
            success: true,
            message: 'Profile deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting profile',
            error: error.message
        });
    }
});

// ============ ROOT ROUTE (for testing) ============
app.get('/', (req, res) => {
    res.json({
        message: 'User Profile API is running!',
        endpoints: {
            profiles: '/api/profiles',
            create: 'POST /api/profiles',
            delete: 'DELETE /api/profiles/:id'
        }
    });
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});