const SEC_TO_MILLISEC = 1000;
const DEFAULT_TODO = {
    short: "",
    description: "",
    priority: 127,
    tags: [],
}

let todos = [];
let todoItems = [];

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
            todoItems = [];
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

        todoItem.querySelector("#todoTextInput").addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                confirmEditTodo(event);
            }
        });
        todoItem.querySelector("#todoEditText").addEventListener("click", editTodo);
        todoItem.querySelector("#todoDelete").addEventListener("click", deleteTodo);

        const todoContainer = todoTime.closest("#todoContainer");
        todoContainer.index = index;
        todoItems[todoContainer.index] = todo;

        content.appendChild(todoItem);
    }
}

function editTodo(event) {
    const todoContainer = event.target.closest("#todoContainer");
    const todoTextInput = todoContainer.querySelector("#todoTextInput");
    const todoText = todoContainer.querySelector("#todoText");

    todoTextInput.value = todoText.textContent;
    todoTextInput.style.display = "initial";
    todoText.style.display = "none";
    todoTextInput.focus();
}

function confirmEditTodo(event) {
    const todoContainer = event.target.closest("#todoContainer");
    const todoTextInput = todoContainer.querySelector("#todoTextInput");
    const todoText = todoContainer.querySelector("#todoText");

    const body = structuredClone(DEFAULT_TODO);
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
        todoItems[todoContainer.index] = null;
        update();
    });
}

update();
render();
