const SEC_TO_MILLISEC = 1000;

let todos = [];
let todoItems = [];

function addTodo() {
    const addTodoContent = document.querySelector("#addTodoContent");
    fetch(`add/${addTodoContent.value}`, {method: "POST"});
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
    fetch("get").then((response) => {
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
        todoText.textContent = todo.content;

        todoItem.querySelector("#todoTextInput").addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                confirmEditTodo(event);
            }
        });
        todoItem.querySelector("#todoEditText").addEventListener("click", editTodo);
        todoItem.querySelector("#todoDelete").addEventListener("click", deleteTodo);

        const todoContainer = todoTime.closest("#todoContainer");
        todoContainer.index = index;
        todoItems[todoContainer.index] = index;

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

    const index = todoItems[todoContainer.index];
    fetch(`/edit/${index}/${todoTextInput.value}`, {method:"PATCH"}).then(() => {
        todoTextInput.style.display = "none";
        todoText.style.display = "initial";
        update();
    });
}

function deleteTodo(event) {
    const todoContainer = event.target.closest("#todoContainer");
    const index = todoItems[todoContainer.index];
    fetch(`/delete/${index}`, {method:"DELETE"}).then(() => {
        todoItems[todoContainer.index] = null;
        update();
    });
}

update();
render();
