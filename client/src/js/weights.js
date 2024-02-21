const storedUserID = sessionStorage.getItem('userid');
const addressUser = sessionStorage.getItem('username');

document.getElementById('username').textContent = addressUser;
document.getElementById('username').style.fontWeight = '700';

document.getElementById('templateName').placeholder = "Enter Template Name";

fetch(`http://127.0.0.1:3000/retrieveWeightliftingData?passedUserID=${storedUserID}`, {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})
.then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
})
.then(data => {
    // console.log(data);
    // populateTable(data.templateData);
    populateGoals(data.weightliftingGoalData);
})
.catch(error => {
    // Handle errors
    console.error('Error fetching data:', error);
});

fetch(`http://127.0.0.1:3000/retrieveWorkoutTemplates?passedUserID=${storedUserID}`, {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})
.then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
})
.then(data => {
    // console.log("Workout Template Data: ", data.workoutTemplate);
    testing(data.workoutTemplate, 0);
})
.catch(error => {
    console.error('Error fetching data: ', error);
});

function viewExercise() {
    fetch("http://127.0.0.1:3000/selectExercise", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Handle the data received from the server
        // console.log("Exercise List:", data.exerciseList);
        // Set the event listener after fetching data
        document.getElementById("addExercise").addEventListener("click", function() {
            addExerciseRow(data.exerciseList);
        });
        
    })
    .catch(error => {
        // Handle errors
        console.error('Error fetching exercise data:', error);
    });
}

const templateNamesAndDates = [];

async function fetchTemplateCalendarDates() {
    try {
        const response = await fetch(`http://127.0.0.1:3000/getTemplateCalendarDates?passedUserID=${storedUserID}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("DATES FROM GET FETCH: ", data);

        (data.templateCalendarRows).forEach(element => {
            templateNamesAndDates.push({
                storedTemplateName: element.templateName,
                storedDate: element.Date
            });
        });
        
        console.log("TEMPLATE NAMES AND DATES: ", templateNamesAndDates);
        console.log(templateNamesAndDates[0].storedDate);
        generateCalendar(currentMonth);
        // Call the function that needs the fetched data
        // Example: populateCalendar(templateNamesAndDates, cell);

    } catch (error) {
        console.error("Error fetching calendar dates with a template, ", error);
    }
}

// Call the async function
fetchTemplateCalendarDates();

viewExercise();


// MAYBE RECURSIVE? PROBABLY
function testing(data, index) {
    // console.log(data[0].templateID);
    if (index >= data.length) {
        // End of the data array
        return;
    }
    
    const currentTemplateID = data[index].templateID;
    var values = [];

    while (index < data.length && data[index].templateID === currentTemplateID) {
        const { sets, reps, exerciseName, templateName } = data[index];
        values.push({ sets, reps, exerciseName, templateName });
        index++;
    }

    // console.log("Values from testing function: ", values);
    var string = '';
    values.forEach(element => {
        string += element.exerciseName + " " + element.sets + " x " + element.reps + "<br>";
    })
    // console.log(string);
    addElementToGrid(string, values[0].templateName);

    testing(data, index);

}

const gridContainer = document.getElementById('templates');
const templateNames = [];

function addElementToGrid(content, title) {
    const newElement = document.createElement('div');
    newElement.classList.add('grid-item');

    const titleElement = document.createElement('h4');
    titleElement.id = 'grid-item-title';
    titleElement.textContent = title;
    templateNames.push(title);
    const exercises = document.createElement('div');
    exercises.classList.add = 'grid-content';
    exercises.innerHTML = content;

    newElement.appendChild(titleElement);
    newElement.appendChild(exercises);

    gridContainer.appendChild(newElement);
}

let currentMonth = 0;
const table = document.getElementById("calendar");

function daysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

function generateCalendar(monthChange) {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    }

    var date = new Date();
    var month = date.getMonth() + monthChange;
    var year = date.getFullYear();
    if (month > 11) {
        month = 0;
        year += 1;
    } else if (month < 0) {
        month = 11;
        year -= 1;
    }

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];

    // console.log(month);
    // console.log(year);

    var firstDay = new Date(year, month, 1);
    let dayAbbreviation = firstDay.toLocaleString('en-US', { weekday: 'short' });

    let numDay = daysInMonth(month, year);
    // console.log(numDay);

    document.getElementById("calendar-title").innerHTML = monthNames[month] + " " + year;

    // Find the index of the first day
    let startIndex = daysOfWeek.indexOf(dayAbbreviation);

    for (let i = 0; i < 6; i++) {
        let row = table.insertRow();
        for (let j = 0; j < 7; j++) {
            let cell = row.insertCell();
            calendarCellStyle(cell);
            if (i === 0 && j < startIndex) {
                cell.textContent = "";
            } else if (i*7 + j - startIndex + 1 <= numDay) {
                cell.textContent = i*7 + j - startIndex + 1;
                cell.id =  `${i*7 + j - startIndex + 1}`;
                populateCalendar(templateNamesAndDates, cell);
            } else i++;
        }
    }
}

document.getElementById('nextMonth').addEventListener('click', function() {
    currentMonth++;
    generateCalendar(currentMonth);
})

document.getElementById('lastMonth').addEventListener('click', function() {
    currentMonth--;
    generateCalendar(currentMonth);
})

// console.log(templateNames);

const calendarBody = document.querySelector('#calendar tbody');

calendarBody.addEventListener('click', function (e) {
    const cell = e.target.closest('td');
    if (!cell || (cell.innerHTML === '')) {
        return; // Quit, not clicked on a cell
    }
    const row = cell.parentElement;
    // console.log(cell.innerHTML, row.rowIndex, cell.cellIndex, cell.id);
    if (!cell.querySelector('div')) {
        const contentDiv = document.createElement('div');
        contentDiv.style.overflow = 'auto'; // Set overflow on the div
        contentDiv.style.height = '60%'; // Set a fixed height for demonstration purposes
        contentDiv.style.textAlign = 'center';
        var select = document.createElement("select");
        select.style.width = '80%';
        select.style.fontSize = '18px';
        select.style.height = '70%';
        select.style.textAlign = 'center';
        select.style.borderRadius = '20px';
        select.style.border = 'unset';
        select.style.outline = 'none';
        select.style.fontWeight = '700';
        select.style.backgroundColor = '#2ade2a';
        
        templateNames.forEach(name => {
            var option = document.createElement("option");
            option.text = name;
            option.style.backgroundColor = 'white';
            select.add(option);
        });

        var option = document.createElement("option");
        option.text = "Remove";
        option.style.fontStyle = 'italic';
        option.style.fontWeight = 'bold';
        option.style.backgroundColor = 'white';
        select.add(option);

        contentDiv.appendChild(select);
        cell.appendChild(contentDiv);
        
        const curDate = {
            userId: storedUserID,
            date: document.getElementById('calendar-title').textContent + " " + cell.textContent[0], 
            templateName: select.options[select.selectedIndex].text,
        };
    
        console.log("CURDATE = ", curDate);
        
        fetch("http://127.0.0.1:3000/saveTemplateToCalendar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(curDate),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Server response:', data);
        })
        .catch(error => {
            // Handle errors
            console.error('Error:', error);
        });
    } 

});

function populateCalendar(data, cell) {
    console.log("Populate Calendar data: ", data);
    var curMonthYear = document.getElementById("calendar-title").textContent;
    var curDate = cell.id;
    var compareDate = curMonthYear + " " + curDate;
    data.forEach(element => {
        if (compareDate === element.storedDate) {
            const contentDiv = document.createElement('div');
            contentDiv.style.overflow = 'auto'; // Set overflow on the div
            contentDiv.style.height = '60%'; // Set a fixed height for demonstration purposes
            contentDiv.style.textAlign = 'center';
            var select = document.createElement("select");
            select.style.width = '80%';
            select.style.fontSize = '18px';
            select.style.height = '70%';
            select.style.textAlign = 'center';
            select.style.borderRadius = '20px';
            select.style.border = 'unset';
            select.style.outline = 'none';
            select.style.fontWeight = '700';
            select.style.backgroundColor = '#2ade2a';

            templateNames.forEach(name => {
                var option = document.createElement("option");
                option.text = name;
                option.style.backgroundColor = 'white';
                select.add(option);

                if (name === element.storedTemplateName) {
                    option.selected = true;
                }

            });            

            var option = document.createElement("option");
            option.text = "Remove";
            option.style.fontStyle = 'italic';
            option.style.fontWeight = 'bold';
            option.style.backgroundColor = 'white';
            select.add(option);

            contentDiv.appendChild(select);
            cell.appendChild(contentDiv);
        }
    });
}

calendarBody.addEventListener('change', function(e) {
    const select = e.target;
    // document.getElementById('calendar-title').textContent + " " + cell.textContent[0]
    if (select.value === 'Remove') {
        const parentDiv = select.parentElement;
        const cell = parentDiv.parentElement; // Assuming the cell is the parent of the div
        var values = {
            date: document.getElementById('calendar-title').textContent + " " + cell.textContent[0],
            userId: storedUserID,
        }
        // Remove the parent div from the cell
        cell.removeChild(parentDiv);

        fetch('http://127.0.0.1:3000/deleteTemplateFromCalendar', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            // Other headers as needed
        },
            body: JSON.stringify(values),
        })
        .then(response => {
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {

        })
        .catch(error => {
            // Handle errors
            console.error('Error:', error);
        });

    } else if (select.value != 'Remove' && select.selectedIndex!= 0) {
        const parentDiv = select.parentElement;
        const cell = parentDiv.parentElement;
        
        var values = {
            date: document.getElementById('calendar-title').textContent + " " + cell.textContent[0],
            userId: storedUserID,
            newTemplateName: select.value,
        }

        fetch('http://127.0.0.1:3000/alterTemplateFromCalendar', {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(values),
        })
        .then(response => {
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {

        })
        .catch(error => {
            // Handle errors
            console.error('Error:', error);
        });
    }   
});


function calendarCellStyle(cell) {
    cell.style.fontSize = '20px';
    cell.style.height = '100px';
    cell.style.verticalAlign = "top";
    cell.style.textAlign = "end";
}

function applyGoalCellStyle(cell) {
    cell.style.fontFamily = 'Nunito Sans';
    cell.style.border = "none";
    cell.style.borderBottom = "1px solid #ccc";
    cell.style.fontSize = '16px';
    cell.style.padding = '3px';
    cell.style.marginTop = '15px';
    cell.style.marginLeft = '10px';
}

function strikeThrough(text) {
    return text
        .split('')
        .map(char => char + '\u0336')
        .join('')
}

function populateGoals(data) {
    const goalContainer = document.getElementById("goalContentContainer");
    data.forEach(item => {  
        const values = Object.values(item).slice(1, -1);
        console.log("VALUES IS ", values);
        
        var ul = document.createElement('ul');
        ul.style.width = '100%';
        var li = document.createElement('li');
        
        const storedText = document.createElement('input');

        storedText.value = values[0];
        applyGoalCellStyle(storedText);
        
        var checkbox = document.createElement('input');
        
        checkbox.type = 'checkbox';
        if (values[1] === 1) {
            checkbox.checked = true;
            const crossedStoredText = strikeThrough(values[0]);
            storedText.value = crossedStoredText;
        }

        li.appendChild(checkbox);
        li.appendChild(storedText);

        // Append the list item to the goal container
        ul.appendChild(li);
        goalContainer.appendChild(ul);
    });   
}

function addExerciseRow(exercises) {
    var table = document.getElementById("exerciseTable");
    let newRow = table.insertRow(-1);
    for (let i = 0; i < 3; i++) {
        var cell = newRow.insertCell(i);
        
        switch (i) {
            case 0:
                var select = document.createElement("select");
    
                // Populate the select element with options based on exercises
                exercises.forEach(exercise => {
                    var option = document.createElement("option");
                    option.value = exercise.exerciseName;  
                    option.text = exercise.exerciseName;  
                    select.add(option);
                });
                applyTemplateCellStyle(select);
                cell.appendChild(select);
                break;

            case 1:
            case 2:
                var input = document.createElement("input");
                input.type = "number";
                input.min = "1";
                applyTemplateCellStyle(input);
                cell.appendChild(input);
                break;
        }
    }
}


document.getElementById("saveExercise").addEventListener("click", function(e) {
    e.preventDefault();
    console.log('Save button clicked');

    var table = document.getElementById("exerciseTable");
    saveTemplate(table);
});


function saveTemplate(table) {
    // Create an array to store the template rows
    var templateRows = [];
    var templateName = document.getElementById("templateName").value;

    // Loop through each row in the table
    for (var i = 1; i < table.rows.length; i++) {
        var row = table.rows[i];

        // Create an object to represent each row
        var templateRow = {
            exerciseName: row.cells[0].querySelector('select').value,
            sets: row.cells[1].querySelector('input').value,
            reps: row.cells[2].querySelector('input').value
        };

        // Add the row object to the array
        templateRows.push(templateRow);
    }

    // Convert the array to JSON
    var templateJSON = JSON.stringify(templateRows);
    // You can now store or send templateJSON as needed
    console.log(templateJSON);
    
    fetch("http://127.0.0.1:3000/addWorkoutTemplate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            storedUserID,
            templateName,
            templateJSON,
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Handle the response data if needed
        console.log("Template saved successfully:", data);
    })
    .catch(error => {
        // Handle errors
        console.error('Error saving template:', error);
    });
}

function applyTemplateCellStyle(cell) {
    cell.style.width = '100%';
    cell.style.textAlign = 'center';
    cell.style.padding = '4px';
}

function addWeightGoal() {
    var goalContainer = document.getElementById("goalContentContainer");
    var ul = document.createElement('ul');
    var li = document.createElement('li');

    var inputText = document.createElement('input');
    inputText.type = 'text';
    inputText.placeholder = 'Enter goal...';
    applyGoalCellStyle(inputText);
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    li.appendChild(checkbox);
    li.appendChild(inputText);

    ul.appendChild(li);
    
    if (goalContainer.firstChild) {
        goalContainer.insertBefore(ul, goalContainer.firstChild);
    } else {
        goalContainer.appendChild(ul);
    }

    document.getElementById("GoalSave").addEventListener("click", function() {
        saveGoal(inputText.value, checkbox.checked);
    });

}

// NEED TO MAKE THIS HAPPEN ON SAVE BUTTON CLICK NOT AUTOMATICALLY
function saveGoal(goal, status) {
    fetch("http://127.0.0.1:3000/addWeightGoal", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            storedUserID,
            goal,
            status,
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP error! Status: ${response.status}");
        }
        return response.json();
    })
    .then(response => {
        if(!response.ok) {
            throw new Error("HTTP error! Status: ${response.status}");
        }
        console.log("Goal added successfully: ", response);
    })
    .catch(error => {
        console.error("Save failed: ", error);
    });
}

function applyGoalCellStyle(cell) {
    cell.style.fontFamily = 'Nunito Sans';
    cell.style.border = "none";
    cell.style.borderBottom = "1px solid #ccc";
    cell.style.fontSize = '16px';
    cell.style.padding = '3px';
    cell.style.marginTop = '15px';
    cell.style.marginLeft = '10px';
}
