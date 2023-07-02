const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql');
const ejs = require('ejs');

const app = express();
const port = 3000;

// Set up body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Set up handlebars as the template engine
app.set('view engine', 'ejs');


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'motor_database',
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to database!');
  }
});
let previous = {
  previousx: 0,
  previousy: 0,
  previousbase: 0,
  previousarm1: 0,
  previousarm2: 0,
  previoustool: 0,
};
// Handle GET request to index page
app.get('/', (req, res) => {
  res.render('index.ejs', { values: {}, errors: {} });
});

// Handle POST request to create a task
app.post('/', (req, res) => {
  const { X, Y, Base, Arm1, Arm2, Tool, TaskName } = req.body;
  const values = { X, Y, Base, Arm1, Arm2, Tool, TaskName };

  // Validate motor values as integers
  const errors = {};
  if (X && !isNumeric(X)) {
    errors['X'] = 'Enter absolute value only';
  }
  if (Y && !isNumeric(Y)) {
    errors['Y'] = 'Enter absolute value only';
  }
  if (Base && !isNumeric(Base)) {
    errors['Base'] = 'Enter absolute value only';
  }
  if (Arm1 && !isNumeric(Arm1)) {
    errors['Arm1'] = 'Enter absolute value only';
  }
  if (Arm2 && !isNumeric(Arm2)) {
    errors['Arm2'] = 'Enter absolute value only';
  }
  if (Tool && !isNumeric(Tool)) {
    errors['Tool'] = 'Enter absolute value only';
  }

  // Check if there are any errors
  if (Object.keys(errors).length === 0) {
    // Insert values into the database
    const sql = `INSERT INTO interview (\`X-Motor\`, \`Y-Motor\`, \`Base-Motor\`, \`Arm1-Motor\`, \`Arm2-Motor\`, \`Tool-Motor\`, \`TaskName\`)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    connection.query(sql, [X, Y, Base, Arm1, Arm2, Tool, TaskName], (err, result) => {
      if (err) {
        console.error('Error creating task:', err);
        res.send(`Error creating task: ${err.message}`);
      } else {
        console.log('Task created successfully!');
        res.redirect('/form');
      }
    });
  } else {
    // Pass the errors to the template
    res.render('index.ejs', { errors,values });
  }
});


// Handle GET request to fetch task names
app.get('/form', (req, res) => {
  const sql = 'SELECT TaskName FROM interview';
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching task names:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      const taskNames = results.map((result) => result.TaskName);
      res.render('form', { taskNames });
    }
  });
});

// Handle POST request for form actions
app.post('/form', (req, res) => {
  const { tasks, action } = req.body;

  if (action === 'delete') {
    // Handle delete action
    if (tasks) {
      const sql = 'DELETE FROM interview WHERE TaskName = ?';
      connection.query(sql, [tasks], (err, result) => {
        if (err) {
          console.error('Error deleting task:', err);
          res.send(`Error deleting task: ${err.message}`);
        } else {
          console.log('Task deleted successfully!');
          res.redirect('/form');
        }
      });
    } else {
      res.send('No task selected for deletion');
    }
  } else if (action === 'modify') {
    if (tasks) {
      res.redirect(`/modify?task=${encodeURIComponent(tasks)}`);
    } else {
      res.send('No task selected for modification');
    }
  } else if (action === 'execute') {
    if (tasks) {
      res.redirect(`/execute?task=${encodeURIComponent(tasks)}`);
    } else {
      res.send('No task selected for execute');
    }
}
});

// Handle GET request to modify task
app.get('/modify', (req, res) => {
  const taskName = req.query.task;
  if (taskName) {
    const sql = 'SELECT * FROM interview WHERE TaskName = ?';
    connection.query(sql, [taskName], (err, results) => {
      if (err) {
        console.error('Error fetching task data:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (results.length > 0) {
          const taskData = results[0];
          res.render('modify', { taskData , errors: {} });
        } else {
          res.send('Task not found');
        }
      }
    });
  } else {
    res.send('Invalid request');
  }

});
// Handle POST request to save modified task
app.post('/modify', (req, res) => {
  const { taskName, X, Y, Base, Arm1, Arm2, Tool, newTaskName } = req.body;

  // Validate motor values as integers
  const errors = {};
  if (X && !isNumeric(X)) {
    errors['X'] = 'Enter absolute value only';
  }
  if (Y && !isNumeric(Y)) {
    errors['Y'] = 'Enter absolute value only';
  }
  if (Base && !isNumeric(Base)) {
    errors['Base'] = 'Enter absolute value only';
  }
  if (Arm1 && !isNumeric(Arm1)) {
    errors['Arm1'] = 'Enter absolute value only';
  }
  if (Arm2 && !isNumeric(Arm2)) {
    errors['Arm2'] = 'Enter absolute value only';
  }
  if (Tool && !isNumeric(Tool)) {
    errors['Tool'] = 'Enter absolute value only';
  }

  // Check if there are any errors
  if (Object.keys(errors).length === 0) {
    // Update the task in the database
    const sql = `UPDATE interview SET \`X-Motor\` = ?, \`Y-Motor\` = ?, \`Base-Motor\` = ?, \`Arm1-Motor\` = ?, \`Arm2-Motor\` = ?, \`Tool-Motor\` = ?, TaskName = ? WHERE TaskName = ?`;
    connection.query(sql, [X, Y, Base, Arm1, Arm2, Tool, newTaskName, taskName], (err, result) => {
      if (err) {
        console.error('Error updating task:', err);
        res.send(`Error updating task: ${err.message}`);
      } else {
        console.log('Task updated successfully!');
        res.redirect('/form');
      }
    });
  } else {
    // Fetch the existing task data from the database
    const sql = 'SELECT * FROM interview WHERE TaskName = ?';
    connection.query(sql, [taskName], (err, results) => {
      if (err) {
        console.error('Error fetching task data:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (results.length > 0) {
          const taskData = results[0];
          // Render the modify.ejs template with the taskData and errors
          res.render('modify', { taskData, errors });
        } else {
          res.send('Task not found');
        }
      }
    });
  }
});


app.get('/execute', (req, res) => {
  const taskName = req.query.task;
  if (taskName) {
    const sql = 'SELECT * FROM interview WHERE TaskName = ?';
    connection.query(sql, [taskName], (err, results) => {
      if (err) {
        console.error('Error fetching task data:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (results.length > 0) {
          const taskData = results[0];
          res.render('execute', { taskData, previous: previous });
          previous = {
            previousx: taskData['X-Motor'],
            previousy: taskData['Y-Motor'],
            previousbase: taskData['Base-Motor'],
            previousarm1: taskData['Arm1-Motor'],
            previousarm2: taskData['Arm2-Motor'],
            previoustool: taskData['Tool-Motor'],
          };
        } else {
          res.send('Task not found');
        }
      }
    
    });
  } else {
    res.send('Invalid request');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// Function to check if a value is numeric
function isNumeric(value) {
  return /^\d+$/.test(value);
}