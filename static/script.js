const categorySelector = document.querySelector("#categories");
const sortSelector = document.querySelector("#sort");
const todoTemplate = document.querySelector("#todoTemplate");

let categoryOption = 0;
let sortOption = 0;

let todos = [];

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
            render();
        });
    });
}

function render() {
    content.textContent = ""

    for (todo of todos) {
        const todoNode = todoTemplate.content.cloneNode(true);
        const todoTime = todoNode.querySelector("#todoTime");
        todoTime.textContent = todo.time.secs_since_epoch;
        const todoText = todoNode.querySelector("#todoText");
        todoText.textContent = todo.content;

        const content = document.querySelector("#content");
        content.appendChild(todoNode);
    }
}

update();
render();
