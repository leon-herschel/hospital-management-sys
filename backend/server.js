import express from 'express';
import rolesRouter from './roles.js'; 

const app = express();

app.use(express.json()); 
app.use('/api', rolesRouter); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
