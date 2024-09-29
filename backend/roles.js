import express from 'express';
import db from './firebaseAdmin.js'; 

const router = express.Router();

router.post('/roles', async (req, res) => {
  const { role, description, accessInventory, accessInventoryHistory, accessPatients } = req.body;

  try {
    const newRoleRef = db.ref(`roles/${role}`);  
    await newRoleRef.set({
      description,
      accessInventory,
      accessInventoryHistory,
      accessPatients,
    });
    
    res.status(201).send({ message: 'Role created successfully' });  
  } catch (error) {
    console.error('Error creating role:', error);  
    res.status(500).send({ error: 'Failed to create role' });
  }
});

export default router; 
