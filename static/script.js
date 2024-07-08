const SEC_TO_MILLISEC = 1000;
const DEFAULT_TODO = {
    short: "",
    description: "",
    priority: 127,
    tags: [],
}

let todos = [];

function addTodo() {
    const addTodoContent = document.querySelector("#addTodoContent");
    const body = structuredClone(DEFAULT_TODO);
    body.short = addTodoContent.value;

    fetch("/add", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
    });
    addTodoContent.value = "";
    update();
}

document.querySelector("#addTodo").addEventListener("click", addTodo);
document.querySelector("#addTodoContent").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTodo();
    }
});

function update() {
    fetch("/get").then((response) => {
        response.json().then((value) => {
            todos = value;
            render();
        });
    });
}

function render() {
    const content = document.querySelector("#content");
    const todoTemplate = document.querySelector("#todoTemplate");
    content.textContent = ""

    for (const [index, todo] of todos.entries()) {
        const todoItem = todoTemplate.content.cloneNode(true);
        const todoTime = todoItem.querySelector("#todoTime");
        const date = new Date(todo.time.secs_since_epoch * SEC_TO_MILLISEC);
        todoTime.textContent = date.toLocaleString();
        const todoText = todoItem.querySelector("#todoText");
        todoText.textContent = todo.short;
        const todoDescription = todoItem.querySelector("#todoDescription");
        todoDescription.textContent = todo.description;

        todoItem.querySelector("#todoTextInput").addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                confirmEditTodoText(event);
            }
        });
        todoItem.querySelector("#todoEditText").addEventListener("click", editTodoText);
        todoItem.querySelector("#todoDescriptionInput").addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                confirmEditTodoDescription(event);
            }
        });
        todoItem.querySelector("#todoEditDescription").addEventListener("click", editTodoDescription);
        // priority
        // tags
        todoItem.querySelector("#todoDelete").addEventListener("click", deleteTodo);

        const todoContainer = todoTime.closest("#todoContainer");
        todoContainer.index = index;

        content.appendChild(todoItem);
    }
}

function editTodoText(event) {
    const todoContainer = event.target.closest("#todoContainer");
    const todoTextInput = todoContainer.querySelector("#todoTextInput");
    const todoText = todoContainer.querySelector("#todoText");

    todoTextInput.value = todoText.textContent;
    todoTextInput.style.display = "initial";
    todoText.style.display = "none";
    todoTextInput.focus();
}

function confirmEditTodoText(event) {
    const todoContainer = event.target.closest("#todoContainer");
    const todoTextInput = todoContainer.querySelector("#todoTextInput");
    const todoText = todoContainer.querySelector("#todoText");

    const body = structuredClone(todos[todoContainer.index]);
    body.short = todoTextInput.value;
    body.index = todoContainer.index;

    fetch("/edit", {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
    }).then(() => {
        todoTextInput.style.display = "none";
        todoText.style.display = "initial";
        update();
    });
}

function editTodoDescription(event) {
    const todoContainer = event.target.closest("#todoContainer");
    const todoDescriptionInput = todoContainer.querySelector("#todoDescriptionInput");
    const todoDescription = todoContainer.querySelector("#todoDescription");

    todoDescriptionInput.value = todoDescription.textContent;
    todoDescriptionInput.style.display = "initial";
    todoDescription.style.display = "none";
    todoDescriptionInput.focus();
}

function confirmEditTodoDescription(event) {
    const todoContainer = event.target.closest("#todoContainer");
    const todoDescriptionInput = todoContainer.querySelector("#todoDescriptionInput");
    const todoDescription = todoContainer.querySelector("#todoDescription");

    const body = structuredClone(todos[todoContainer.index]);
    body.description = todoDescriptionInput.value;
    body.index = todoContainer.index;

    fetch("/edit", {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
    }).then(() => {
        todoDescriptionInput.style.display = "none";
        todoDescription.style.display = "initial";
        update();
    });
}

function deleteTodo(event) {
    const todoContainer = event.target.closest("#todoContainer");
    const index = todoContainer.index;
    fetch("/delete", {
        method: "DELETE",
        body: JSON.stringify(index),
        headers: {
            "Content-Type": "application/json",
        },
    }).then(() => {
        update();
    });
}

update();
render();
