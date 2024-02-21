const express = require("express");
const cors = require("cors");
const app = express();
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const { restart } = require("nodemon");


app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// First connection pool
const db = mysql.createPool({
   connectionLimit: 100,
   host: "127.0.0.1",
   user: "newuser",
   password: "password1#",
   database: "userDB",
   port: "3306"
});

// Check the connection
db.getConnection((err, connection) => {
   if (err) throw err;
   console.log("DB connected successfully: " + connection.threadId);
   connection.release(); // Release the connection back to the pool
});

// Use dotenv for environment variables
require("dotenv").config();

// Access environment variables
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_PORT = process.env.DB_PORT;

// Second connection pool for a different environment
const dbEnv = mysql.createPool({
   connectionLimit: 100,
   host: DB_HOST,
   user: DB_USER,
   password: DB_PASSWORD,
   database: DB_DATABASE,
   port: DB_PORT
});

// Use 3000 as the default port if PORT is not set
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server Started on port ${port}...`));

app.use(express.json());

// Middleware to read req.body.<params>
// CREATE USER
app.post("/createUser", async (req, res) => {
   const user = req.body.name;
   const hashedPassword = await bcrypt.hash(req.body.password, 10);

   db.getConnection(async (err, connection) => {
      if (err) throw err;

      const sqlSearch = "SELECT * FROM userTable WHERE user = ?";
      const search_query = mysql.format(sqlSearch, [user]);

      const sqlInsert = "INSERT INTO userTable VALUES (0,?,?)";
      const insert_query = mysql.format(sqlInsert, [user, hashedPassword]);

      // ? will be replaced by values
      // ?? will be replaced by string
      await connection.query(search_query, async (err, result) => {
         if (err) throw err;

         console.log("------> Search Results");
         console.log(result.length);

         if (result.length != 0) {
            connection.release();
            console.log("------> User already exists");
            res.sendStatus(409);
         } else {
            await connection.query(insert_query, (err, result) => {
               connection.release();
               if (err) throw err;
               
               const userId = result.insertId;
               console.log(userId);
               res.json({ createUserSuccessful: true, userid: userId });
            });
         }
      }); // end of connection.query()
   }); // end of db.getConnection()
}); // end of app.post()

//LOGIN (AUTHENTICATE USER)
app.post("/login", (req, res)=> {
const user = req.body.name
const password = req.body.password
db.getConnection ( async (err, connection)=> {
    if (err) throw (err)
    const sqlSearch = "Select * from userTable where user = ?"
    const search_query = mysql.format(sqlSearch,[user])
    await connection.query (search_query, async (err, result) => {
        connection.release()
      
      if (err) throw (err)
      if (result.length == 0) {
       console.log("--------> User does not exist")
       res.sendStatus(404)
      } 
      else {
        const hashedPassword = result[0].password
         //get the hashedPassword from result
        if (await bcrypt.compare(password, hashedPassword)) {
        console.log("---------> Login Successful")
      //   res.send(`${user} is logged in!`)
        const userId = result[0].userID;
        console.log(userId);
        res.json({ loginSuccessful: true, userid: userId });
        } 
        else {
        console.log("---------> Password Incorrect")
        res.send("Password incorrect!")
        } //end of bcrypt.compare()
      }//end of User exists i.e. results.length==0
    }); //end of connection.query()
}); //end of db.connection()
}); //end of app.post()

app.get('/retrieveCardioData', (req, res) => {
   const userId = req.query.passedUserID;
   const sqlRunning = "SELECT * FROM runningdata WHERE userID = ?"
   const sqlRunningQuery = mysql.format(sqlRunning, [userId]);

   const sqlGoal = "SELECT * FROM goals WHERE userID = ?"
   const sqlGoalQuery = mysql.format(sqlGoal, [userId]);

   db.getConnection((err, connection) => {
      if (err) {
         console.error("Error getting connection: ", err);
         return res.status(500).json({ error: "Failed to fetch running data." });
      }
      connection.query(sqlRunningQuery, (err, runningResult) => {
         if (err) {
            console.error("Error executing query: ", err);
            return res.status(500).json({ error: "Failed to fetch running data." });
         }

         connection.query(sqlGoalQuery, (goalErr, goalResult) => {
            if (goalErr) {
               console.error("Error executing goal data query: ", err);
               return res.status(500).json({ error: "Failed to fetch goal data." });
            }

            res.json({
               cardioData: runningResult,
               cardioGoalData: goalResult
            });

         })
      });
   });
});

app.post("/addRunningData", (req, res) => {
   console.log('Received POST request at /addRunningData');
   console.log('Request body:', req.body);
   
   const { storedUserID, name, distance, time, pace, date } = req.body;

   db.getConnection((err, connection) => {
       if (err) {
           console.error("Error getting connection: ", err);
           return res.status(500).json({ error: "Failed to add running data." });
       }

       const sql = "INSERT INTO runningdata (userID, name, distance, time, pace, date) VALUES (?, ?, ?, ?, ?, ?)";
       const values = [storedUserID, name, distance, time, pace, date];

       connection.query(sql, values, (err, result) => {
           connection.release();

           if (err) {
               console.error("Error adding running data: ", err);
               return res.status(500).json({ error: "Failed to add running data." });
           }

           console.log("Running data added successfully: ", result);
           res.status(200).json({ success: true });
       });
   });
});

app.post("/addGoal", (req, res) => {
   const {storedUserID, goal, status} = req.body;
   db.getConnection((err, connection) => {
      if (err) {
         console.error("Error getting connection: ", err);
         return res.status(500).json({ error: "Failed to add goal." });
      }
      const sql = "INSERT INTO goals (userID, goal, status) VALUES (?, ?, ?)";
      const values = [storedUserID, goal, status];
      connection.query(sql, values, (err, result) => {
         
         if (err) {
            console.error("Error adding goal: ", err);
            return res.status(500).json({ error: "Failed to add goal." });
         }
         connection.release();
         console.log("Goal added successfully: ", result);
         res.status(200).json({ success: true });
      });
   });
});

app.get("/selectExercise", (req, res) => {
   const retrieveExercises = "SELECT * FROM exercises"
   const exerciseQuery = mysql.format(retrieveExercises);

   db.getConnection((err, connection) => {
      if (err) {
         console.error("Error retrieving exercises: ", err);
         return res.status(500).json({ error: "Failed to fetch exercises." });
      }
      connection.query(exerciseQuery, (err, exerciseResult) => {
         
         if (err) {
            console.error("Error fetching exercise data: ", err);
            return res.status(500).json({ error: "Failed to fetch exercise data." });
         }
         
         connection.release();
         res.json({exerciseList: exerciseResult})
      });
   });
});

app.post("/addWeightGoal", (req, res) => {
   const {storedUserID, goal, status} = req.body;
   db.getConnection((err, connection) => {
      if (err) {
         console.error("Error getting connection: ", err);
         return res.status(500).json({ error: "Failed to add weightlifting goal. "});
      }
      const sql = "INSERT INTO weightgoals (userID, goal, status) VALUES (?, ?, ?)";
      const values = [storedUserID, goal, status];
      connection.query(sql, values, (err, result) => {
         if (err) {
            console.error("Error adding weightlifting goal: ", err);
            return res.status(500).json({ error: "Failed to add goal." });
         }
         connection.release();
         console.log("Weightlifting goal added successfully: ", result);
         res.status(200).json ({ success: true });
      });
   });
});

app.post("/addWorkoutTemplate", (req, res) => {
   const { storedUserID, templateName ,templateJSON } = req.body;

   // Access storedUserID and templateJSON in your server logic
   console.log('Stored UserID:', storedUserID);
   console.log('Template JSON:', templateJSON);
   db.getConnection((err, connection) => {
      if (err) {
         console.error("Error getting connection: ", err);
         return res.status(500).json({ error: "Failed to add weightlifting goal. "});
      }

      // Query to get the latest templateID for the user
      const selectLatestTemplateID = "SELECT MAX(templateID) AS latestTemplateID FROM workouttemplate WHERE userID = ?";

      connection.query(selectLatestTemplateID, [storedUserID], (err, result) => {
         if (err) {
            console.error("Error retrieving latest templateID: ", err);
            connection.release();
            return res.status(500).json({ error: "Failed to retrieve latest templateID." });
         }

         const latestTemplateID = result[0].latestTemplateID || 0; // Use 0 if no previous templateID found

         // Increment the latest templateID by 1 for the new entry
         const newTemplateID = latestTemplateID + 1;

         // SQL query to insert new workout template
         const sql = "INSERT INTO workouttemplate (templateID, userID, exerciseName, sets, reps, templateName) VALUES ?";
         const template = JSON.parse(templateJSON);
         const values = [];

         // Use a for loop to populate the values array
         for (let i = 0; i < template.length; i++) {
            const element = template[i];
            values.push([newTemplateID, storedUserID, element.exerciseName, element.sets, element.reps, templateName]);
         }

         console.log("VALUES ", values);

         connection.query(sql, [values], (err, result) => {            
            if (err) {
               console.error("Error inserting workouttemplate rows: ", err);
               connection.release();
               return res.status(500).json({ error: "Failed to insert workouttemplate rows." });
            }     
            console.log("ROWS INSERTED ALERT");

            // Return success response
            res.json({ success: true });
            // Release the connection after all rows are inserted
            connection.release();
         });
      });
   });
});

app.get('/retrieveWeightliftingData', (req, res) => {
   const userId = req.query.passedUserID;
   const sqlGoal =  "SELECT * FROM weightgoals WHERE userID = ?";
   const sqlGoalQuery = mysql.format(sqlGoal, [userId]);

   db.getConnection((err, connection) => {
      if (err) {
         console.error("Error getting connection: ", err);
         return res.status(500).json({ error: "Failed to fetch weightlifting data. "});
      }
      connection.query(sqlGoalQuery, (err, weightGoalResult) => {
         if (err) {
            console.error("Error executing query: ", err);
            connection.release();
            return res.status(500).json({ error: "Failed to fetch weightlifting goal data." });
         }
         res.json({weightliftingGoalData: weightGoalResult});
         connection.release();
      });
   });
});

app.get('/retrieveWorkoutTemplates', (req, res) => {

   const userId = req.query.passedUserID;
   const sql = "SELECT * FROM workouttemplate WHERE userID = ?";
   const sqlQuery = mysql.format(sql, [userId]);

   db.getConnection((err, connection) => {
      if (err) {
         console.error("Error getting connection: ", err);
         return res.status(500).json({ error: "Failed to fetch workout template data. "});
      }
      connection.query(sqlQuery, (err, workoutTemplateResult) => {
         if (err) {
            console.error("Error executing query: ", err);
            connection.release();
            return res.status(500).json({ error: "Failed to fetch workout template data. "});
         }
         res.json({workoutTemplate: workoutTemplateResult});
         connection.release();
      });
   });
});

app.get('/getTemplateCalendarDates', (req, res) => {
   console.log("RECIEVED GET CALL FOR : getTemplateCalendarDates");
   const userId = req.query.passedUserID;
   const sql = "SELECT * FROM usercalendartemplate WHERE userID = ?";
   const sqlQuery = mysql.format(sql, [userId]);

   db.getConnection((err, connection) => {
      if (err) {
         console.error("Error getting connection: ", err);
         return res.status(500).json({ error: "Failed to fetch dates with template from calendar. "});
      }
      connection.query(sqlQuery, (err, listOfCalendarDates) => {
         if (err) {
            console.error("Error executing getTemplateCalendarDates query: ", err);
            connection.release()
            return res.status(500).json({ error: "Failed to fetch dates with template from calendar. "});
         }
         res.json({templateCalendarRows: listOfCalendarDates});
         connection.release()
      })
   })
})

app.post('/saveTemplateToCalendar', (req, res) => {
   const {userId, date, templateName} = req.body;
   const sql = "INSERT INTO usercalendartemplate (userID, templateName, Date) VALUES (?, ?, ?)";
   console.log("SERVER CODE ", userId);
   db.getConnection((err, connection) => {
      if (err) {
         console.error("Error getting connection: ", err);
         return res.status(500).json({ error: "Failed to add template to calendar. "});
      }

      connection.query(sql, [userId, templateName, date], (err, result) => {
         connection.release(); // release the connection after the query is executed

            if (err) {
                console.error("Error executing query: ", err);
                return res.status(500).json({ error: "Failed to save template to calendar." });
            }

            return res.json({ success: true, message: "Template saved to calendar successfully." });
      });
   });
});

app.delete('/deleteTemplateFromCalendar', (req, res) => {
   const {userId, date} = req.body;
   const sql = "DELETE FROM usercalendartemplate WHERE userID = ? AND Date = ?";  
   db.getConnection((err, connection) => {
      if (err) {
         console.error("Error getting connection: ", err);
         return res.status(500).json({ error: "Failed to delete template to calendar. "});
      }

      connection.query(sql, [userId, date], (err, result) => {
         connection.release(); // release the connection after the query is executed

            if (err) {
                console.error("Error executing query: ", err);
                return res.status(500).json({ error: "Failed to delete template from calendar." });
            }

            return res.json({ success: true, message: "Template deleted from calendar successfully." });
      });
   });
})

app.patch('/alterTemplateFromCalendar', (req, res) => {
   const {userId, date, newTemplateName} = req.body;
   const sql = "UPDATE usercalendartemplate SET templateName = ? WHERE userID = ? AND Date = ?";
   db.getConnection((err, connection) => {
      if (err) {
         console.error("Error getting connection: ", err);
         return res.status(500).json({ error: "Failed to alter template name in calendar. "});
      }
      connection.query(sql, [newTemplateName, userId, date], (err, result) => {
         connection.release();

            if (err) {
               console.error("Error executing alter Template query: ", err);
               return res.status(500).json({ error: "Failed to alter template in calendar. "});
            }
            return res.json({ success: true, message: "Template altered from calendar successfully." });
      })
   })
})