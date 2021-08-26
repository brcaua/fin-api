const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const costumers = [];

/*
  app.use(verifyIfExistsAccountCPF) é uma outra maneira de usar middleware
*/
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;
  const costumer = costumers.find((costumer) => costumer.cpf === cpf);

  if (!costumer) {
    return response.status(400).json({ error: "Customer not found" });
  }

  request.costumer = costumer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlredyExists = costumers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlredyExists)
    return response.status(400).json({ error: "costumer already exists" });

  costumers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send();
});

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
  const { costumer } = request;
  return response.json(costumer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;
  const { costumer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  costumer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { costumer } = request;

  const balance = getBalance(costumer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "insufficient funds!" });
  }

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: "debit",
  };

  costumer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
  const { costumer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = costumer.statement.filter((statement) => {
    statement.created_at.toDateString() === new Date(dateFormat).toDateString();
  });

  return response.json(costumer.statement);
});

app.put("/account/", verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { costumer } = request;

  costumer.name = name;

  return response.status(201).send();
});

app.get("/account/", verifyIfExistsAccountCPF, (request, response) => {
  const { costumer } = request;

  return response.json(costumer);
});

app.listen(3333);
