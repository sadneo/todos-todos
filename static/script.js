const categorySelector = document.querySelector("#categories");
const sortSelector = document.querySelector("#sort");
const todoTemplate = document.querySelector("#todoTemplate");

let categoryOption = 0;
let sortOption = 0;

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

categorySelector.addEventListener("change", (event) => {
    categoryOption = categorySelector.selectedIndex;
    update();
});

sortSelector.addEventListener("change", (event) => {
    sortOption = sortSelector.selectedIndex;
    update();
});

function login() {
    // TODO: get the username and password and login
}
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
    content.textContent = ""
    for (const [index, todo] of todos.entries()) {
        const todoItem = todoTemplate.content.cloneNode(true);
        const todoTime = todoItem.querySelector("#todoTime");
        todoTime.textContent = todo.time.secs_since_epoch;
        const todoText = todoItem.querySelector("#todoText");
        todoText.textContent = todo.content;

        todoItem.querySelector("#todoEditInput").addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                confirmEditTodo(event);
            }
        });
        todoItem.querySelector("#todoEdit").addEventListener("click", editTodo);
        todoItem.querySelector("#todoDelete").addEventListener("click", deleteTodo);

        todoTime.parentElement.id = index;
        todoItems[todoTime.parentElement.id] = index;

        const content = document.querySelector("#content");
        content.appendChild(todoItem);
    }
}

function editTodo(event) {
    let todo = event.target.parentElement;
    let todoEditInput = todo.querySelector("#todoEditInput");
    let todoText = todo.querySelector("#todoText");

    todoEditInput.value = todoText.textContent;
    todoEditInput.style.display = "initial";
    todoText.style.display = "none";
    todoEditInput.focus();
}

function confirmEditTodo(event) {
    let todo = event.target.parentElement;
    let todoEditInput = todo.querySelector("#todoEditInput");
    let todoText = todo.querySelector("#todoText");

    let index = todoItems[todo.id];
    fetch(`/edit/${index}/${todoEditInput.value}`, {method:"PATCH"}).then(() => {
        todoEditInput.style.display = "none";
        todoText.style.display = "initial";
        update();
    });
}

function deleteTodo(event) {
    let todo = event.target.parentElement;
    let index = todoItems[todo.id];
    fetch(`/delete/${index}`, {method:"DELETE"}).then(() => {
        todoItems[todo] = null;
        update();
    });
}

update();
render();
