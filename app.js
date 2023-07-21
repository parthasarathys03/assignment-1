const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
var isMatch = require("date-fns/isMatch");
var format = require("date-fns/format");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server is running http://localhost:3000/");
    });
  } catch (e) {
    console.log(`db error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const hasPriorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = "";
  const { search_q = "", priority, status, category } = request.query;
  let getTodosQuery = "";
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                SELECT
                    *
                FROM
                    todo 
                WHERE
                    status = '${status}'
                    AND priority = '${priority}' ;`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                SELECT
                    *
                FROM
                    todo 
                WHERE
                    status = '${status}'
                    AND  category ='${category}' ;`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case hasPriorityAndCategoryProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
             category= '${category}'
                AND priority = '${priority}'  ;`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case hasPriorityProperty(request.query):
      console.log(priority);
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
             priority = '${priority}';`;

        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
                    SELECT
                        *
                    FROM
                        todo 
                    WHERE
              status = '${status}';`;

        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasSearchProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo  where  todo 
           like '%${search_q}%';`;

      data = await database.all(getTodosQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));

      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
            category = '${category}';`;

        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `
        SELECT
            *
        FROM
            todo;`;

      data = await database.all(getTodosQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
        SELECT
        *
        FROM
          todo
        WHERE
          id= ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(outPutResult(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const result = isMatch(date, "yyyy-MM-dd");
  console.log(result);
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const todoQuery = `
    SELECT * FROm todo WHERE due_date= '${newDate}';`;
    const data = await database.all(todoQuery);
    response.send(data.map((eachItem) => outPutResult(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
        INSERT INTO 
          todo(id,todo,priority,status,category,due_date)
        VALUES
                ( ${id},'${todo}','${priority}' ,'${status}','${category}','${newDate}') ;`;
          await database.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  console.log(requestBody);
  const previousTodoQuery = `
     SELECT
        *
     FROM
          todo
     WHERE
          id= ${todoId};`;

  const previousTodo = await database.get(previousTodoQuery);
  console.log(previousTodo);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;
  console.log(todo, priority, status, category, dueDate);

  let updateTodoQuery = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";

      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
   UPDATE 
     todo
   SET
     todo='${todo}',
     priority= '${priority}',
     status='${requestBody.status}',
     category='${category}',
     due_date='${dueDate}'
   WHERE
    id= ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";

      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `
   UPDATE 
     todo
   SET
     todo='${todo}',
     priority= '${requestBody.priority}',
     status='${status}',
     category='${category}',
     due_date='${dueDate}'
   WHERE
    id= ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      updateTodoQuery = `
   UPDATE 
     todo
   SET
     todo='${requestBody.todo}',
     priority= '${requestBody.priority}',
     status='${status}',
     category='${category}',
     due_date='${dueDate}'
   WHERE
    id= ${todoId};`;

      await database.run(updateTodoQuery);
      response.send(`${updateColumn} Updated`);

      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
   UPDATE 
     todo
   SET
     todo='${todo}',
     priority= '${priority}',
     status='${status}',
     category='${requestBody.category}',
     due_date='${dueDate}'
   WHERE
    id= ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      console.log(requestBody.dueDate);
      updateColumn = "Due Date";
      console.log(isMatch(dueDate, "yyyy-MM-dd"));
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        console.log(newDate);
        const updateTodoQuery = `
   UPDATE 
     todo
   SET
     todo='${todo}',
     priority= '${priority}',
     status='${status}',
     category='${category}',
     due_date='${newDate}'
   WHERE
    id= ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE FROM
          todo
        WHERE
          id= ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
